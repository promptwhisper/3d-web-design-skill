---
name: 3d-web-design
description: Methodology and pattern library for designing and building interactive 3D web experiences with Three.js / React Three Fiber / WebGPU (TSL), GSAP, scroll-driven storytelling, production UI/UX quality gates, and anti-template taste checks. Use when building or reviewing a 3D website, WebGL/WebGPU scene, scroll-driven or camera-path experience, shader effect, immersive portfolio, product launch page, 3D landing page, redesign, or when the user mentions Three.js, R3F, drei, GSAP, shaders, instancing, post-processing, accessibility, responsive interaction, design systems, visual taste, or "3D web".
---

# 3D Web Design & Development

A distilled methodology for building 3D web experiences that are cinematic, performant, accessible, and shippable. Synthesized from a dozen award-winning Codrops case studies and the `portfolio-itom` project (hand-drawn infinite-corridor portfolio; GSAP SOTD / FWA of the Day).

The detailed catalogs live in [references/technique-catalog.md](references/technique-catalog.md) and [references/frontend-taste-and-ux.md](references/frontend-taste-and-ux.md). Read them only when implementing or reviewing a specific technique, UX gate, redesign, or anti-template issue. This file is the decision spine.

## The one rule that governs everything

**Screenplay → Mechanics → Dress → Optimize.** Never reorder these.

1. **Screenplay** — Write the film first. What does the user see, where does the camera go, what's the story/message? Decide the emotional beat of each scene before any code. Define page kind, audience, reference signals, style keywords, design variance, motion intensity, visual density, primary action, typography/color tokens, and the accessible DOM fallback here.
2. **Mechanics** — Build movement and flow with plain shapes (planes, cubes, no textures, no shaders). Make it *feel* right when it looks like nothing. Scroll, camera, transitions, room/section logic come first.
3. **Dress** — Only now add textures, shaders, materials, sound. Visual identity goes on top of working foundations, never the reverse.
4. **Optimize** — Profile, then apply the performance playbook. Do not pre-optimize; do not ship without this step either.

Corollary: **tech is never the blocker — imagination is.** If you can describe it, it can be coded. Budget stubbornness.

Second corollary: **spectacle never outranks usability.** A 3D site is still a product interface. If it breaks contrast, keyboard access, touch targets, readable type, predictable navigation, or reduced-motion behavior, the scene is unfinished no matter how beautiful the shader is.

## When to use this skill

Building/reviewing: immersive portfolios, product/launch pages, scroll-driven 3D worlds, WebGL/WebGPU scenes, shader effects, camera-path galleries, 3D page transitions. For a plain marketing site with a hero animation, most of this is overkill — use only the input/perf sections.

## Decision guides

### Should this even be 3D?
Only if the *space* carries meaning the DOM can't. A walk-through beats a scroll-down only when the environment is part of the story. Otherwise a great standard layout wins on UX. Be honest.

### Design system before visual dressing
Before choosing shaders or post-processing, establish a compact design contract:
- **Design read**: State one line before building: "Reading this as: [page kind] for [audience], with a [vibe] language, leaning toward [system/aesthetic]." If the read can split in two real directions, ask one clarifying question.
- **Product fit**: Match style to product type and audience. Portfolio/editorial can be cinematic; SaaS/admin/data products need quieter density, clearer navigation, and faster task completion.
- **Dials**: Set `DESIGN_VARIANCE`, `MOTION_INTENSITY`, and `VISUAL_DENSITY` intentionally. High motion is for story moments; high density is for dashboards; high variance needs stronger layout discipline. Trust-first or regulated work lowers variance and motion.
- **Real systems**: If the brief clearly maps to a real design system, use the official package and tokens instead of imitating it by hand. Examples: Material, Fluent, Carbon, Polaris, Atlassian, Primer, GOV.UK, USWDS, Radix, shadcn/ui. Use one system per project.
- **Aesthetic honesty**: Glass, bento, brutalism, editorial, dark-tech, kinetic type, and "Liquid Glass" on the web are aesthetic implementations, not official systems. Label platform-specific approximations honestly and provide solid fallbacks for blur/transparency.
- **Tokens**: Use semantic tokens for color, typography, spacing, radius, elevation, z-index, and motion. Avoid raw one-off hex values inside components.
- **Interface layer**: Use one icon family/style, no emoji as structural icons, one primary CTA per view, and visible labels for navigation or unfamiliar controls.
- **Theme parity**: Design light/dark variants together. Test contrast and state visibility separately in each theme.

