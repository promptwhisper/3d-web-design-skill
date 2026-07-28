# 3D Web Experience Architecture

Use this reference when a Three.js/R3F task is state-heavy, game-like, multi-route, data-driven, or unclear about which layer owns behavior. Select the architecture before selecting effects.

## Contents

- A. Classification contract
- B. Website structures
- C. Spatial tools and configurators
- D. Browser games and game-like experiences
- E. State ownership
- F. Project structures
- G. Lifecycle and routing
- H. Acceptance gates
- I. Primary production references

---

## A. Classification contract

Start by declaring four things:

1. **Primary task**: read, navigate, convert, configure, create, explore, or play.
2. **System of record**: DOM/CMS, domain store, simulation state, or render parameters.
3. **3D role**: decorative, explanatory, manipulable, spatial navigation, or gameplay presentation.
4. **Failure path**: what remains usable when WebGL, an asset, input method, or network fails.

Use this ownership rule:

| Experience | Authoritative state | Consumers |
|---|---|---|
| Website | DOM/router/CMS | Canvas, analytics, transitions |
| Configurator/editor | Domain model + command history | DOM controls, scene adapters, persistence/export |
| Data visualization | Validated data/query state | Charts, labels, 3D marks, filters |
| Game | Simulation + game state machine | Mesh transforms, camera, HUD, audio, effects |
| Visual experiment | Parameter model/render graph | Controls, uniforms, capture/export |

Never update two authoritative copies in parallel. Route all mutations through an explicit action or command, then let other layers observe.

---

## B. Website structures

Choose one dominant structure:

| Structure | Canvas responsibility | DOM responsibility | Best fit |
|---|---|---|---|
| Persistent single Canvas | Background world, cross-route objects, scene compositing | Navigation, copy, forms, routes, SEO | Brand sites, portfolios, multi-page experiences |
| Hero-only 3D | One product, character, or brand object | The rest of the page | SaaS, launches, commerce |
| Scroll-driven spatial story | Camera path, chapter scenes, transitions | Chapter copy, anchors, accessible sequence | Campaigns, product stories, editorial features |
| DOM-first 3D islands | Enhance selected media or modules | Layout, interaction, routing, content | Content, galleries, practical commercial sites |

Implement these systems independently:

1. `Experience`: renderer, scene, camera, clock, resize, lifecycle.
2. `Resources`: manifest, loaders, decode contracts, preload priority, disposal.
3. `Input`: wheel/touch/pointer/keyboard actions writing targets, never final transforms.
4. `DomTracker`: stable rect/font/visibility measurements for DOM↔WebGL alignment.
5. `RouterBridge`: route intent, transition state, deep links, back/forward, focus.
6. `Quality`: initial tier, runtime downgrade, DPR/pass/asset policies.
7. `SceneRegistry`: ownership, neighbor preloading, activation, suspension, disposal.
8. `SemanticFallback`: real DOM content, poster/static state, reduced-motion path.

For a content site, build the real DOM, routes, links, forms, metadata, and responsive layout before the Canvas. Use the Canvas to enhance a working site, not to compensate for a missing one.

### Persistent Canvas invariant

Keep one renderer outside the route swap boundary. On navigation:

1. Resolve the destination and preload only required assets.
2. Make the transition interruptible and give it one owner.
3. Update the real URL and route state.
4. Move focus to the destination main region.
5. Suspend, cache, or dispose the old scene by policy.
6. Verify that back/forward does not create another renderer, ticker, or input listener.

### DOM tracker invariant

Treat DOM as the layout source. Measure with `ResizeObserver` or a batched rect pass, convert pixels to world/screen coordinates, and update only when layout/scroll changes. Do not create a second independent layout system in WebGL.

---

## C. Spatial tools and configurators

Tools need product-state discipline, not only scene discipline.

Use this flow:

```text
DOM / pointer intent
  -> validated command
  -> domain state + undo history
  -> scene adapter and DOM views
  -> persistence / share / export
```

Required systems:

