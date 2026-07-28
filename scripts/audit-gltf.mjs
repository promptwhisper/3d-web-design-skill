#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const files = args.filter((arg) => arg !== '--json');

if (!files.length) {
  console.error('Usage: audit-gltf.mjs [--json] <asset.glb|asset.gltf> [...]');
  process.exit(1);
}

function readDocument(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.gltf') return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (extension !== '.glb') throw new Error('Expected a .glb or .gltf file');

  const buffer = fs.readFileSync(file);
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== GLB_MAGIC) throw new Error('Invalid GLB header');
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) throw new Error(`GLB length mismatch: header=${declaredLength}, file=${buffer.length}`);

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + chunkLength;
    if (end > buffer.length) throw new Error('GLB chunk extends beyond file length');
    if (chunkType === JSON_CHUNK) {
      return JSON.parse(buffer.subarray(start, end).toString('utf8').replace(/[\u0000\u0020]+$/g, ''));
    }
    offset = end;
  }
  throw new Error('GLB has no JSON chunk');
}

function primitiveTriangles(primitive, accessors) {
  const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION;
  const count = accessors?.[accessorIndex]?.count ?? 0;
  const mode = primitive.mode ?? 4;
  if (mode === 4) return Math.floor(count / 3);
  if (mode === 5 || mode === 6) return Math.max(0, count - 2);
  return 0;
}

function summarize(file) {
  const document = readDocument(file);
  const meshes = document.meshes ?? [];
  const primitives = meshes.flatMap((mesh) => mesh.primitives ?? []);
  const extensionsUsed = document.extensionsUsed ?? [];
  const extensionsRequired = document.extensionsRequired ?? [];
  const images = document.images ?? [];
  const externalUris = [
    ...(document.buffers ?? []).map((item) => item.uri),
    ...images.map((item) => item.uri),
  ].filter((uri) => uri && !uri.startsWith('data:'));

  const decoderContracts = [];
  if (extensionsUsed.includes('KHR_draco_mesh_compression')) decoderContracts.push('DRACOLoader');
  if (extensionsUsed.includes('EXT_meshopt_compression')) decoderContracts.push('MeshoptDecoder');
  if (extensionsUsed.includes('KHR_texture_basisu')) decoderContracts.push('KTX2Loader/transcoder');
  if (extensionsUsed.includes('EXT_texture_webp')) decoderContracts.push('WebP-capable runtime/fallback');

  const warnings = [];
  if (!document.materials?.length) warnings.push('No materials declared.');
  if (externalUris.length) warnings.push(`${externalUris.length} external URI(s) must ship beside the model.`);
  if (decoderContracts.length) warnings.push(`Configure before load: ${decoderContracts.join(', ')}.`);
  if (primitives.length > 500) warnings.push(`${primitives.length} primitives may create excessive draw calls; inspect merging/instancing/LOD options.`);
  if ((document.materials?.length ?? 0) > 80) warnings.push('High material count; inspect duplicate or mergeable materials.');
  if (fs.statSync(file).size > 15 * 1024 * 1024) warnings.push('Transfer size exceeds 15 MB; verify device-tier strategy.');

  return {
    file: path.resolve(file),
    bytes: fs.statSync(file).size,
    asset: document.asset ?? {},
    counts: {
      scenes: document.scenes?.length ?? 0,
      nodes: document.nodes?.length ?? 0,
      meshes: meshes.length,
      primitives: primitives.length,
      approximateTriangles: primitives.reduce((sum, primitive) => sum + primitiveTriangles(primitive, document.accessors), 0),
      materials: document.materials?.length ?? 0,
      textures: document.textures?.length ?? 0,
      images: images.length,
      animations: document.animations?.length ?? 0,
      skins: document.skins?.length ?? 0,
      cameras: document.cameras?.length ?? 0,
    },
    imageTypes: [...new Set(images.map((image) => image.mimeType ?? (image.uri ? path.extname(image.uri) : 'embedded/unknown')))],
    extensionsUsed,
    extensionsRequired,
    decoderContracts,
    externalUris,
    warnings,
  };
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit ? 2 : 0)} ${units[unit]}`;
}

const reports = [];
let failed = false;
for (const file of files) {
  try {
    reports.push(summarize(file));
  } catch (error) {
    failed = true;
    reports.push({ file: path.resolve(file), error: error.message });
  }
}

if (jsonMode) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  for (const report of reports) {
    console.log(`\n${report.file}`);
    if (report.error) {
      console.log(`  ERROR: ${report.error}`);
      continue;
    }
    console.log(`  Size: ${formatBytes(report.bytes)}`);
    console.log(`  Generator: ${report.asset.generator ?? 'unknown'} (glTF ${report.asset.version ?? 'unknown'})`);
    console.log(`  Geometry: ${report.counts.meshes} meshes, ${report.counts.primitives} primitives, ~${report.counts.approximateTriangles.toLocaleString()} triangles`);
    console.log(`  Surface: ${report.counts.materials} materials, ${report.counts.textures} textures, ${report.counts.images} images`);
    console.log(`  Motion: ${report.counts.animations} animations, ${report.counts.skins} skins`);
    console.log(`  Extensions used: ${report.extensionsUsed.join(', ') || 'none'}`);
    console.log(`  Extensions required: ${report.extensionsRequired.join(', ') || 'none'}`);
    console.log(`  Image types: ${report.imageTypes.join(', ') || 'none'}`);
    if (report.externalUris.length) console.log(`  External URIs: ${report.externalUris.join(', ')}`);
    for (const warning of report.warnings) console.log(`  WARN: ${warning}`);
  }
}

process.exitCode = failed ? 2 : 0;
