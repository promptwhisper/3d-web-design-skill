#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const help = args.includes('--help') || args.includes('-h');
const rootArg = args.find((arg) => !arg.startsWith('-')) ?? '.';

if (help) {
  console.log('Usage: audit-three-project.mjs [--json] [project-directory]');
  process.exit(0);
}

const root = path.resolve(rootArg);
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Not a directory: ${root}`);
  process.exit(1);
}

const ignoredDirectories = new Set([
  '.git', '.next', '.nuxt', '.output', '.svelte-kit', '.turbo',
  'node_modules', 'dist', 'build', 'coverage', 'out', 'vendor',
]);

const sourceExtensions = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.svelte',
  '.astro', '.html', '.css', '.scss', '.sass', '.less',
]);
const modelExtensions = new Set(['.glb', '.gltf', '.vrm', '.fbx', '.obj', '.dae', '.usdz']);
const textureExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.ktx', '.ktx2', '.basis', '.dds']);
const environmentExtensions = new Set(['.hdr', '.exr']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const audioExtensions = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) walk(absolute, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const stat = fs.statSync(absolute);
    files.push({
      absolute,
      relative: path.relative(root, absolute).split(path.sep).join('/'),
      extension: path.extname(entry.name).toLowerCase(),
      bytes: stat.size,
    });
  }
  return files;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readGltfDocument(file) {
  if (file.extension === '.gltf') return readJson(file.absolute);
  if (file.extension !== '.glb' && file.extension !== '.vrm') return null;

  const handle = fs.openSync(file.absolute, 'r');
  try {
    const header = Buffer.alloc(12);
    if (fs.readSync(handle, header, 0, 12, 0) !== 12 || header.readUInt32LE(0) !== 0x46546c67) {
      throw new Error('invalid GLB header');
    }

    const declaredLength = header.readUInt32LE(8);
    if (declaredLength !== file.bytes) throw new Error(`GLB length mismatch (${declaredLength} != ${file.bytes})`);

    let offset = 12;
    while (offset + 8 <= declaredLength) {
      const chunkHeader = Buffer.alloc(8);
      fs.readSync(handle, chunkHeader, 0, 8, offset);
      const chunkLength = chunkHeader.readUInt32LE(0);
      const chunkType = chunkHeader.readUInt32LE(4);
      offset += 8;
      if (offset + chunkLength > declaredLength) throw new Error('GLB chunk exceeds file length');
      if (chunkType === 0x4e4f534a) {
        const json = Buffer.alloc(chunkLength);
        fs.readSync(handle, json, 0, chunkLength, offset);
        return JSON.parse(json.toString('utf8').replace(/[\u0000\u0020]+$/g, ''));
      }
      offset += chunkLength;
    }
    throw new Error('missing JSON chunk');
  } finally {
    fs.closeSync(handle);
  }
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

function summarizeAssets(files, extensions) {
  const matched = files.filter((file) => extensions.has(file.extension));
  return {
    count: matched.length,
    bytes: matched.reduce((sum, file) => sum + file.bytes, 0),
    largest: matched
      .slice()
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5)
      .map(({ relative, bytes }) => ({ relative, bytes })),
  };
}

const files = walk(root);
const warnings = [];
const packageFiles = files.filter((file) => path.basename(file.relative) === 'package.json');
const packageFile = packageFiles.find((file) => file.relative === 'package.json');
let packageJson = null;

if (packageFile) {
  try {
    packageJson = readJson(packageFile.absolute);
  } catch (error) {
    warnings.push(`package.json could not be parsed: ${error.message}`);
  }
} else {
  warnings.push('No root package.json detected; verify whether this is a script-tag/static project or the wrong directory.');
}

const dependencies = {};
for (const file of packageFiles) {
  try {
    const manifest = file === packageFile && packageJson ? packageJson : readJson(file.absolute);
    Object.assign(
      dependencies,
      manifest?.dependencies ?? {},
      manifest?.devDependencies ?? {},
      manifest?.peerDependencies ?? {},
    );
  } catch (error) {
    if (file !== packageFile) warnings.push(`${file.relative} could not be parsed: ${error.message}`);
  }
}
const dependencyNames = new Set(Object.keys(dependencies));

const stackGroups = {
  render: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
  framework: ['next', 'react', 'vue', 'nuxt', 'svelte', '@sveltejs/kit', 'astro', 'vite'],
  animation: ['gsap', 'motion', 'framer-motion', '@theatre/core', '@theatre/studio'],
  state: ['zustand', 'redux', '@reduxjs/toolkit', 'xstate', 'pinia', 'jotai'],
  physics: ['@react-three/rapier', '@dimforge/rapier3d', '@dimforge/rapier3d-compat', 'cannon-es', 'cannon', '@react-three/cannon'],
  xr: ['@react-three/xr', 'three-mesh-ui'],
};
const stack = Object.fromEntries(
  Object.entries(stackGroups).map(([group, names]) => [group, names.filter((name) => dependencyNames.has(name))]),
);

const patterns = {
  renderer: /WebGLRenderer|WebGPURenderer|<Canvas\b|createRoot\s*\(/,
  semanticMain: /<main\b|role\s*=\s*["']main["']/,
  h1: /<h1\b|createElement\s*\(\s*["']h1["']/,
  metadata: /export\s+const\s+metadata|generateMetadata|<title\b|<Head\b|react-helmet/,
  aria: /aria-[a-z-]+|ariaHidden|ariaLabel/,
  keyboard: /onKeyDown|onKeyUp|addEventListener\s*\(\s*["']key|tabIndex|tabindex/,
  reducedMotion: /prefers-reduced-motion|useReducedMotion|matchMedia\s*\([^)]*reduced-motion/,
  dprTier: /setPixelRatio|\bdpr\s*=|PerformanceMonitor|regress\s*\(/,
  dispose: /\.dispose\s*\(/,
  visibility: /visibilitychange|document\.hidden/,
  contextLoss: /webglcontextlost|webglcontextrestored|contextlost|contextrestored/,
  resizeObserver: /ResizeObserver/,
  compileAsync: /compileAsync\s*\(/,
  instancing: /InstancedMesh|<instancedMesh\b|InstancedBuffer/,
  loading: /LoadingManager|useProgress|<Suspense\b|loading\s*[:=]/,
  errorState: /ErrorBoundary|onError\s*=|catch\s*\([^)]*\)\s*\{|error\s*[:=]/,
  fallback: /fallback|poster\s*=|no[-_ ]?webgl|data-decorative/,
  fixedStep: /fixed[-_ ]?step|accumulator|world\.step\s*\(|physicsWorld\.step\s*\(/,
  stateMachine: /stateMachine|createMachine|\bFSM\b|finite state|GameState/,
  pooling: /ObjectPool|objectPool|pool\.acquire|pool\.release|freeList/,
  animationLoop: /setAnimationLoop\s*\(/,
  requestAnimationFrame: /requestAnimationFrame\s*\(/,
  draco: /DRACOLoader|setDRACOLoader/,
  meshopt: /MeshoptDecoder|setMeshoptDecoder/,
  ktx2: /KTX2Loader|setKTX2Loader|detectSupport\s*\(/,
  webp: /EXT_texture_webp|\.webp["'`)]/,
  tests: /\bdescribe\s*\(|\bit\s*\(|\btest\s*\(/,
};
const signals = Object.fromEntries(Object.keys(patterns).map((key) => [key, false]));

let scannedSourceFiles = 0;
let scannedSourceBytes = 0;
const perFileLimit = 2 * 1024 * 1024;
const totalScanLimit = 40 * 1024 * 1024;

for (const file of files) {
  if (!sourceExtensions.has(file.extension) || file.bytes > perFileLimit || scannedSourceBytes >= totalScanLimit) continue;
  let text;
  try {
    text = fs.readFileSync(file.absolute, 'utf8');
  } catch {
    continue;
  }
  scannedSourceFiles += 1;
  scannedSourceBytes += file.bytes;
  for (const [name, pattern] of Object.entries(patterns)) {
    if (!signals[name] && pattern.test(text)) signals[name] = true;
  }
}

const inventory = {
  files: files.length,
  source: { count: scannedSourceFiles, bytes: scannedSourceBytes },
  models: summarizeAssets(files, modelExtensions),
  textures: summarizeAssets(files, textureExtensions),
  environments: summarizeAssets(files, environmentExtensions),
  video: summarizeAssets(files, videoExtensions),
  audio: summarizeAssets(files, audioExtensions),
};

const licenseFiles = files
  .filter((file) => !file.relative.includes('/') && /^(licen[cs]e|copying)(\.|$)/i.test(path.basename(file.relative)))
  .map((file) => file.relative);
const provenanceFiles = files
  .filter((file) => /(asset|model|texture|media).*(source|licen[cs]e|manifest)|credits?|attribution/i.test(file.relative))
  .map((file) => file.relative)
  .slice(0, 20);

const decoderContracts = {
  extensions: [],
  assets: {},
  parseErrors: [],
};
const gltfFiles = files.filter((file) => file.extension === '.glb' || file.extension === '.gltf' || file.extension === '.vrm');

for (const file of gltfFiles) {
  try {
    const document = readGltfDocument(file);
    const used = [...new Set([...(document?.extensionsUsed ?? []), ...(document?.extensionsRequired ?? [])])];
    decoderContracts.assets[file.relative] = used;
    for (const extension of used) {
      if (!decoderContracts.extensions.includes(extension)) decoderContracts.extensions.push(extension);
    }
  } catch (error) {
    decoderContracts.parseErrors.push(`${file.relative}: ${error.message}`);
  }
}

const hasThree = stack.render.length > 0 || signals.renderer;
const hasPhysics = stack.physics.length > 0;
const assetBytes = inventory.models.bytes + inventory.textures.bytes + inventory.environments.bytes + inventory.video.bytes + inventory.audio.bytes;

if (hasThree && !signals.reducedMotion) warnings.push('No reduced-motion handling detected; provide a parallel low-motion/static path.');
if (hasThree && !signals.dprTier) warnings.push('No DPR cap or runtime quality-tier signal detected.');
if (hasThree && !signals.visibility) warnings.push('No visibilitychange/document.hidden handling detected; suspend render, simulation, video, and audio when hidden.');
if (hasThree && inventory.models.count > 0 && !signals.dispose) warnings.push('Models are present but no explicit dispose() signal was detected; review route/scene cleanup.');
if (hasThree && !signals.contextLoss) warnings.push('No WebGL context-loss handler detected; verify recovery or document how the static fallback covers context loss.');
if (hasThree && !signals.fallback) warnings.push('No obvious poster/no-WebGL/error fallback signal was detected.');
if (hasThree && !signals.semanticMain && !signals.fixedStep) warnings.push('No semantic <main>/role=main signal detected; verify DOM ownership for website content.');
if (hasThree && !signals.h1 && !signals.fixedStep) warnings.push('No semantic H1 signal detected; verify the primary page heading exists outside Canvas.');
if (hasPhysics && !signals.fixedStep) warnings.push('A physics dependency is present but no fixed/semi-fixed stepping signal was detected.');
if (signals.requestAnimationFrame && !signals.animationLoop && stack.render.includes('three')) warnings.push('Manual requestAnimationFrame detected without setAnimationLoop; verify XR/WebGPU compatibility and clock ownership.');
if (!licenseFiles.length) warnings.push('No root LICENSE/COPYING file detected; public distribution/reuse terms need review.');
if (assetBytes > 0 && !provenanceFiles.length) warnings.push('Media/3D assets are present but no source/license/credits manifest filename was detected.');
if (decoderContracts.extensions.includes('KHR_draco_mesh_compression') && !signals.draco) warnings.push('A glTF uses Draco compression but no DRACOLoader configuration signal was detected.');
if (decoderContracts.extensions.includes('EXT_meshopt_compression') && !signals.meshopt) warnings.push('A glTF uses Meshopt compression but no MeshoptDecoder configuration signal was detected.');
if (decoderContracts.extensions.includes('KHR_texture_basisu') && !signals.ktx2) warnings.push('A glTF uses Basis/KTX2 textures but no KTX2Loader configuration signal was detected.');
if (decoderContracts.extensions.includes('EXT_texture_webp') && !signals.webp) warnings.push('A glTF uses EXT_texture_webp; verify browser support/fallback and runtime handling.');
for (const file of files.filter((item) => modelExtensions.has(item.extension) && item.bytes > 15 * 1024 * 1024)) {
  warnings.push(`Large model transfer: ${file.relative} (${formatBytes(file.bytes)}). Verify LOD/mobile/streaming policy.`);
}
if (assetBytes > 50 * 1024 * 1024) warnings.push(`Tracked media/3D assets total ${formatBytes(assetBytes)}; verify initial-route loading and decoded memory, not only transfer size.`);
for (const error of decoderContracts.parseErrors) warnings.push(`Could not inspect glTF contract: ${error}`);
if (scannedSourceBytes >= totalScanLimit) warnings.push(`Source scan stopped at ${formatBytes(totalScanLimit)}; review very large/generated source files separately.`);

const report = {
  root,
  package: packageJson ? { name: packageJson.name ?? null, version: packageJson.version ?? null, manifestsScanned: packageFiles.length } : null,
  stack,
  inventory,
  licenses: { rootFiles: licenseFiles, provenanceFiles },
  decoderContracts,
  signals,
  warnings,
};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

console.log(`\nThree.js project audit: ${root}`);
console.log(`Package: ${report.package ? `${report.package.name ?? 'unnamed'} ${report.package.version ?? ''}`.trim() : 'not detected'}`);
if (packageFiles.length > 1) console.log(`Package manifests scanned: ${packageFiles.length}`);
for (const [group, values] of Object.entries(stack)) {
  if (values.length) console.log(`${group}: ${values.join(', ')}`);
}

console.log('\nInventory');
console.log(`  Files: ${inventory.files}; scanned source: ${inventory.source.count} (${formatBytes(inventory.source.bytes)})`);
for (const key of ['models', 'textures', 'environments', 'video', 'audio']) {
  const item = inventory[key];
  console.log(`  ${key}: ${item.count} (${formatBytes(item.bytes)})`);
  for (const largest of item.largest.slice(0, 3)) {
    console.log(`    ${formatBytes(largest.bytes)}  ${largest.relative}`);
  }
}

console.log('\nRights and provenance');
console.log(`  Root license: ${licenseFiles.join(', ') || 'not detected'}`);
console.log(`  Asset manifests/credits: ${provenanceFiles.join(', ') || 'not detected'}`);

console.log('\nDetected production signals');
const signalNames = Object.entries(signals).filter(([, value]) => value).map(([name]) => name);
console.log(`  ${signalNames.join(', ') || 'none'}`);

console.log('\nDecoder contracts');
console.log(`  ${decoderContracts.extensions.join(', ') || 'none detected'}`);

console.log('\nReview findings');
if (!warnings.length) console.log('  No static warnings. Browser, visual, performance, and interaction QA are still required.');
for (const warning of warnings) console.log(`  WARN: ${warning}`);