- **Domain schema**: parts, variants, constraints, units, IDs, and version.
- **Command layer**: apply, validate, undo, redo, serialize; avoid mutating meshes directly from buttons.
- **Selection model**: active entity, hover, multi-select, focus/inspect mode.
- **Scene adapter**: map domain IDs to Object3D/instances and update only dirty properties.
- **Persistence**: URL codec, local/server save, schema migration, deterministic reload.
- **Export**: validate source rights and output format; separate preview quality from export quality.
- **Recovery**: invalid files, decode failure, unsupported GPU, stale saved state, and lost context.

For large repeated content, keep normalized data in the domain store and a compact ID→instance mapping in the renderer. Never use `scene.children` order as business identity.

For direct manipulation, provide a DOM control alternative for every critical action. Keep drag thresholds, snapping, constraints, units, and keyboard increments explicit and testable.

---

## D. Browser games and game-like experiences

Three.js renders the game; it is not the game state.

Use this dependency direction:

```text
raw input -> action state/queue -> game state machine
          -> simulation -> collision/rules -> spawn/score/life
          -> render synchronization -> camera/effects/HUD/audio
```

### Choose the simulation

| Need | Model | Notes |
|---|---|---|
| Board, Tetris, tile/voxel rules | Integer grid/occupancy | The grid is truth; physics may animate debris only |
| Pickup, arcade enemy, simple throw | Handwritten vector motion | Multiply by `dt`; use squared distance/AABB/ray |
| Stack, ball, contact, friction, constraints | Rapier/Cannon | Use fixed/semi-fixed stepping and explicit mesh sync |
| Third-person character | Capsule + ground probe + locomotion FSM | Transform input relative to camera; crossfade animation by state |
| Endless flight/run | Parametric curve/angle/world recycling | Keep player locally stable; recycle world/entities |
| Many actors/projectiles | Lightweight data + pool + spatial partition | Sync dirty transforms to instances/meshes |

Do not use a physics engine when an interval, grid, or analytic trajectory expresses the rule more exactly.

### Fixed-step loop

Use a fixed or semi-fixed simulation step whenever contact, replay, network reconciliation, or frame-drop consistency matters:

```ts
const STEP = 1 / 60
let accumulator = 0
let last = performance.now() / 1000

function frame(nowMs: number) {
  const now = nowMs / 1000
  accumulator += Math.min(now - last, 0.25)
  last = now

  readActionState()
  while (accumulator >= STEP) {
    updateStateMachine(STEP)
    updateSimulation(STEP)
    resolveRules(STEP)
    accumulator -= STEP
  }

  syncRender(accumulator / STEP)
  renderer.render(scene, camera)
}

renderer.setAnimationLoop(frame)
```

Cap accumulated time to prevent a backgrounded tab from creating a spiral of death. Pause or suspend on `visibilitychange`; decide whether resume continues, restarts, or shows a pause state.

### Input actions

Map device events to actions such as `move`, `look`, `jump`, `interact`, `fire`, `pause`. Keep raw key/button codes outside gameplay rules. Support:

- simultaneous keys/buttons;
- pointer lock and an explicit exit;
- touch controls with visible alternatives;
- remapping where the experience is more than a short demo;
- ownership transfer, e.g. character → vehicle → UI modal;
- edge actions (`pressed`, `released`) separately from held state.

### State machines

Use explicit states for mutually exclusive or staged behavior: loading, ready, playing, paused, game-over, replay; or idle, walk, sprint, jump, falling, land, enter vehicle, drive. Avoid combinations of booleans that permit impossible states.

Keep animation events and physics events synchronized through state transitions. Do not infer `isJumping` only from the current animation clip or mesh height.

### Collision escalation

Escalate only when necessary:

1. squared center distance;
2. sphere/AABB;
3. ray/shape cast;
4. spatial hash/broadphase;
5. physics contacts/constraints;
6. precise mesh tests only for rare, justified cases.

Separate coarse hit detection from scoring gates. For example, a basket score may require entry through an upper plane followed by exit through a lower plane; one overlap event is insufficient.

### Entity lifecycle

Pool frequently spawned projectiles, pickups, particles, tiles, and enemies. Reset all mutable state on checkout/check-in. Keep rule data lightweight and let render objects mirror it; do not store score, health, or ownership only in mesh `userData` unless a validated import schema deliberately defines it.

---

## E. State ownership

Use this matrix during review:

