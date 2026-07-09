---
name: 3d-web-design
description: Methodology and pattern library for designing and building interactive 3D web experiences with Three.js / React Three Fiber / WebGPU (TSL), GSAP, and scroll-driven storytelling. Use when building or reviewing a 3D website, WebGL/WebGPU scene, scroll-driven or camera-path experience, shader effect, immersive portfolio, product launch page, or when the user mentions Three.js, R3F, drei, GSAP, shaders, instancing, post-processing, or "3D web".
---

# 3D Web Design & Development

A distilled methodology for building 3D web experiences that are cinematic, performant, accessible, and shippable. Synthesized from a dozen award-winning Codrops case studies and the `portfolio-itom` project (hand-drawn infinite-corridor portfolio; GSAP SOTD / FWA of the Day).

The detailed, code-level catalog lives in [references/technique-catalog.md](references/technique-catalog.md). Read it only when implementing or reviewing a specific technique. This file is the decision spine.

## The one rule that governs everything

**Screenplay → Mechanics → Dress → Optimize.** Never reorder these.

1. **Screenplay** — Write the film first. What does the user see, where does the camera go, what's the story/message? Decide the emotional beat of each scene before any code.
2. **Mechanics** — Build movement and flow with plain shapes (planes, cubes, no textures, no shaders). Make it *feel* right when it looks like nothing. Scroll, camera, transitions, room/section logic come first.
3. **Dress** — Only now add textures, shaders, materials, sound. Visual identity goes on top of working foundations, never the reverse.
4. **Optimize** — Profile, then apply the performance playbook. Do not pre-optimize; do not ship without this step either.

Corollary: **tech is never the blocker — imagination is.** If you can describe it, it can be coded. Budget stubbornness.

## When to use this skill

Building/reviewing: immersive portfolios, product/launch pages, scroll-driven 3D worlds, WebGL/WebGPU scenes, shader effects, camera-path galleries, 3D page transitions. For a plain marketing site with a hero animation, most of this is overkill — use only the input/perf sections.

## Decision guides

### Should this even be 3D?
Only if the *space* carries meaning the DOM can't. A walk-through beats a scroll-down only when the environment is part of the story. Otherwise a great standard layout wins on UX. Be honest.

### Geometry approach
| You have | Do this |
|---|---|
| No 3D/Blender skills | Flat geometry (planes/cubes) + hand-drawn or AI textures. Style *is* the workaround (see portfolio-itom). |
| Blender skills | Model low-poly, bake lighting, DRACO-compress GLTF, `.psd`-live-texture workflow. |
| A camera move / spatial feel | Author a **curve in Blender**, export points to JSON, rebuild as `CatmullRomCurve3`, drive by scroll. |
| Millions of elements | GPU-driven: instancing + compute + indirect draw (WebGPU). |

### Responsive strategy: scale down vs. two experiences
Two valid approaches — pick per project:
- **One scene, tiered down** (Shopify/ITom): same experience, mobile gets smaller assets, lower dpr, fewer passes (see Performance → device tiers).
- **Two experiences** (Merouane Bali): desktop = full immersive 3D world; mobile = one interactive 3D header/model + an otherwise traditional React layout. Best when the full walk-through can't survive small screens, flaky networks, and thumb reach. Don't force immersion where a clean layout serves users better.
Bridge DOM controls and the canvas with a shared store (Context/Zustand) so quality, sound, and enter/exit are toggle-able (see `references/technique-catalog.md` → Architecture).

### Renderer: WebGL vs WebGPU (TSL)
- **WebGL + Three.js/R3F** — default, maximum compatibility. Extend built-in materials via `onBeforeCompile` (keeps UV/colorspace/transparency working).
- **WebGPU + TSL** — when you need storage buffers, compute shaders, indirect draw, or >100k dynamic instances. TSL compiles to *both*, so you can target WebGPU without abandoning WebGL. First-time cost is real; worth it only for GPGPU-heavy scenes.
- **OGL** — when bundle size and owning every line matter more than the ecosystem.

### Animation driver
GSAP is the default for choreography. **The master pattern: drive every WebGL effect from a single GSAP-tweened `progress` uniform (0→1).** The shader stays stateless; GSAP owns the motion curve. Swap eases without touching GLSL. This one idea recurs in nearly every case study.

### Framework
- Plain Vite + class-based (Bruno-Simon-style `Experience/Camera/Renderer/World` singletons) for standalone scenes.
- React + R3F when you need routing, CMS, or component state — but keep **scroll/pointer values in refs/stores, never React state** (see Performance).
- CMS (Sanity/Dato/Shopify presets) for content-driven sites; adopt early, not as a retrofit.

## Core pattern quick-reference

Full code for each is in [references/technique-catalog.md](references/technique-catalog.md). The highest-leverage ones:

