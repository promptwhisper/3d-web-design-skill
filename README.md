# 3D Web Design Skill

Codex skill for planning, building, and reviewing cinematic 3D web experiences without losing production UX quality.

It combines:

- Three.js / React Three Fiber / WebGPU / GSAP technique patterns
- Scroll-driven storytelling and camera choreography
- DOM and WebGL state-bridging rules
- Accessibility, responsive, and performance quality gates
- Anti-template taste checks for landing pages, portfolios, launches, and redesigns

## Install

Clone this repo into the Codex skills folder using the skill name as the directory name:

```bash
mkdir -p ~/.codex/skills
git clone git@github.com:promptwhisper/3d-web-design-skill.git ~/.codex/skills/3d-web-design
```

If you already installed it:

```bash
git -C ~/.codex/skills/3d-web-design pull
```

Restart Codex after installing or updating.

## When To Use

Use `$3d-web-design` for:

- 3D landing pages
- Immersive portfolios
- WebGL/WebGPU scenes
- Three.js / R3F / drei projects
- GSAP scrolltelling
- Shader effects
- Camera-path galleries
- Product launch pages with 3D visuals
- Redesigns that need stronger visual taste and UX discipline
- Reviews of 3D web performance, accessibility, interaction, or visual quality

Do not force this skill onto a plain marketing site where 3D does not carry meaning. A standard layout is better when the space is not part of the story.

## Core Method

The governing workflow is:

```text
Screenplay -> Mechanics -> Dress -> Optimize
```

- **Screenplay**: Define story, page kind, audience, style direction, dials, CTA, accessibility fallback, and what the user sees.
- **Mechanics**: Build scroll, camera, state, route, input, and layout behavior with simple geometry first.
- **Dress**: Add materials, shaders, textures, sound, post-processing, and final art direction.
- **Optimize**: Profile and tier by device. Keep WebGL, React, and DOM work inside frame budget.

Second rule: spectacle never outranks usability. If a scene breaks contrast, keyboard access, touch targets, readable type, predictable navigation, or reduced motion, it is not finished.

## Design Dials

The skill uses three dials to guide design decisions:

| Dial | Low | High |
|---|---|---|
| `DESIGN_VARIANCE` | Symmetric, restrained, predictable | Asymmetric, editorial, experimental |
| `MOTION_INTENSITY` | Static, micro-interactions only | Pinned scroll, camera paths, kinetic scenes |
| `VISUAL_DENSITY` | Airy, gallery-like | Dense, operational, dashboard-like |

Typical examples:

- Minimal / Linear-style: `5-6 / 3-4 / 2-3`
- Premium consumer: `7-8 / 5-7 / 3-4`
- Awwwards / experimental: `9-10 / 8-10 / 3-4`
- Trust-first / regulated: `3-4 / 2-3 / 4-5`

## Files

```text
3d-web-design/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    ├── technique-catalog.md
    └── frontend-taste-and-ux.md
```

### `SKILL.md`

Main decision spine. It stays concise so Codex can load it quickly when the skill triggers.

### `references/technique-catalog.md`

Code-level patterns for 3D web work:

- Architecture and state
- Input and scroll
- Camera systems
- Instancing and GPU-driven rendering
- Shaders and materials
- Post-processing
- Transitions and reveals
- Textures and assets
- Performance and tiering
- Sound
- Accessibility
- Physics and interactive UI

### `references/frontend-taste-and-ux.md`

Detailed frontend taste and UX guide:

- Design read and dials
- Design-system selection
- Product-fit presets
- 3D page structure patterns
- Hero and first viewport discipline
- DOM/WebGL interface contract
- Accessibility and interaction gates
- Responsive/layout mechanics
- Typography, color, and materiality
- Motion orchestration
- Visual assets and media
- Content, CTA, and social proof rules
- Forms, feedback, charts, and data
- Redesign protocol
- Anti-template preflight
- Implementation guardrails

## What This Skill Tries To Prevent

- Centered hero over a generic dark mesh
- AI-purple glow as the default art direction
- Three equal feature cards
- Pure-text "minimalism" with no real visuals
- Div-based fake screenshots
- 3D scenes that hide core navigation
- Canvas-only text with no semantic DOM
- Scroll hijacks with no reduced-motion path
- Repeated section eyebrows and decorative labels
- Redesigns that silently break routes, SEO, analytics, forms, or brand memory

## Development Notes

The runtime skill should remain small and progressively disclosed:

- Keep `SKILL.md` as the short decision spine.
- Put reusable detailed guidance in `references/`.
- Avoid adding scripts unless a repeated fragile operation needs deterministic execution.
- Keep README as repository documentation; it is not required for Codex runtime discovery.

Validate frontmatter after edits:

```bash
ruby -ryaml -e '
path = "SKILL.md"
content = File.read(path)
match = content.match(/\A---\n(.*?)\n---/m) or abort "Invalid frontmatter"
fm = YAML.safe_load(match[1])
abort "Missing name" unless fm["name"]
abort "Missing description" unless fm["description"]
puts "Skill frontmatter looks valid"
'
```

## Updating

After changing the local installed skill, sync the repo copy and push:

```bash
cp ~/.codex/skills/3d-web-design/SKILL.md ./SKILL.md
cp ~/.codex/skills/3d-web-design/agents/openai.yaml ./agents/openai.yaml
cp ~/.codex/skills/3d-web-design/references/*.md ./references/
git status
git add SKILL.md agents/openai.yaml references README.md
git commit -m "Update 3D web design skill"
git push
```
