# Production 3D Asset Pipeline

Use this reference when a 3D web task needs external models, textures, HDRIs, animation clips, public assets, asset replacement, or diagnosis of a model that looks wrong or fails to load.

## Contents

- Pipeline
- 1. Asset brief
- 2. Source and provenance
- 3. Intake inspection
- 4. Visual audition gate
- 5. Geometry and texture preparation
- 6. Material and lighting integration
- 7. Runtime integration
- 8. Performance budgets
- 9. Browser validation

## Pipeline

Follow this order:

1. **Brief** the asset in context.
2. **Source** from an attributable, legally usable channel.
3. **Inspect** the file before integrating it.
4. **Audition** it in the target camera, lighting, and composition.
5. **Prepare** geometry, textures, materials, pivots, and LODs.
6. **Integrate** every required decoder before loading the model.
7. **Validate** rendering, performance, failure states, and provenance.

Do not start by downloading whatever looks impressive in isolation. The asset must serve the scene's subject and art direction.

## 1. Asset brief

Write a compact brief before searching:

- semantic role: hero, destination, product, environment, transition prop, or background detail;
- required silhouette from the actual camera angle;
- art direction: photoreal, archival, low-poly, illustrative, industrial, hand-painted, etc.;
- target screen coverage and closest camera distance;
- animation needs: rigid, skeletal, morph, looping, or static;
- platform budget: desktop/mobile, expected DPR, model and texture ceiling;
- licensing/attribution constraints;
- must-have details and forbidden visual traits.

Reject **asset salad**: individually attractive models with no shared era, material language, scale, lighting logic, or relationship to the content.

## 2. Source and provenance

Prefer sources in this order:

1. official manufacturer, institution, mission, museum, or brand resources;
2. a creator's original repository or marketplace listing with an explicit license;
3. reputable public-domain or permissive libraries;
4. generated/custom assets when provenance and likeness constraints permit.

Keep a source manifest near the project:

```md
- Asset name
  - Local: public/models/example.glb
  - Source: https://...
  - Author/owner: ...
  - License: ...
  - Modified: mesh compression, texture resize, material tuning
  - Usage: work scene hero
```

Do not infer a license from downloadability. Do not hotlink production assets. Download them locally, preserve attribution, and record modifications.

## 3. Intake inspection

Run the bundled audit before wiring a loader:

```bash
node "${CODEX_HOME:-$HOME/.codex}/skills/3d-web-design/scripts/audit-gltf.mjs" public/models/example.glb
```

The report identifies scene counts, meshes, primitives, materials, textures, animations, approximate triangles, external dependencies, and glTF extensions.

Treat these extensions as loader contracts:

| Extension | Runtime requirement |
|---|---|
| `KHR_draco_mesh_compression` | Configure `DRACOLoader` before `GLTFLoader.load()` |
| `EXT_meshopt_compression` | Provide `MeshoptDecoder` |
| `KHR_texture_basisu` | Configure `KTX2Loader` and a transcoder path |
| `EXT_texture_webp` | Verify browser support and whether the extension is required |

A model reaching the network successfully does not mean it can decode. Test with the production decoder files served locally and inspect console/network errors.

## 4. Visual audition gate

Preview every candidate in the real scene before committing. Use the final or representative:

- camera position and focal length;
- background and fog;
- key/fill/rim lighting;
- tone mapping and exposure;
- viewport sizes;
- neighboring DOM copy and controls.

Judge:

- recognizable silhouette at target size;
- sufficient detail at the closest camera distance;
- texture resolution and UV quality;
- correct normals and shading continuity;
- believable scale, pivot, orientation, and center;
- no missing pieces, unexpected giant meshes, clipping, or broken transparency;
- thematic coherence with the rest of the scene.

File size is a warning signal, not a quality metric. A tiny educational model may be correct but visibly toy-like; a large scan may still have poor topology or unusable materials.

Do not accept a fallback primitive as a finished visual. A fallback is an error state, not an asset.

## 5. Geometry and texture preparation

- Remove hidden geometry, duplicate materials, unused animation clips, and inaccessible interior detail.
- Fix origin, pivot, scale, up axis, transforms, and normals in DCC tooling when possible.
- Use mesh compression only after visual comparison; keep an uncompressed source asset.
- Create LODs or separate mobile assets when the same model cannot meet both quality and memory targets.
- Resize textures to the smallest resolution that survives the closest shot; avoid 4K maps on small props.
- Preserve color/normal/roughness distinctions: color maps use sRGB; normal, roughness, metalness, AO, and data maps stay linear.
- Prefer packed ORM maps where the toolchain supports them.
- Check alpha mode and double-sided materials deliberately; both can increase cost or break sorting.
- Keep animated rigs minimal and remove unused bones.

Use Blender or glTF Transform for deterministic preparation. Do not destructively optimize the only source copy.

## 6. Material and lighting integration

Preserve physically based intent:

- do not force a minimum metalness across every material;
- do not flatten all roughness values into the same plastic response;
- use an environment map when reflective materials require one;
- set renderer output color space and tone mapping before judging materials;
- clone materials only when per-instance edits are required;
- tune exposure, key/fill ratio, and environment intensity before recoloring textures;
- neutralize or recolor an asset only as part of a declared art direction.

Common "cheap plastic" causes:

- low-detail geometry shown too close;
- broad frontal lighting with strong bloom;
- every surface using similar roughness/metalness;
- saturated accent lights contaminating neutral materials;
- missing environment reflections;
- normal maps treated as color textures;
- unrelated assets unified only by a neon color.

## 7. Runtime integration

Configure decoders before the first load. Keep decoder and transcoder files local when reliability matters.

```js
const draco = new DRACOLoader(manager);
draco.setDecoderPath('/vendor/draco/');
draco.setDecoderConfig({ type: 'wasm' });
draco.preload();

const gltf = new GLTFLoader(manager);
gltf.setDRACOLoader(draco);
```

Also:

- show deterministic loading/error states;
- log the original asset URL and decode error during development;
- mount only active or nearby scenes;
- dispose replaced geometry, materials, and textures;
- avoid loading all high-detail models into the first view unless the screenplay requires it;
- cache shared textures and decoder instances;
- test offline/local serving, not only a warm development cache.

Fallback policy:

- development: conspicuous error marker plus console detail;
- production: intentional reduced visual or hidden prop with DOM content intact;
- never silently replace a hero model with a generic cylinder, sphere, or box.

## 8. Performance budgets

Set budgets from the target hardware and shot, not arbitrary universal numbers. Track at least:

- transfer bytes and decoded texture memory;
- triangles in the active camera view;
- draw calls and material count;
- bones/morph targets and animation cost;
- shader variants and compile time;
- peak memory while switching scenes;
- first useful render and asset-ready time.

Prefer perceptual wins: silhouette and normal detail near camera; simpler geometry and smaller maps in peripheral/background assets.

## 9. Browser validation

Before delivery:

1. Clear/reload and confirm all model, texture, decoder, and transcoder requests return successfully.
2. Inspect console errors after every scene loads.
3. Capture desktop and mobile screenshots of each asset at its closest camera position.
4. Confirm the canvas is nonblank with pixel inspection when possible.
5. Check no model overlaps navigation, copy, or fixed controls.
6. Exercise scene transitions repeatedly and watch for memory growth or stale models.
7. Test reduced motion and the low-quality/mobile tier.
8. Verify the designed fallback by intentionally breaking one asset path, then restore it.
9. Re-run the audit on the final shipped file and update the source manifest.

An asset is accepted only after it passes semantic fit, visual quality, decode reliability, performance, responsive composition, and provenance checks.