### Taste dials
Infer these from the brief, then let them control layout, motion, and density:

| Signal | DESIGN_VARIANCE | MOTION_INTENSITY | VISUAL_DENSITY |
|---|---:|---:|---:|
| Minimal, calm, Linear-style, editorial | 5-6 | 3-4 | 2-3 |
| Premium consumer, Apple-like, luxury, brand | 7-8 | 5-7 | 3-4 |
| Playful, Awwwards, experimental, agency | 9-10 | 8-10 | 3-4 |
| Mainstream landing or portfolio | 7-9 | 6-8 | 3-5 |
| Trust-first, public-sector, regulated, accessibility-critical | 3-4 | 2-3 | 4-5 |
| Redesign preserve | match existing | existing + 1 | match existing |
| Redesign overhaul | existing + 2 | existing + 2 | match existing |

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

## 3D UI/UX quality gate

Apply this in Screenplay and again before delivery. Fix failures before adding more visual effects.

1. **Accessibility first**: Text contrast ≥4.5:1, data/large glyph contrast ≥3:1, visible focus rings, logical heading order, skip link, alt text for meaningful media, aria-labels for icon-only controls, and full keyboard navigation for every route/room/action. Never convey state by color alone.
2. **Touch & gesture safety**: Primary hit areas ≥44×44px with at least 8px spacing. Provide visible controls for critical actions; never rely on hover, drag, or scroll gestures alone. Add press feedback within ~100ms, use drag thresholds, and avoid conflicts with vertical scroll and system back gestures.
3. **Layout resilience**: Build mobile-first at 375px, tablet, desktop, and landscape. Avoid horizontal scroll, fixed-width containers, disabled zoom, and content hidden behind sticky nav/CTA bars. Prefer `min-height: 100dvh`, safe-area padding, stable aspect ratios, and reserved media dimensions to prevent CLS.
4. **Typography & color**: Use body text ≥16px on mobile, line-height 1.5-1.75, readable line lengths, semantic color tokens, and tabular figures for metrics/timers. Wrap important text instead of truncating; if truncation is necessary, expose the full value.
5. **Motion discipline**: UI micro-interactions usually live at 150-300ms; complex route/scene transitions should stay purposeful and interruptible. Animate transform/opacity, not layout properties. Reduced motion is a parallel design: simpler camera paths, fewer splats, no vestibular surprises, same content.
6. **Forms, feedback, and data**: Use visible labels, inline errors near fields, loading/success/error states, undo for destructive actions, and `aria-live` for toasts/errors. Charts need legends, tooltips reachable by keyboard/tap, accessible colors, and a text/table summary.
7. **Navigation integrity**: Preserve back behavior, scroll position, active nav state, and deep links for key sections. After route/scene changes, move focus to the main content region. Do not hide core navigation inside a non-obvious 3D interaction.

## Anti-template taste gate

Use these as anti-slop checks for landing pages, portfolios, product launches, and 3D redesigns:

