# 3D Web Design — Technique Catalog

Code-level patterns behind [SKILL.md](SKILL.md). Snippets are minimal; adapt to your stack. Each notes its source.

Sources: `portfolio-itom` (hand-drawn infinite corridor), and Codrops case studies — Sketching the Impossible (ITom), GSAP Shader Wipes (Guignand), Blender Camera Path (Hedde), Susurrus (Wei), False Earth (Hung), Shopify Everywhere (Thelander), Shader.se (Kantedal), Depth Gallery (Kane), Wave Cube Grid (Franky Hung), Webflow Transitions (Ruffini), Dithering Cubes (Pramudita), Podium, [The Journey of Creating a 3D Portfolio (Merouane Bali)](https://tympanus.net/codrops/2025/01/21/the-journey-of-creating-a-3d-portfolio/).

---

## A. Architecture & structure

**Class-based singleton (vanilla / Bruno-Simon style).** One `Experience` owns scene/camera/renderer/resources/world and *survives navigation*. Each file one responsibility, kept short.
```
Experience (singleton) → Camera, Renderer, World, Resources, Sizes, Time
```
Depth-gallery variant: `Engine` (scene) · `Gallery` (planes) · `Scroll` (camera) · `Background` (mood). Wave-grid variant: `Orchestrator` · `Camera` · `Renderer` · `Stage` · `Effects/` · `Utils/`.

**R3F variant.** Components for scene graph; **hooks** own per-component lifecycle, **services/stores** (Zustand) own singletons that outlive routes (scroll position belongs to the document, not the page). Shaders: one folder per effect.

**DOM ↔ WebGL bridge** (Merouane Bali) — a WebGL scene doesn't natively talk to HTML. Use a shared store (React Context or Zustand) as a two-way bridge so DOM controls can drive the scene (render quality, sound toggle, enter/exit) and the scene can update the DOM:
```jsx
const SharedState = createContext();
export const SharedStateProvider = ({ children }) => {
  const [isInScene, setIsInScene] = useState(true);
  const [quality, setQuality] = useState('high');
  return <SharedState.Provider value={{ isInScene, setIsInScene, quality, setQuality }}>{children}</SharedState.Provider>;
};
export const useSharedState = () => useContext(SharedState);
// <WebGLScene/> reads it in useFrame via ref/getState (not as render-triggering state); <WebsiteLayout/> mutates it from buttons.
```
Note: for *high-frequency* values (scroll/pointer) prefer Zustand `getState()` / refs so you don't re-render React each frame (see §I). Context is fine for *discrete* controls (quality tier, mute, active section).

**Parent-controlled render order** (multi-scene compositing) — use `useImperativeHandle`, not `useFrame`, so the parent decides order and passes textures between scenes (Shader.se):
```tsx
useImperativeHandle(renderHandle, () => ({ state, nextSceneTexture }) => {
  nextSceneTextureUniform.value = nextSceneTexture;
  state.gl.setRenderTarget(fbo);
  state.gl.render(scene, camera);
  state.gl.setRenderTarget(null);
  return fbo.texture;
});
// parent: one useFrame calls scenes in reverse order, feeding each texture to the previous
```

---

## B. Input & Scroll

**GSAP `Observer` unifies wheel/touch/pointer** — the single most reused input pattern:
```js
Observer.create({
  target: window, type: 'wheel,touch,pointer',
  onChange: (self) => { targetT += self.deltaY * SENSITIVITY; setCamT(targetT); },
});
const SENSITIVITY = 1 / (window.innerHeight * 4); // scale by viewport for device consistency
```

**Target vs smoothed value** — react instantly, move smoothly:
```js
// GSAP quickTo (reuses one tween — no per-frame GC)
const setCamT = gsap.quickTo(camProxy, 't', { duration: 1, ease: 'power3.out' });
// or manual lerp
scrollCurrent = THREE.MathUtils.lerp(scrollCurrent, scrollTarget, 0.08);
```

**Velocity as a reusable signal** (drives background/tilt/breath) (Depth Gallery):
```js
rawVelocity = scrollCurrent - prevScrollCurrent;
velocity = lerp(velocity, rawVelocity, damping);
velocity = clamp(velocity, -max, max);
if (Math.abs(velocity) < stopThreshold) velocity = 0; // kill flicker at rest
```

**Bounds** — clamp *both* target and current or smoothing overshoots:
```js
scrollTarget  = THREE.MathUtils.clamp(scrollTarget,  min, max);
scrollCurrent = THREE.MathUtils.clamp(scrollCurrent, min, max);
```

Smooth-scroll libs: **Lenis**, synced to GSAP's ticker as a single source of truth. Snap between scenes by modifying Lenis + Observer thresholds.

---

## C. Camera systems

**Curve-driven camera** (Blender → JSON → Three) (Hedde):
```python
# Blender: export curve points, remap axes (Blender Z-up → Three Y-up)
points.append([round(co.x,3), round(co.z,3), round(-co.y,3)])
```
```js
const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5); // true = closed loop
// per frame:
const t = ((1 - camProxy.t) % 1 + 1) % 1;      // wrap into [0,1), reverse dir
const p = curve.getPoint(t);
camera.position.set(p.x, p.y, p.z + CAM_Z);
// loop-aware distance: if (dt > 0.5) dt = 1 - dt;
```

**Auto-glance toward doors/POIs** — start/peak/end proximity with eased strength (ITom):
```js
if (dist > PEAK && dist < START) strength = (START - dist)/(START - PEAK);
else if (dist <= PEAK && dist > END) strength = (dist - END)/(PEAK - END);
const eased = strength * (2 - strength); // easeOutQuad
```
On releasing GSAP camera control back to scroll, derive the glance from *current* rotation to avoid a snap.

**Frustum-fit a camera to a screen mesh** (Shader.se) — for "fly into the monitor" transitions:
```js
const normal = new Vector3(0,0,1).applyQuaternion(planeQuat).normalize();
const distance = viewportAspect < planeAspect
  ? planeScale.y/2 / Math.tan(fov/2)
  : planeScale.x/2 / (Math.tan(fov/2) * viewportAspect);
camPos = planePos.clone().add(normal.multiplyScalar(distance * 0.9));
```

**Damped mouse/gyro parallax.** Store pointer offset from center; lerp camera/group toward it each frame (`easeFactor ≈ 0.08`). Gyroscope on mobile.

---

## D. Instancing & GPU-driven rendering

**InstancedMesh + per-instance attribute** — N objects, 1 draw call; animate in shader (Wave Grid, Dithering, X-Ray):
```js
const geo = new THREE.BoxGeometry(...);
geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(count*2), 2));
const mesh = new THREE.InstancedMesh(geo, material, count);
const dummy = new THREE.Object3D();
for (let i=0;i<count;i++){ dummy.position.set(...); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }
mesh.instanceMatrix.needsUpdate = true;
```

**Per-frame retargeting for hundreds of objects** — `quickTo`, never new tweens (Hedde):
```js
const setScale = gsap.quickTo(proxy, 'value', { duration:0.4, ease:'power3.out',
  onUpdate: () => mesh.scale.setScalar(proxy.value) });
// each frame: setScale(targetScale)  // updates existing tween
```

**Data to GPU without CPU loop** — `DataTexture` (Wave Grid) or `CanvasTexture` (X-Ray) as a bridge; flag `needsUpdate` only when data changed. Pack per-instance data into `vec4`s for alignment.

**WebGPU GPU-driven pipeline** (False Earth) — for >100k dynamic instances:
- **Storage buffers** hold structured per-instance data; **compute shader** fills them (no pixel-packing).
- **Indirect draw**: `geometry.setIndirect(drawBuffer)`; a compute pass resets `instanceCount`, appends visible indices via `atomicAdd`, GPU decides how many to draw → ~80% culled never hit the vertex shader.
- **GPU LOD**: same indirect pattern into per-density buckets by camera distance; jitter the distance test with per-instance noise to hide LOD rings.
- **Circular buffer** for spawn/recycle: `atomicAdd(index,1) % maxCount`.
- **VAT** (vertex animation texture): bake animation into a texture, replay in shader.
- **Infinite field**: grid snaps forward on camera boundary crossing; world position as deterministic seed keeps content stable across snaps.

---

## E. Shaders & materials

**Extend a stock material via `onBeforeCompile`** — keeps UV/colorspace/transparency working; inject GLSL (ITom paint-reveal, Wave Grid waves):
```js
material.onBeforeCompile = (shader) => {
  shader.uniforms.uProgress = { value: 0 };
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\nuniform float uProgress; ...noise...`)
    .replace('#include <map_fragment>', `#include <map_fragment>
      if (uProgress > 0.001) {
        vec4 painted = texture2D(uMapPainted, vMapUv);
        float rn = paintNoise(vMapUv*15.0)*0.15;
        float mask = (1.0 - vMapUv.y) + rn;      // organic reveal direction
        if (mask < uProgress*1.5) diffuseColor = vec4(painted.rgb, 1.0);
      }`);
  material.customProgramCacheKey = () => 'paintReveal_v1';
};
```
Sync a **`customDepthMaterial`** with the same vertex override so shadows match deformed geometry.

**The GSAP↔uniform bridge** (Guignand) — the master pattern. A single JS number tweened by GSAP, copied to a uniform each frame; shader is stateless:
```js
gsap.to(state, { progress: 1, ease: 'power2.inOut', onUpdate: () => mat.uniforms.uProgress.value = state.progress });
```

**Ping-pong FBO** (fluid/trail sims — read A, write B, swap) (X-Ray):
```js
renderer.setRenderTarget(targetB); renderer.render(fboScene, fboCamera); renderer.setRenderTarget(null);
[targetA, targetB] = [targetB, targetA];
// fboScene = fullscreen quad + orthographic cam; shader samples prev target + input
```

**NPR / painterly** (Susurrus) — style as identity & perf strategy:
- Single post-process pass (Kuwahara filter) defines the whole look; start it *before* finishing models.
- Fullscreen-quad shader with NDC vertex (`gl_Position = vec4(position,1.0)`) skips MVP for speed.
- Reflective water: low-res `MeshReflectorMaterial` + a custom detail shader plane on top.

**Fresnel/X-ray glow** (X-Ray, False Earth):
```glsl
float f = pow(1.0 - dot(normalView, viewDir), power);
vec3 col = mix(coreColor, edgeColor, f);   // feed same col into emissive → self-glow
```

**Cursor trail texture** (Podium): `useTrailTexture({ blend:'difference', ... })` → influence map → offset UVs. `difference` blend gives grainy, non-soft feel.

---

## F. Post-processing

`EffectComposer` (WebGL): `RenderPass → custom ShaderPass → OutputPass`. Or TSL node graph (WebGPU):
```js
const scenePass = pass(scene, camera);
let node = applyAberration(scenePass.getTextureNode('output'));
node = applyVignette(node); node = node.add(bloom(node));
postProcessing.outputNode = node;
```
Common recipe that ties a scene together: **vignette + chromatic aberration + bloom + film grain + slight desaturation + color-graded blacks**. Scale aberration by a vignette mask for depth. Scan lines: `clamp(sin(uv.y*1250.0), -1.0, 0.0)` (subtractive).
- Bloom only the layer that benefits (e.g. solid scene, not the X-ray skeleton).
- **Depth-aware compositing**: render thin emissive elements (beams) in a separate scene, composite by comparing depth buffers so DOF doesn't blur them.
- **Chromatic aberration = the oldest RGB trick**: sample R/G/B at offset UVs. Rainbow: three `sin()` at 2π/3 phase offsets.

---

## G. Transitions & reveals

**Reveal shader driven by one uniform** — brush, block, dissolve, curl:
```glsl
// block reveal: pixelate + compare static noise to progress
vec2 bu = floor(vUv * uPix)/uPix; float n = texture2D(noise, bu).g; float m = step(n, progress);
// + displacement warp (peaks mid): parabola(progress,2.) ; + chromatic aberration on both textures
gl_FragColor = mix(t1, t2, m);
```
Susurrus intro: `ScreenQuad` overlay whose `uProgress` is driven by scroll. ITom paint-reveal (§E).

**Persistent scene across pages** (Webflow+Barba / router) — canvas outside the swap container; camera slides between per-page model X positions:
```js
barba.init({ transitions:[{ once({next}){ exp = new Experience(canvas); moveCam(next.namespace); },
  leave: transitionOut, enter({next}){ moveCam(next.namespace); return transitionIn(); } }]});
