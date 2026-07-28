# Open-Source Three.js Casebook

Use this reference to select architecture references, compare repositories, or adapt public Three.js/R3F work. It is a pattern index, not permission to copy whole sites.

License/content snapshot: 2026-07-26; links rechecked 2026-07-28. Re-check the exact repository revision before reuse because licenses, branches, dependencies, demos, and asset rights can change.

## Contents

- A. License and source gate
- B. Website and application references
- C. Game and game-like references
- D. Pattern-to-project selector
- E. Safe extraction workflow

---

## A. License and source gate

Classify every candidate:

| Class | Meaning | Action |
|---|---|---|
| Standard open-source license | MIT, Apache-2.0, AGPL-3.0, etc. is present | Follow that license; still check asset/content rights |
| Open-source code, separate content rights | Code license excludes models, images, copy, music, fonts, or brand assets | Reuse mechanisms only; replace protected content |
| Source-visible but restricted/unlicensed | No license, custom learning-only terms, noncommercial/no-derivatives terms, or contradictory text | Read for study; obtain written permission before reuse |

Inspect these before installation or copying:

```text
LICENSE / LICENSE.md
README.md
package.json
.env.example
public/**/license* / credits* / attribution*
```

Record repository URL, commit/revision, author, license, copied files or concepts, modifications, and asset sources. Public GitHub access does not grant a reuse license. A permissive code license does not transfer trademarks, portfolio work, Apple assets, third-party models, music, photography, or paid-font rights.

For AGPL software, treat public network deployment as a copyleft review point; do not casually relicense it as MIT or fold it into a closed service without legal review.

---

## B. Website and application references

Prefer projects with a complete information architecture, real routes or product behavior, and an explicit license. Use older projects for patterns, not dependency versions.