1. **Hero discipline**: Hero must fit the initial viewport. Desktop headline usually ≤2 lines; subtext ≤20 words; CTA visible without scrolling; top padding capped around 6rem. Put logo walls and trust strips below the hero, not inside it.
2. **Composition variety**: Avoid centered hero + three equal cards + repeated split sections. Use asymmetric splits, media-mask heroes, scroll-pinned moments, bento with real rhythm, masonry, horizontal pan, or full-width editorial sections when the brief supports them.
3. **No generic decoration**: Avoid AI-purple glows, random mesh gradients, decorative status dots, scroll cues, section-number eyebrows, version labels, weather/location strips, fake build metadata, and text strips that only exist to look designed.
4. **Color, type, and shape locks**: Use one accent, one neutral family, one corner-radius system, one icon family, and one copy register per page. Do not default to Inter, beige+brass premium palettes, or mixed serif/sans emphasis unless the brand genuinely calls for it.
5. **Asset reality**: A 3D/landing page needs real visuals: generated imagery, brand/product media, real screenshots, rendered 3D assets, or a live component preview. Do not ship pure text, div-based fake screenshots, placeholder dashboards, or hand-rolled decorative SVG scenes as the main visual.
6. **CTA and copy audit**: One label per CTA intent, no duplicate "contact/signup/view work" variants. Buttons must not wrap on desktop. Re-read every visible string and replace cute-but-wrong, fake-poetic, or filler copy with concrete language.
7. **Content density**: Short section headlines, short supporting copy, and one job per section. Long lists, specs, testimonials, and logo walls need appropriate components, not endless rows with hairlines.
8. **Motion taste**: If `MOTION_INTENSITY > 4`, show real motion; if you cannot make it robust, lower the dial. Every animation must communicate hierarchy, story, feedback, or state. Use at most one marquee-like device per page.
9. **Page theme lock**: Pick light, dark, or system theme for the page. Avoid random section-level theme flips unless the brief explicitly asks for a color-block story and the transition is a deliberate event.

## Redesign protocol

When improving an existing 3D site, first classify the job:

- **Preserve**: modernize without breaking brand memory. Audit existing brand tokens, IA, URLs, anchors, nav labels, copy voice, analytics hooks, accessibility wins, SEO pages, and signature interactions before changing visuals.
- **Overhaul**: new visual language, but preserve content and IA unless asked otherwise. Treat the art direction as greenfield while guarding SEO, routes, legal text, forms, and tracking.
- **Greenfield**: no existing site or full reset approved. Use the design read and dials as the source of truth.

Modernize in this order: typography, spacing/rhythm, color recalibration, motion layer, hero/key-section recomposition, then full block replacement only when a block is unsalvageable. Never silently change URL structure, primary nav labels, form fields/order, logo/wordmark, legal copy, or consent flows.

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
| 3D UI/UX gate | Product-fit tokens, a11y, touch, responsive, motion QA | This file → quality gate |
| Anti-template gate | Brief read, dials, hero discipline, no AI tells | This file → taste gate |
| Redesign protocol | Preserve IA/SEO/brand before visual overhaul | This file → redesign |
| Staggered instance timeline | One global `uProgress` + per-instance index → N offset sub-animations | Extended index → §D |
| Physics-driven UI | Objects *are* the interface; AABB + spatial hash in a Worker | Physics & interactive UI |
| Achievements/onboarding | Teach non-standard UX; persist to localStorage | Accessibility & UX |

## 3D pattern vocabulary

Use these names to think and communicate before implementing. Choose only patterns that serve the design read:
- **Hero**: asymmetric split hero, editorial manifesto hero, video/media mask hero, kinetic-type hero, curtain reveal hero, scroll-pinned hero.
- **Navigation/UI**: magnetic button, dynamic-island status pill, contextual radial menu, mega-menu reveal, morphing modal, spotlight border card.
- **Layout**: bento grid, masonry layout, split-screen scroll, sticky-stack sections, horizontal scroll hijack, drag-to-pan grid.
- **Media/3D**: dome gallery, coverflow carousel, shader reveal, text mask over video/scene, hover image trail, holographic/foil material.
- **Animation choice**: use Motion for ordinary UI/state motion, GSAP ScrollTrigger for pin/scrub scrolltelling, and Three.js/WebGL for true scene work. Isolate each in leaf components and avoid multiple libraries fighting over the same element.

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
- **Keep an accessible DOM.** The canvas is decorative; provide semantic headings/landmarks + an SEO/screen-reader fallback tree (invisible but crawlable). Add keyboard navigation for camera/room changes and preserve focus on route/scene transitions.
- **Bridge states cleanly.** DOM buttons, nav, forms, captions, charts, and modals must own semantic state (`disabled`, `aria-expanded`, `aria-current`, validation messages). The WebGL scene may mirror that state visually, but it should not be the only source of meaning.
- **Sound is opt-in.** Never autoplay. But *have* sound — ambient per scene turns "a page with graphics" into "a place". Muffle (lowpass) rather than cut when entering sub-views.

## Pre-delivery checks