```

**Media-as-transition-object** (Podium/Shopify) — the clicked image/video *is* the transition: overlay it on its grid position, expand into the hero while route changes underneath (GSAP Flip / FLIP).

**GSAP + View Transitions API** (Guignand) — fire chunk `import()` + image preload in parallel with the fade-out; wrap router `navigate()` in `flushSync` inside `startViewTransition` or the VT captures the old DOM twice.

**Scene-graph compositing** (Shader.se): active scenes render in reverse order, each passing its FBO texture to the previous; a `renderOffset` pre-warms the next scene's FBO before it's visible. Transition materials sample the next scene by **screen-space UV** (`screenCoordinate/resolution`) when not anchored to a surface.

**Text reveal**: `SplitText` (chars/lines) + scramble + clip-path wipe running *together* (left resolves first so no visual noise). Char stagger `from:'random'` for a pixel feel.

---

## H. Textures & assets

- **Load once, reuse instances** across many meshes (Hedde: 500 planes share 12 textures).
- **WebP vs KTX2**: KTX2 is GPU-native & smaller, but degraded hand-drawn art and slowed load in a real case. Test on *your* art; don't cargo-cult.
- **Per-frame `needsUpdate`** only on textures decoding new pixels this frame (video); native `<video>` playback otherwise.
- **Baked tint instead of lights** on flat scenes: encode a little shadow into texture color values.
- **Blender→Photoshop hand-drawn workflow**: export UV layout PNG, draw on it; use a live `.psd` as Blender's texture source for instant iteration.
- **ShadowMaterial + canvas `mix-blend-mode: multiply`** over a paper image → 3D lives *on* the page, paper-craft look, no color matching.
- **DRACO** compress GLTF; **clone** the loaded scene per instance rather than reloading.
- **Custom point-cloud/asset formats** (Shopify `.mdpc`): quantize positions in bbox, luma/chroma color streams, decode in a worker, `DecompressionStream`/wasm; density variants per tier. Keep big geometries in **refs, not React state**.
- **Transparent video cross-browser**: stack RGB over alpha in one 2×-tall video, reconstruct in a WebGL2 shader (`NEAREST` filtering, size from decoded dims, `requestVideoFrameCallback`).

---

## I. Performance & tiering

**Chunk + visibility cull** (ITom): mount only current±1 segments; hide out-of-view groups:
```js
useFrame(() => {
  const visible = !(camera.position.z < endZ - 5 || camera.position.z > startZ + 30);
  if (group.current.visible !== visible) group.current.visible = visible;
});
```

**Shader pre-warm** to kill first-entry stutter (ITom):
```jsx
// mount all scenes 500u below during loader, then:
gl.compileAsync(scene, camera, scene).then(done).catch(() => { gl.compile(scene,camera); done(); });
// skip entirely on low-end (context-loss risk). False Earth: FIFO upload queue, one component/frame.
```

**Device tiering** (ITom/Shopify):
```js
const lowEnd = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  || navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4 || innerWidth < 450;
// tiers 0..3: static fallback / min WebGL / reduced textures / full. Cap DPR by tier (≤2).
```
Add drei `<PerformanceMonitor onDecline={downgradeTier} />` to auto-degrade at runtime.

**Keep 60Hz values out of React** (Guignand/Shopify): write `element.style.transform/textContent` or uniforms from the loop; scroll drives uniforms, not renders. Bind callbacks once; `vec.set()` not `new`.

**Shared simulations**: one `FluidField` steps in `useFrame`, writes a velocity texture to a ref; many consumers sample it. Only the active section drives it.

---

## J. Sound

- Ambient loop per scene/room (city hum, wind, ocean) — turns graphics into a *place*.
- Opt-in toggle, never autoplay. Distinct hover/open/close SFX.
- **Muffle (lowpass), don't cut**, when entering a sub-view — reinforces "a room inside the site".
- Web Audio: short-lived `BufferSource` one-shots, ±cents pitch randomization, distance attenuation. `react-howler`/Howler.js for simple cases.

---

## K. Content, data & tooling

- Separate content into typed data / CMS (`projectsData.ts`, Sanity/Dato/Shopify presets). A **preset = same data contract for the design playground and production** (Shopify) — designers tune the real scene, values ship as-is.
- i18n early if targeting international juries/audiences.
- `image-dimensions.json` (zero CLS) + `lqip-data.json` (base64 blur-ups) at build time; per-route chunk preload on hover.

---

## L. Accessibility & UX

- **Onboarding-as-achievement**: tooltip per room ("Drag to browse") that completes on the action; persist `localStorage`; fire analytics on unlock.
- **`prefers-reduced-motion` = parallel design** via `gsap.matchMedia` (also gate hover-only effects behind `(min-width) and (hover)`), not an on/off kill switch.
- **Accessible DOM twin**: canvas decorative; keep semantic headings/landmarks + invisible-but-crawlable SEO fallback article; keyboard nav for scene/room changes.
- **HTML-in-Canvas** (emerging): `HTMLTexture` (three r184) + `InteractionManager` renders real accessible HTML/CSS as a texture with native hit-testing — future path for 2D UI in 3D. Today: `@pmndrs/uikit` render-to-target, or `html2canvas`/SVG `<foreignObject>` workarounds.
  - Raw API: `<canvas layoutsubtree>` + `ctx.drawElementImage(el,0,0)` inside `canvas.onpaint`/`requestPaint()` — paints accessible CSS-styled DOM into a canvas to use as a shader texture (post-process real content without losing SEO/a11y).
  - `HTMLTexture` R3F wiring: `new HTMLTexture(el)` → `material.map`; `new InteractionManager().connect(gl,camera); .add(mesh)`; call `.update()` in `useFrame` (computes a per-frame CSS `matrix3d`, no raycasting).

---

## M. Physics & interactive UI (new category)

- **Physics-driven UI pile** (Three.js Conf) — objects *are* the interface. Attract each to a target point, iteratively resolve overlaps, add velocity/springs/bounciness. Use an **AABB collider** for UI regions, a **spatial hash** for broadphase, and move the whole sim to a **Web Worker** so the main thread stays free.
- **Cursor-reactive SVG UI + idle culling** — custom multi-control-point SVG shapes deform toward the pointer; suspend the update loop when nothing moves and the cursor is far.
- **Physics prop interaction** (Susurrus) — React-Three-Rapier for spawn-on-click objects (bread piling up) that collide and settle; cheap way to make a scene feel tactile/alive.
- **Spring/lerp micro-interactions everywhere** — the non-physics default: `current += ease*(target-current)` per frame (models follow cursor at `ease≈0.08`; UI lifts on hover). Reserve real physics for when settling/collision is the point.

---

## N. Extended technique index (deep-study pass)

Compact catalog of techniques surfaced studying the full Three.js tag. Grouped by the section above they extend.

### Instancing & GPU (§D)
- **Staggered per-instance timeline from one global progress** (Dithering) — give each instance a normalized index; remap a single GSAP-tweened `uProgress` into a *local* window so one tween choreographs thousands of offset sub-animations (pos+color+scale):
  ```glsl
  float start = mix(uMinDelay, uMaxDelay, delayFactor);        // delayFactor = per-instance attr
  float p = smoothstep(start, start + (1.0 - uMaxDelay), uProgress);
  ```
  Sequence multiple instanced layers by offsetting each layer's min/max delay.
- **Stagger *shape* via `#define` + recompile** — swap cell/row/column/random/corner-distance delay by switching a shader define; `material.needsUpdate = true`.
- **Sample an image by instance grid-index (not mesh UV)** — `texture2D(uTex, vec2(aColNorm, 1.0-aRowNorm))` in the vertex shader to paint one image across N meshes; pass as varying.
- **Deterministic hash jitter** — `pos += hash2(aStaticId)*uJitter;` breaks the "perfect grid/circle" tell using a stable per-instance seed.
- **Compressed normal storage** (False Earth) — store `nx,nz`, reconstruct `ny=sqrt(1-nx²-nz²)`; frees 2 floats per instance for e.g. a push vector.
- **Voronoi parameter blend** — blend an instance's params from its 2 nearest Voronoi centers by distance to remove hard clump seams.
- **Hexagonal stagger** (X-Ray) — offset every other row by half-spacing, compress Z (`*0.65`) so a grid reads as an organic packed crowd.