| Project | Architecture lesson | License boundary | Repository |
|---|---|---|---|
| ITom Portfolio | R3F infinite corridor, scene context, room warmup, `compileAsync`, device tiering, semantic fallback | MIT code; personal assets/textures/images/copy excluded | [ITomPoland/portfolio-itom](https://github.com/ITomPoland/portfolio-itom) |
| Git City | Next.js full-stack 3D product, Supabase auth/data, Stripe, instanced city, LOD | AGPL-3.0 | [srizzon/git-city](https://github.com/srizzon/git-city) |
| Bruno Simon Folio 2019 | Vanilla Three experience ownership, driving input, spatial triggers, game-like portfolio navigation | MIT; classic architecture is dated | [brunosimon/folio-2019](https://github.com/brunosimon/folio-2019) |
| Hamish Williams Portfolio | Remix/DOM content with a restrained Three brand layer, routes, Storybook, real form infrastructure | MIT | [HamishMW/portfolio](https://github.com/HamishMW/portfolio) |
| Aimee's Papercraft World | Strong low-poly/hand-painted art direction, seasonal scene structure, R3F + GSAP | MIT; verify artwork rights; README notes loading/responsive limitations | [andrewwoan/aimee-weis-papercraft-world](https://github.com/andrewwoan/aimee-weis-papercraft-world) |
| My Interactive Workspace | Room-as-content, Theatre.js camera direction, Cannon interactions, embedded PDF/music/2D game | MIT | [Snokke/my-interactive-workspace](https://github.com/Snokke/my-interactive-workspace) |
| map3d | OSM/Leaflet data into R3F buildings/roads with GLB export | MIT; upstream geographic data quality/licensing still matters | [cartesiancs/map3d](https://github.com/cartesiancs/map3d) |
| Character Studio | Avatar configuration, VRM/GLB export, skinned-mesh merging, texture atlas, domain manager outside React | MIT code; asset packs are separate | [M3-org/CharacterStudio](https://github.com/M3-org/CharacterStudio) |
| VR Art Gallery | WebXR input, ultra-high-resolution artwork tiling, normal/displacement preprocessing | MIT; artwork rights are separate | [mattvr/vr-art-gallery](https://github.com/mattvr/vr-art-gallery) |
| Maxime Heckel Blog | Next.js/MDX content site with embedded R3F experiments and runnable code | Code MIT; editorial content CC BY-NC 4.0 | [MaximeHeckel/blog.maximeheckel.com](https://github.com/MaximeHeckel/blog.maximeheckel.com) |
| Retro Computer Website | 3D device as interface, shell/filesystem/Markdown subsystems | MIT | [edhinrichsen/retro-computer-website](https://github.com/edhinrichsen/retro-computer-website) |
| React-Three-Next | Persistent Canvas and DOM/Canvas route synchronization | MIT; dependency versions are dated | [pmndrs/react-three-next](https://github.com/pmndrs/react-three-next) |
| 2.5D Island Resume | Mobile-first Vanilla Three, pixel-art world, game-like résumé, Playwright | MIT | [hexianWeb/island](https://github.com/hexianWeb/island) |
| Apple Clone | R3F product model, color variants, GSAP scroll/video story | MIT code; Apple media, marks, and models require separate review | [sanidhyy/apple-clone](https://github.com/sanidhyy/apple-clone) |
| Nuxt 3D Portfolio | Nuxt/Vue/Pinia integration with ordinary Three.js and GSAP | Apache-2.0 | [MingPV/3D-Portfolio](https://github.com/MingPV/3D-Portfolio) |

### Source-visible study references

Do not treat these as ordinary reusable templates without resolving their terms:

| Project | Restriction/risk | Study value |
|---|---|---|
| [Basement Studio Website 2025](https://github.com/basementstudio/website-2k25) | No clear LICENSE in the checked snapshot | Next + Sanity + R3F + Offscreen + Rapier + Canvas UI production structure |
| [David Hckh Portfolio 2025](https://github.com/davidhckh/portfolio-2025) | No recognized license in the checked snapshot | Vue + Vanilla Three + GSAP immersive portfolio |
| [Moncy Portfolio](https://github.com/MoncyDev/Portfolio-Website) | Learning-oriented custom terms; replication/commercial restrictions | R3F, physics, GSAP, post-processing, experience organization |
| [Amr Khamis Portfolio](https://github.com/AmrKhamis1/Portfolio) | CC BY-NC-ND 4.0 | R3F, Cannon, GSAP, GLSL, post-processing |
| [Giats Portfolio](https://github.com/Giats2498/giats-portfolio) | License text was internally contradictory | Next/R3F/Rapier/GSAP/SEO structure |
| [Sunny Patel Portfolio](https://github.com/sunnypatell/react-threejs-portfolio) | Custom no-modification/noncommercial terms | Common R3F portfolio section composition and attribution list |
| [iPhone Recreation](https://github.com/adrianhajdin/iphone) | No clear license in checked snapshot; Apple rights also apply | Product-story tutorial structure |

---

## C. Game and game-like references

Use the same license caution for CodePen and Codrops tutorials; visible source panels and tutorial downloads are not automatically MIT.

| Project | Primary lesson | License boundary | Source |
|---|---|---|---|
| Stack Game | One-dimensional interval overlap is the rule; physics animates discarded pieces | No independent license identified in checked source | [CodePen](https://codepen.io/HunorMarton/pen/MWjBRWp) |
| Gravity Game | Minimal handwritten gravity, damping, bounce, and pointer interaction | No independent license identified | [CodePen](https://codepen.io/mrdoob_/pen/yLmPPYK) |
| 3D Tetris | Integer occupancy grid is authoritative; Three.js mirrors it; physics only supports game-over/debris feedback | No license identified in checked snapshot | [kamilmac/tetris](https://github.com/kamilmac/tetris) |
| Character Controller sample | R3F + Rapier capsule, ground probes, movement and follow camera | README referenced MIT but checked snapshot lacked a LICENSE; verify | [icurtis1/character-controller-sample-project](https://github.com/icurtis1/character-controller-sample-project) |
| Space Game | Curve/Frenet frame camera, path-driven world, componentized shooting and ray hits | TresJS lab license was not identified in checked snapshot | [Tresjs/lab space-game](https://github.com/Tresjs/lab/tree/main/app/components/space-game) |
| Sketchbook | World ownership, fixed Cannon step, locomotion FSM, vehicles, control transfer, glTF scene metadata | MIT; archived/old dependencies | [swift502/Sketchbook](https://github.com/swift502/Sketchbook) |
| The Aviator | Minimal endless-flight loop, target-follow control, pooled enemies/coins, progression thresholds | Codrops custom terms; verify current tutorial licensing | [yakudoo/TheAviator](https://github.com/yakudoo/TheAviator) |
| The Aviator 2 | Extends the same loop with weapons, HP, levels, managers, projectile collision | Codrops custom terms | [Badestrand/TheAviator2](https://github.com/Badestrand/TheAviator2) |
| Skating Bunny | Character control plus ping-pong-FBO scratch trails and visual feedback | No independent license identified; model/texture rights separate | [CodePen](https://codepen.io/Yakudoo/pen/poqazQo) |

The durable lesson is architectural: input actions → state machine → simulation → rules → entity lifecycle → render/HUD/audio. Copy that dependency direction, not an old global-variable code style.

---

## D. Pattern-to-project selector

| Need | First reference | Second reference |
|---|---|---|
| Production immersive portfolio | ITom | Hamish for DOM discipline |
| Game-like spatial portfolio | Bruno Simon | 2.5D Island |
| Full-stack data-driven 3D product | Git City | map3d |
| Product configurator/editor | Character Studio | Apple Clone for product camera/story |
| Content site with embedded experiments | Maxime Heckel Blog | Hamish Williams |
| Room/device as content container | Interactive Workspace | Retro Computer |
| WebXR exhibition | VR Art Gallery | Aimee for art direction |
| Persistent Canvas routing | React-Three-Next | ITom/Git City for newer production context |
| Deterministic puzzle | 3D Tetris | Stack Game |
| Third-person/vehicle architecture | Sketchbook | Character Controller sample |
| Endless path/world recycling | The Aviator | Space Game |
| GPU-driven interaction trail | Skating Bunny | technique catalog ping-pong FBO patterns |

---

## E. Safe extraction workflow

1. **Define the target mechanism.** Name the exact pattern: persistent Canvas, device tiering, command history, capsule controller, object pool, shader reveal, etc.
2. **Freeze evidence.** Record repository and commit; read license and asset terms at that revision.
3. **Map ownership.** Identify who owns renderer, route/domain/game state, input, time, resources, and disposal.
4. **Trace one vertical slice.** Follow one user action from event → state → simulation/scene → UI feedback. Do not begin by copying folders.
5. **Reimplement against current APIs.** Check current official Three.js/R3F/framework docs and preserve the mechanism, not obsolete syntax.
6. **Replace identity assets.** Substitute brand, copy, portfolio work, models, textures, music, fonts, and screenshots unless explicitly licensed for the intended use.
7. **Prove the extracted pattern.** Build it first with boxes/data fixtures, test interruptions and low tier, then dress it.
8. **Retain attribution and license notices.** Include required notices and an asset-source manifest in the destination project.

Reject a reference when its central value depends on assets you cannot legally or technically reproduce, or when adapting it would cost more than implementing the underlying mechanism cleanly.