- Declare the design read and dial values; for redesigns, confirm preserve/overhaul/greenfield mode.
- Confirm the hero fits the first viewport, nav is one line on desktop, CTAs do not wrap, and trust/logo content sits below the hero.
- Count obvious template tells: repeated eyebrows, repeated split sections, three equal feature cards, duplicate CTA intent, fake product previews, scroll cues, decorative status dots, fake version labels, and generic filler names/copy.
- Test at 375px, tablet, desktop, and mobile landscape; confirm no horizontal scroll or clipped fixed UI.
- Test keyboard-only navigation, visible focus, screen-reader labels for controls, route-change focus, and skip-to-main.
- Test `prefers-reduced-motion`, low-end mobile tier, slow network, and high text scaling.
- Verify contrast in light and dark modes, touch targets ≥44×44px, press/loading/error states, and no hover-only paths.
- Verify CLS-safe media dimensions, font loading, asset compression, shader warm-up strategy, and FPS target on representative hardware.
- Verify real visual assets are present and appropriate: generated/real media, rendered 3D, real screenshots, or live component previews.

## Anti-patterns & hard-won lessons

- Polishing visuals on a broken camera/scroll foundation (violates the one rule).
- Treating the canvas as the interface and leaving DOM/a11y/SEO as an afterthought.
- Hiding primary navigation or CTAs behind hover, mystery gestures, or unlabeled icons.
- Jumping to centered hero, AI-purple glow, three equal cards, glass everywhere, Inter everywhere, or fake dashboard divs before reading the brief.
- Using a real design system's visual language while ignoring its official package, tokens, and interaction semantics.
- Redesigning by changing IA, routes, copy voice, logo, form fields, legal text, analytics hooks, or SEO-critical structure without explicit approval.
- Real-time shadows on flat/stylized geometry (huge cost, zero visual gain).
- Blindly adopting KTX2 — it degraded hand-drawn textures and slowed load in a real case; WebP already hit 60/144fps.
- Remounting a WebGL context per gallery item → GPU memory climb → stutter. Mount once, swap textures.
- Driving 60Hz scroll updates through React state.
- Animating layout properties for UI chrome; use transform/opacity and keep interactions interruptible.
- Hardcoding per-screen colors/effects instead of using semantic tokens and theme parity.
- Shipping copy that sounds clever but unclear; concrete language beats fake-poetic microcopy.
- Chasing "correct" optimizations that the current solution already makes unnecessary.
- Adding effects because you can. Restraint and pacing beat density (Podium, Susurrus). Every technical decision should serve the message.

## Reference map

- `references/technique-catalog.md` — full technique catalog (§A–§L core patterns, §M physics & interactive UI, §N extended index from a deep-study pass over the whole Three.js tag) with code snippets and source links. Read the relevant section when implementing architecture, scroll/input, cameras, instancing, shaders, post-processing, transitions, assets, performance, sound, content tooling, accessibility, physics-driven UI, or the extended technique index.
- `references/frontend-taste-and-ux.md` — detailed frontend taste and UX catalog distilled from UI/UX and anti-slop frontend guidance. Read it when the task involves design reads, dial selection, design systems, hero quality, DOM/WebGL UI contracts, accessibility, responsive behavior, motion orchestration, visual assets, content/CTA quality, forms/data feedback, redesigns, or anti-template preflight.

## Additional resources

- Case studies studied for this skill (Codrops): [Sketching the Impossible](https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/), [GSAP shader wipes](https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/), [Blender camera path](https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/), [Susurrus watercolor/NPR](https://tympanus.net/codrops/2026/04/24/susurrus-crafting-a-cozy-watercolor-world-with-three-js-and-shaders/), [False Earth WebGPU](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/), [Shopify Everywhere](https://tympanus.net/codrops/2026/06/26/engineering-the-web-experience-behind-shopifys-spring-26-edition-everywhere/), [The Journey of Creating a 3D Portfolio (Merouane Bali)](https://tympanus.net/codrops/2025/01/21/the-journey-of-creating-a-3d-portfolio/) (DOM↔WebGL bridge, desktop-vs-mobile split), plus the full [Three.js tag](https://tympanus.net/codrops/tag/three-js/).