### Shaders & materials (§E)
- **Expanding-Gaussian wave propagation** (Wave Grid) — from a trail texture: `relDist = dist - uWaveSpeed*age; window = exp(-relDist²/uWaveWidth²)`. Accumulate `weight*cos(uWaveFreq*relDist)` and divide by `max(totalWeight,1.0)` so overlapping ripples blend not spike. Attenuate by time `exp(-age/fade)`, distance `1/(1+dist*0.1)`, and cursor speed `distDelta`.
- **DataTexture ring-buffer trail + raycast-to-plane** — store last N pointer samples as a MAX_TRAIL×1 RGBA-float texture (`R=x,G=z,B=age,A=distDelta`), loop in vertex shader; skip `needsUpdate` when idle. Pointer→world via an invisible `y=0` plane (call `updateMatrixWorld(true)` since it's not in the scene).
- **In-shader ordered (Bayer) dithering** — tile a Bayer matrix over the grid → per-instance `aThreshold` → `step(aThreshold, value)`. Retro/quantized reveals.
- **Cheap "fake fluid"** (X-Ray) — ping-pong FBO: keep darkest of self + 4 FBM-jittered neighbor taps (`min()`), blend in a black-on-white trail, add ~`0.015` white/frame to self-heal (~1s fade). Far cheaper than Navier-Stokes.
- **Bézier blade bending + gust sway** (False Earth) — model strands/grass/hair as a 4-point cubic Bézier; push control points proportional to height (root stable `0.08`, tip `0.25`) for a natural arc. Add low-freq body sway + high-freq flutter masked to the tip, modulated by a slow `gust = 0.65 + 0.35*sin(t*0.35+seed)` envelope so a field "breathes".
- **"Thick illusion" for flat billboards** — push verts along face normal scaled by how edge-on to camera (`edgeMask`) × base-heavy `centerMask`, so grass/foliage planes don't vanish edge-on.
- **Vertex-color material mask (1 draw call)** — pack material id into vertex-color R (`0/0.5/1`), recover with `step(abs(vColor.r-id),0.05)` to shade multiple materials from one mesh.
- **Textureless procedural shading** — fake midrib/rim by bending the shading normal across horizontal UV; add height-based root AO; desaturate with distance for atmospheric depth. Zero texture cost.
- **Velocity-lifted two-blob mood background** (Depth Gallery) — flat bg color + 2 `smoothstep` blobs (time-animated centers), `color += velocity*0.10`, + film grain. Per-image palette lerped by depth `blend`.
- **Radial fisheye/barrel distortion** (4WIDE) — `distortion = 1.0 + u_strength*r*r; uv /= distortion;` one-uniform curved-lens reveal.

### Transitions & reveals (§G)
- **Ink-bleed reveal** (Joseph San) — fBM expansion with **dynamic noise amplitude** (splashes harder on click) and **dynamic softness** (crisp at rest, blurry while spreading): `alpha = 1 - smoothstep(radius - softness, radius, dist + noise*(0.8+uClick*1.5))`. "Crafted not generated" polish.
- **Dual-scene mask reveal** (X-Ray) — two instanced scenes, identical camera/fog/env (e.g. solid + wireframe); `mix(sceneA, sceneB, mask)` in post. Bloom only the layer that benefits.
- **Synchronized wave = glow + push** (False Earth) — one ring-wavefront strength `smoothstep(ringWidth,0,abs(dist-radius))*fade` drives *both* emissive scalar and vertex-push vector, so visual ring and physical ripple stay locked.
- **GSAP multi-uniform "focus mode"** (4WIDE) — one toggle ramps several channels together: distortion `u_strength`, a filter uniform, **and the source `<video>.playbackRate`** — whole-scene mood shift.
- **Runtime scroll-mode state machine** (Joseph San) — swap free-continuous ↔ snap-block scroll per section atop GSAP `Observer` without breaking neighbors; pair with `AnimationMixer` crossfades timed to snap beats.
- **Section-config render-pass skipping** (Shader.se) — page = `[{type,length}]`; page start = cumulative sum; if a page's scroll progress ∉ [0,1], skip its *entire* pass and all owned sub-passes.

### Camera (§C)
- **Curve-normal content scattering** (Hedde) — scatter objects perpendicular to a path using the curve's local normal (rotate tangent 90°), not a world axis, so they follow every bend.
- **Cubic proximity focus-scaling** — `f = 1 - dist/maxDist; scale = 1 + f³*(maxScale-1)` so only the nearest item pops (linear feels too gradual).
- **Narrow FOV depth compression** (X-Ray) — ~17° FOV flattens a grid into a dense "wall/crowd"; a cheap composition lever.
- **Camera push-forward > orbit** (Shopify) for video→pointcloud reconstruction believability.

### Post-processing & assets (§F/§H)
- **Volumetric light from video** (Shopify) — bake video into KTX2 **array textures**, raymarch as boxes ("camera inside a video"); `sampler2DArray`. Hard-cap grid + raymarch steps; keep a side source→volume map (KTX2 drops timing metadata).
- **Video→point-cloud pipeline** (Shopify) — short clip → VGGT → cleaned point cloud → density-weighted 1024/512/256 variants per tier.
- **Atlas half-texel inset + `dFdx/dFdy` gradients** (Three.js Conf) — inset tiled UVs by half a texel to stop bilinear bleed across atlas cells; pass explicit UV gradients to kill mipmap artifacts from `fract()` seams. Bit-pack colors/UV-region/tiling/metalness into 4 `vec4`s (WebGPU 8-vertex-buffer limit).
- **WebGPU render-target UV-Y flip** — flip fullscreen-quad UV.y so ping-pong read-back stays self-consistent.

### DOM / editorial / UI (§A/§H)
- **`getBoundingClientRect` grid-rule guides** (Corentin) — spawn four 1px viewport-spanning lines framing an element as an interactive easter egg; `container{position:fixed;inset:0;pointer-events:none}`.
- **Shared "mask switcher" nav** — one mask element tweens `x/y/width/height` to the hovered link's rect for continuous (non-per-item) nav feedback.
- **Char roll-up button** (Ruffini) — `SplitText type:'chars'` + a cloned bottom layer at `yPercent:100`; on hover top chars go `-100`, bottom to `0` (staggered), morph borderRadius. Gate behind `matchMedia('(min-width:992px) and (prefers-reduced-motion:no-preference)')`.
- **Canvas `ResizeObserver`** (Ruffini) — observe the canvas element (not `window.resize`); update camera aspect + renderer size; recompute DPR capped at 2.
- **ScreenQuad overlay hygiene** (Susurrus) — for a fullscreen reveal overlay set `renderOrder:-1`, `depthTest/Write:false`, and `mesh.raycast = () => null` so it never eats pointer events.

### Performance & state (§I/§K)
- **Blur is the #1 mobile cost** (4WIDE) — cutting blur beat every other mobile optimization; set context `powerPreference:'low-power'` on phones; halve geometry size + segments.
- **Skip hidden vertices** (Wave Grid) — don't run displacement math on non-visible (bottom) vertices (~50% shader cost); match `scene.background` to ~0.5× base color to hide gap flashes.
- **Interaction press-down, not slide** (False Earth) — weight push by `pow(t,2)` (tip bends, root anchored) *and* compress height so foliage flattens under the interactor.
- **Reduced-motion inside the sim** (Shopify) — keep the shared field running for pointer responsiveness, but strip scroll-splats and cut force before consumers sample it.
- **Mobile no-pointer fallback** (Wave Grid) — auto-inject random interaction points after ~3s idle (and start in that state) so pointer-driven scenes still animate on touch.
- **base62 mixed-radix state codec** (Three.js Conf) — serialize a fully procedural object's state into a short (~10-char) base62 string instead of JSON for shareable/persistable creations.
- **Tweakpane/GUI live-rig** (Dithering/Wave Grid) — slider→uniform, list→`defines`(recompile), toggled by a `#debug` URL flag; invaluable while tuning shaders.