| State | Owner | Update path |
|---|---|---|
| Route, copy, form values | Router/DOM/app store | normal events/actions |
| Active room/section | discrete shared store | route/observer actions |
| Scroll/pointer target | input service/ref | raw events write target |
| Camera/object smoothed value | frame loop/GSAP proxy | approach target each frame |
| Physics body transform | physics world | fixed step; mesh reads/interpolates |
| Game score/life/level | game state | rules system; HUD observes |
| Tool configuration | domain command store | validated commands; scene observes |
| Shader time/progress | render timeline | uniform/ref, not React render state |
| Loaded resource | resource manager | manifest + cache + explicit disposal |

If a review finds two owners, pick one and turn the other into a projection.

---

## F. Project structures

### Website

```text
src/
  app/ or routes/          # real pages, metadata, CMS
  components/              # semantic DOM
  experience/
    Experience
    Renderer / Camera / Input / Quality / Resources
    RouterBridge / DomTracker
    scenes/ materials/ post/
  state/                   # discrete shared state
public/
  models/ textures/ video/ fallback/
  assets-sources.md
```

### Tool/configurator

```text
src/
  domain/                  # schema, constraints, commands
  state/                   # history, persistence, migration
  scene/                   # adapters, selection, gizmos, export
  ui/                      # accessible controls and feedback
  workers/                 # heavy parsing/generation
```

### Game

```text
src/
  game/                    # lifecycle, config, state machine
  input/                   # action mapping
  simulation/              # movement, physics, collision/rules
  entities/                # player, enemy, projectile
  systems/                 # spawn, score, pool, spatial hash
  render/                  # scene, camera rig, effects, mesh sync
  ui/                      # HUD, menus, pause, accessibility
  audio/                   # user-gated mixer and cues
```

Keep high-frequency simulation/render code independent from framework component rerenders.

---

## G. Lifecycle and routing

Define these operations explicitly:

- `load`: fetch/decode and report progress/errors;
- `start`: attach active input and begin updates;
- `pause`: stop simulation/audio/video while retaining resumable state;
- `resume`: reset clocks before continuing;
- `deactivate`: hide/suspend a cached scene;
- `dispose`: remove listeners and release geometries, materials, textures, render targets, controls, skeletons, workers, and decoders where applicable;
- `recover`: handle asset failure and WebGL context loss with a designed fallback.

Use `renderer.info`, memory snapshots, and repeated route/scene switching to detect growth. Removing a mesh from a scene does not dispose its GPU resources.

---

## H. Acceptance gates

### Website

- Open every important route directly, refresh it, and use back/forward repeatedly.
- Keep DOM title, CTA, navigation, form, metadata, and fallback usable without Canvas.
- Verify no second renderer, ticker, or event listener appears after navigation.
- Test 375px, landscape, keyboard, touch, reduced motion, slow network, low tier, and context loss.
- Measure field-oriented Core Web Vitals and real frame time; do not substitute a loader animation for useful content.

### Tool/configurator

- Apply, undo, redo, save, reload, share, export, and recover invalid/stale input.
- Verify domain state and scene state remain identical after every command.
- Test selection and manipulation with mouse, touch, and keyboard alternatives.
- Confirm exported assets/data preserve license and provenance requirements.

### Game

- Run at normal, low, and intentionally irregular frame rates; compare rule outcomes.
- Test action press/hold/release, pause/resume, restart, death/win, and focus loss.
- Verify collision gates, spawn thresholds, pooling resets, difficulty progression, and state transitions.
- Confirm HUD/audio read simulation state rather than maintaining parallel counters.
- Test keyboard, pointer, touch/controller paths that the experience promises.

## I. Primary production references

- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): `setAnimationLoop`, `compileAsync`, `renderer.info`, disposal, context-loss simulation, and renderer sizing.
- [Three.js disposal guide](https://threejs.org/manual/en/how-to-dispose-of-objects.html): explicit geometry, material, texture, render-target, skeleton, control, and pass cleanup responsibilities.
- [React Three Fiber performance scaling](https://r3f.docs.pmnd.rs/advanced/scaling-performance): on-demand rendering, instancing, reuse, and adaptive performance patterns.
- [Core Web Vitals](https://web.dev/articles/vitals): field measurement and p75 evaluation for LCP, INP, and CLS.