| Pattern | One-liner | Section in technique catalog |
|---|---|---|
| GSAP↔shader uniform bridge | One tweened `uProgress` drives all GLSL | Shaders |
| GSAP `Observer` | Unify wheel/touch/pointer into one input | Input & Scroll |
| target vs smoothed scroll | `targetT` (instant) + `quickTo`/lerp (smooth) | Input & Scroll |
| Curve-driven camera | Blender curve → `CatmullRomCurve3` → scroll `t` | Camera |
| Chunking + visibility cull | Mount only nearby segments; hide off-view | Performance |
| Shader pre-warm | `gl.compileAsync` all scenes offscreen at load | Performance |
| Device tiering | Detect GPU/RAM/cores → scale dpr, assets, effects | Performance |
| `onBeforeCompile` injection | Add wave/paint logic to stock materials | Shaders |
| InstancedMesh + per-instance attr | 1 draw call for N objects; animate in shader | Instancing |
| Ping-pong FBO | Fluid/trail sims (read A, write B, swap) | Shaders |
| Render-to-texture + composite | Multi-scene; pass FBO to previous scene | Transitions |
| `quickTo` retargeting | Per-frame new targets for 100s of objects, no GC | Instancing |
| Mount-once, swap-texture | Never remount WebGL per item (context leak) | Performance |
| Baked lighting tint | Kill real-time lights on flat scenes; tint textures | Performance |
| Reveal shaders | Brush/block/dissolve via noise + `step`/`smoothstep` | Transitions |
| Persistent scene + Barba/router | Canvas survives navigation; camera slides | Transitions |
| DOM↔WebGL bridge | Shared store (Context/Zustand) links canvas & layout | Architecture |
| Staggered instance timeline | One global `uProgress` + per-instance index → N offset sub-animations | Extended index → §D |
| Physics-driven UI | Objects *are* the interface; AABB + spatial hash in a Worker | Physics & interactive UI |
| Achievements/onboarding | Teach non-standard UX; persist to localStorage | Accessibility & UX |

## Performance playbook (apply in Optimize phase)

Run in this order; stop when frame budget is met:
1. **Keep high-frequency values out of React.** Scroll/pointer → refs/Zustand, write `element.style.*` / uniforms directly in the loop. A render-tree reconcile is ~8ms you don't have at 120Hz.
2. **Mount only what's near the viewport.** Active section + immediate neighbors; unmount+dispose the rest.
3. **Cull aggressively.** Hide off-camera groups (`group.visible = false`); frustum-cull; GPU indirect-draw culling for instanced fields.
4. **Instance repeated geometry.** N objects → 1 draw call.
5. **Kill unnecessary lights/shadows.** Flat/stylized scenes: remove real-time lights, bake a tint into textures. Two directional lights on flat planes = pure waste.
6. **Pre-warm shaders** with `gl.compileAsync` during the loader (skip on low-end to avoid context loss).
7. **Texture discipline.** Load once & reuse instances; WebP is often better than KTX2 for hand-drawn art (test!); per-frame `needsUpdate` only on textures actually changing this frame.
8. **Clamp DPR** by tier and viewport (cap ~2); reduce shadow-map size to the lowest acceptable.
9. **Device tiers, not one universal scene.** Mobile: cap by memory pressure, smaller assets, fewer/no post passes. **Blur is usually the single most expensive mobile effect — cut it first.** Set context `powerPreference:'low-power'` on phones.
10. **Reuse allocations.** Bind callbacks once; `vec.set()` not `new Vec()`; `quickTo` not new tweens per frame.

Verify with a real FPS monitor (drei `PerformanceMonitor` can auto-downgrade tier on decline). Target: 60 on phones, 120+ on desktop; degrade gracefully, never break.

## Accessibility & UX for non-standard interfaces

- **Onboard interaction.** Non-standard UX means users don't know what to do. Use tooltips-as-achievements ("Scroll to fly", "Drag to browse") that complete on the action. Persist to localStorage.
- **`prefers-reduced-motion` is a parallel design, not a disable flag.** Ship a real degraded version that conveys the same intent without vestibular cost (`gsap.matchMedia`).
- **Keep an accessible DOM.** The canvas is decorative; provide semantic headings/landmarks + an SEO/screen-reader fallback tree (invisible but crawlable). Add keyboard navigation for camera/room changes.
- **Sound is opt-in.** Never autoplay. But *have* sound — ambient per scene turns "a page with graphics" into "a place". Muffle (lowpass) rather than cut when entering sub-views.

## Anti-patterns & hard-won lessons

- Polishing visuals on a broken camera/scroll foundation (violates the one rule).
- Real-time shadows on flat/stylized geometry (huge cost, zero visual gain).
- Blindly adopting KTX2 — it degraded hand-drawn textures and slowed load in a real case; WebP already hit 60/144fps.
- Remounting a WebGL context per gallery item → GPU memory climb → stutter. Mount once, swap textures.
- Driving 60Hz scroll updates through React state.
- Chasing "correct" optimizations that the current solution already makes unnecessary.
- Adding effects because you can. Restraint and pacing beat density (Podium, Susurrus). Every technical decision should serve the message.

## Reference map

- `references/technique-catalog.md` — full technique catalog (§A–§L core patterns, §M physics & interactive UI, §N extended index from a deep-study pass over the whole Three.js tag) with code snippets and source links. Read the relevant section when implementing architecture, scroll/input, cameras, instancing, shaders, post-processing, transitions, assets, performance, sound, content tooling, accessibility, physics-driven UI, or the extended technique index.

## Additional resources

- Case studies studied for this skill (Codrops): [Sketching the Impossible](https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/), [GSAP shader wipes](https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/), [Blender camera path](https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/), [Susurrus watercolor/NPR](https://tympanus.net/codrops/2026/04/24/susurrus-crafting-a-cozy-watercolor-world-with-three-js-and-shaders/), [False Earth WebGPU](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/), [Shopify Everywhere](https://tympanus.net/codrops/2026/06/26/engineering-the-web-experience-behind-shopifys-spring-26-edition-everywhere/), [The Journey of Creating a 3D Portfolio (Merouane Bali)](https://tympanus.net/codrops/2025/01/21/the-journey-of-creating-a-3d-portfolio/) (DOM↔WebGL bridge, desktop-vs-mobile split), plus the full [Three.js tag](https://tympanus.net/codrops/tag/three-js/).
