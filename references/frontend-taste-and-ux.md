# Frontend Taste & UX Reference for 3D Web

Use this reference when a 3D web task involves landing-page quality, portfolio polish, product-launch storytelling, redesigns, DOM UI around a canvas, accessibility, responsive behavior, or "make it look less templated" feedback.

This is a 3D-web-specific synthesis of broad UI/UX rules and anti-slop frontend heuristics. It complements `technique-catalog.md`, which focuses on Three.js, R3F, WebGPU, GSAP, shaders, and rendering patterns.

## Table of contents

- A. Design read and dials
- B. Design-system selection
- C. Product-fit presets
- D. 3D page structure patterns
- E. Hero and first viewport discipline
- F. DOM and WebGL interface contract
- G. Accessibility and interaction gates
- H. Responsive and layout mechanics
- I. Typography, color, and materiality
- J. Motion orchestration
- K. Visual assets and media
- L. Content, CTAs, and social proof
- M. Forms, feedback, charts, and data
- N. Redesign protocol
- O. Anti-template preflight
- P. Implementation guardrails

---

## A. Design read and dials

Start every design task by reading the brief before touching code.

### Design read

State one line:

```text
Reading this as: [page kind] for [audience], with a [vibe] language, leaning toward [system/aesthetic].
```

Read these signals:

- **Page kind**: landing, product launch, portfolio, agency site, event, editorial, redesign, interactive demo.
- **Audience**: technical buyer, recruiter, design-conscious consumer, developer, public-sector user, internal team.
- **Vibe words**: calm, Linear-style, premium, playful, Awwwards, brutalist, editorial, dark-tech, glassy, trust-first.
- **References**: URLs, screenshots, products, competitors, previous site, visual assets.
- **Constraints**: accessibility-first, regulated, public-sector, children, ecommerce trust, mobile-heavy traffic.

Ask one clarifying question only when the design read genuinely splits into different directions.

### Dials

Use three dials to turn taste into implementation choices:

| Signal | DESIGN_VARIANCE | MOTION_INTENSITY | VISUAL_DENSITY |
|---|---:|---:|---:|
| Minimal, calm, Linear-style, editorial | 5-6 | 3-4 | 2-3 |
| Premium consumer, Apple-like, luxury, brand | 7-8 | 5-7 | 3-4 |
| Playful, Awwwards, experimental, agency | 9-10 | 8-10 | 3-4 |
| Mainstream landing or portfolio | 7-9 | 6-8 | 3-5 |
| Trust-first, public-sector, regulated | 3-4 | 2-3 | 4-5 |
| SaaS/admin/data-heavy product surface | 3-5 | 2-4 | 7-9 |
| Redesign preserve | match existing | existing + 1 | match existing |
| Redesign overhaul | existing + 2 | existing + 2 | match existing |

Interpretation:

- `DESIGN_VARIANCE` 1-3: symmetrical, predictable, restrained.
- `DESIGN_VARIANCE` 4-7: offset grids, asymmetric spacing, varied media ratios.
- `DESIGN_VARIANCE` 8-10: masonry, pinned storytelling, large empty zones, surprising composition.
- `MOTION_INTENSITY` 1-3: static with hover/active states only.
- `MOTION_INTENSITY` 4-7: scroll reveals, shared elements, subtle parallax, UI state motion.
- `MOTION_INTENSITY` 8-10: pinned scenes, scrubbed camera paths, kinetic type, physics or shader-led choreography.
- `VISUAL_DENSITY` 1-3: art-gallery spacing, few claims, large media.
- `VISUAL_DENSITY` 4-7: normal product/marketing density.
- `VISUAL_DENSITY` 8-10: cockpit/dashboard density, smaller gaps, strict hierarchy.

---

## B. Design-system selection

Do not imitate an official design system by hand when the real package exists.

| Brief reads as | Prefer | Notes |
|---|---|---|
| Google-ish product | Material Web / Material 3 tokens | Useful when the UI is product-like, not purely cinematic. |
| Microsoft / enterprise SaaS | Fluent UI | Good for enterprise surfaces and admin-heavy experiences. |
| IBM / enterprise analytics | Carbon | Good for dense data, reports, operational surfaces. |
| Shopify app surface | Polaris | Use for Shopify admin-like product UI. |
| Atlassian / Jira-like product | Atlaskit | Use tokens and official components. |
| GitHub / developer community | Primer | Brand variant for marketing, product variant for app UI. |
| UK public-sector | GOV.UK Frontend | Trust and compliance outrank visual experimentation. |
| US public-sector | USWDS | Same. |
| Accessible React foundation | Radix Themes | Useful for polished primitives with good semantics. |
| Ownable modern SaaS | shadcn/ui | Customize heavily; never ship default state. |
| Indie marketing / custom art direction | Tailwind + native CSS | Good default when the brief is aesthetic, not system-specific. |

Rules:

- Use one system per project.
- Keep system tokens intact unless the brief demands a custom brand layer.
- Check `package.json` before importing a library.
- If using a design system, let it handle primitives, focus, disabled states, dialogs, tabs, menus, and form controls where possible.

---

## C. Product-fit presets

Use these presets as a fast starting point, then override from the brief.

### Immersive portfolio

- Goal: memory, personality, selected work.
- 3D role: spatial metaphor, gallery, room, object world, camera tour.
- Dials: variance 7-9, motion 6-8, density 2-4.
- Avoid: all-work grid with identical cards, decorative section numbers, fake studio weather/location strips.
- Must include: accessible work list, direct project links, keyboard route changes.

### Premium product launch

- Goal: desire, inspection, trust.
- 3D role: object inspection, material reveal, exploded view, configurator, sensory world.
- Dials: variance 6-8, motion 5-7, density 3-4.
- Avoid: beige+brass default palette, fake specs, div-based product mockups, hero copy that needs scrolling to find CTA.
- Must include: real product visuals, spec credibility, responsive image/object framing.

### Experimental agency site

- Goal: distinctiveness and motion competence.
- 3D role: kinetic identity, spatial navigation, interactive manifesto.
- Dials: variance 9-10, motion 8-10, density 2-4.
- Avoid: random chaos, scroll hijacks without escape, every section using the same "designed" eyebrow language.
- Must include: reduced-motion equivalent, plain DOM fallback, obvious contact path.

### B2B / SaaS launch

- Goal: clarity, trust, conversion.
- 3D role: one memorable hero/section, product metaphor, light spatial accent.
- Dials: variance 5-7, motion 4-6, density 4-6.
- Avoid: letting the 3D scene obscure product value, generic three-card feature row, fake dashboards.
- Must include: crisp value prop, real product UI or generated product media, accessible CTAs.

### Data-heavy or operational product

- Goal: task completion and scanning.
- 3D role: rare accent, not the main interface.
- Dials: variance 3-5, motion 2-4, density 7-9.
- Avoid: immersive navigation, decorative parallax, large WebGL payload before core UI.
- Must include: data tables/charts with accessible summaries, stable layout, low-latency inputs.

---

## D. 3D page structure patterns

Choose page structure before shader work.

### Single-canvas persistent shell

Use for immersive portfolios, route-to-room sites, or story worlds. Keep the canvas mounted outside routed content. DOM sections drive camera state via a shared store.

Good when:

- The site has a continuous world or route-to-room metaphor.
- Camera continuity matters.
- You can provide accessible DOM twins for each section.

Risk:

- GPU memory leaks when routes remount scenes.
- Focus and back behavior become unclear if route state is not mirrored in DOM.

### Hero-only 3D

Use for SaaS, product launch, editorial, or ecommerce when the 3D object adds delight but the page is mostly standard DOM.

Good when:

- Mobile users need fast content.
- The product value is textual or transactional.
- The hero object can lazy-degrade to image/video.

Risk:

- Text-plus-canvas hero becomes generic if the object is not tied to the story.

### Scroll-driven spatial story

Use when the page is truly sequential: rooms, gallery path, exploded product, timeline, campaign story.

Good when:

- Each scene has a clear beat.
- The user can still navigate by keyboard and normal anchors.
- Reduced motion has a parallel static sequence.

Risk:

- Scroll hijack breaks expectations.
- Camera mechanics get dressed before they feel right.

### DOM-first with 3D islands

Use for editorial, docs, public-sector, trust-first, dashboards, and most practical product sites.

Good when:

- Content hierarchy matters more than immersion.
- There are forms, tables, charts, or dense navigation.
- The 3D should be a supporting visual.

Risk:

- If the 3D island is purely decorative, it may not justify its weight.

---

## E. Hero and first viewport discipline

The hero is a single moment, not a feature list.

Checklist:

- Hero content fits the initial viewport at desktop and mobile.
- Desktop headline is usually 1-2 lines.
- Supporting copy is usually 20 words or fewer.
- CTA is visible without scrolling.
- Nav is one line on desktop and under roughly 80px tall.
- Trust logos, social proof, pricing teasers, and feature bullets move below the hero.
- Full-height hero uses `min-height: 100dvh`, not `100vh` / `h-screen`.
- Top padding is capped; if the hero feels cramped, rebalance scale and media instead of pushing content down.
- Hero visual is real: rendered 3D, generated/real media, product shot, screenshot, live component preview, or a true interactive scene.

3D hero variants:

- **Object inspection**: product/model with drag/hover, DOM copy beside it.
- **Media mask**: large type or shape masks video/canvas.
- **Pinned reveal**: hero stays while scene/object state changes across initial scroll.
- **Spatial threshold**: first scroll enters a room or path, with clear escape/back affordances.
- **Editorial poster**: type is the scene, 3D used as subtle depth or texture.

Avoid:

- Centered H1 over dark mesh by default.
- Giant gradient text.
- Scroll cues.
- Fake beta/version badges unless launch status is real.
- Tiny mono metadata strips that add no navigation or state.

---

## F. DOM and WebGL interface contract

Canvas can express atmosphere; DOM must carry meaning.

Rules:

- DOM owns semantic structure: headings, landmarks, nav, forms, buttons, links, captions, chart summaries, route anchors.
- WebGL may mirror state visually, but it must not be the only place state exists.
- Discrete UI state can live in React context or Zustand.
- High-frequency values (scroll, pointer, camera, physics) stay in refs, Zustand getters, Motion values, uniforms, or GSAP proxies, not React state.
- Icon-only controls need `aria-label`.
- Route/scene changes must preserve focus or move focus to main content.
- Key sections should be deep-linkable by URL/anchor.
- Canvas should be `aria-hidden` unless it exposes a carefully built accessible interaction. Provide DOM alternatives either way.

Pattern:

```text
DOM nav/control -> shared store -> scene camera/uniforms
scene event -> shared store -> DOM label/state/aria update
```

Do not:

- Put primary navigation entirely inside raycast-only 3D objects.
- Hide CTAs behind hover or drag.
- Use canvas text as the only readable copy.
- Let a modal/dialog exist visually in WebGL without DOM focus management.

---

## G. Accessibility and interaction gates

### Accessibility

- Normal text contrast: at least 4.5:1.
- Large text and important glyphs: at least 3:1.
- Focus rings are visible and not removed.
- Heading order is logical.
- Meaningful images/media have alt text or a text equivalent.
- Canvas-only visuals have semantic DOM fallback.
- Color is never the only indicator of state.
- Keyboard users can reach every action, room, section, control, and close affordance.
- Provide skip-to-main when page chrome is substantial.

### Touch

- Primary touch targets are at least 44x44px.
- Maintain at least 8px spacing between touch targets.
- Provide visible alternatives for drag, hover, swipe, or scroll-only interactions.
- Use drag thresholds so taps do not become accidental drags.
- Avoid horizontal swipe conflicts in the main scroll path.
- Keep primary controls away from safe-area edges and gesture bars.
- Press feedback appears within about 100ms.

### Reduced motion

- Reduced motion is a parallel design, not a kill switch.
- Camera tours become stepped sections or static compositions.
- Infinite loops, parallax, scroll-scrub, splats, magnetic physics, and video-sequence scroll collapse to static or simple fades.
- Use `gsap.matchMedia`, `useReducedMotion`, or CSS media queries.

---

## H. Responsive and layout mechanics

Responsive rules:

- Start with 375px mobile.
- Test tablet, desktop, wide desktop, and mobile landscape.
- Prevent horizontal scroll.
- Do not disable zoom.
- Prefer CSS Grid over complex flex percentage math.
- High-variance layouts above tablet collapse to strict single-column below 768px.
- Reserve media dimensions with `width`/`height`, `aspect-ratio`, or stable canvas containers.
- Fixed nav/CTA bars reserve content insets so scroll content is not hidden.
- Use safe-area padding for fixed top/bottom UI.

Layout rhythm:

- Use a 4/8px spacing scale.
- Group related items with whitespace before adding cards.
- Use cards only when the frame communicates real hierarchy.
- Avoid stacking many identical split sections. Break rhythm with full-width media, bento, sticky stack, editorial type, or a short CTA section.
- Bento grids need exact cell count and visual variation: image, canvas, tint, pattern, or real product media in some cells.

Hero/layout bans for 3D marketing pages:

- No three identical feature cards as the only feature layout.
- No repeated left-image/right-text sections beyond two in a row.
- No split-header pattern unless the right side contains a real visual or control.
- No endless hairline rows for long specs.
- No tiny floating top-right explanatory paragraph with no alignment role.

---

## I. Typography, color, and materiality

### Typography

- Body text is at least 16px on mobile.
- Body line-height is usually 1.5-1.75.
- Paragraph line length is roughly 60-75 characters on desktop.
- Use tabular figures for metrics, timers, prices, and counters.
- Do not default to Inter when a more fitting sans is available.
- Use serif only when the brand/aesthetic genuinely supports editorial, heritage, luxury, or publication cues.
- If using italic display type with descenders (`y`, `g`, `j`, `p`, `q`), reserve enough line-height/padding to avoid clipping.
- Emphasis inside a headline usually stays in the same family via weight or italic, not a random second font.

### Color

- Use semantic tokens: surface, elevated surface, text, muted text, accent, danger, success, focus.
- One accent color per page unless data visualization or brand system requires more.
- Avoid AI-purple/blue glow as default.
- Avoid repeating beige+brass+espresso as a default premium-consumer palette.
- Test light and dark modes independently.
- Avoid pure black/white unless the brand deliberately requires hard contrast.
- Do not rely on color alone for meaning.

### Materiality

- Glass/frosted effects require contrast and fallback.
- Blur is expensive on mobile; cut it early when tiering down.
- Inner borders and subtle tinted shadows often read better than outer glow.
- Pick one radius system and keep it: sharp, soft, pill, or documented mix.
- Shadows should be tinted to the surrounding hue, not generic black.

---

## J. Motion orchestration

Choose the lightest tool that can do the job:

- CSS transitions: hover, active, simple opacity/transform changes.
- Motion (`motion/react`): UI state, layout transitions, simple reveal, shared elements, gesture feedback.
- GSAP ScrollTrigger: pinning, scrubbed scroll, sticky stacks, horizontal pan, timeline choreography.
- Three.js/R3F/WebGL: real 3D scenes, shader effects, camera motion, particles, FBOs.

Rules:

- Do not drive scroll or pointer values through React state.
- Do not use `window.addEventListener("scroll", ...)` as the main animation driver.
- Animate transform and opacity, not width/height/top/left.
- Use cleanup for every `useEffect` animation.
- Keep Motion, GSAP, and Three from fighting over the same element. Isolate them into leaf components with clear ownership.
- Every animation should communicate hierarchy, storytelling, feedback, or state change.
- If `MOTION_INTENSITY > 4`, the page should actually move; if not, lower the dial.
- Use at most one marquee-like device per page.

### Sticky stack skeleton

Use for scroll-story cards or sections. This is for DOM sections; for WebGL scenes, the same timing can drive camera/uniforms.

```tsx
"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div key={i} className="stack-card sticky top-0 min-h-[100dvh]">
          {card}
        </div>
      ))}
    </div>
  );
}
```

### Horizontal pan skeleton

```tsx
"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
```

Critical details: `start: "top top"`, `pin: true`, scroll length equals actual horizontal distance, and reduced motion bypasses the hijack.

---

## K. Visual assets and media

Asset priority:

1. Real brand/product media.
2. Generated imagery or generated product/texture shots at the correct aspect ratio.
3. Real screenshots or live component previews.
4. Open-license or placeholder photography with descriptive seeds.
5. Explicit TODO slots when assets are missing.

Do not:

- Build fake screenshots from random div rectangles.
- Use hand-rolled decorative SVGs as the main hero visual.
- Ship a pure-text page and call it minimalism.
- Put decorative labels/pills over every image.
- Use photo-credit-style captions unless there is a real photo credit.

3D-specific asset notes:

- Use baked lighting and texture tint when a stylized scene does not need real lights.
- Prefer WebP/AVIF for many hand-drawn or editorial textures; test KTX2 before assuming it helps.
- Use DRACO/meshopt for GLTF where appropriate.
- Use LQIP or reserved aspect-ratio boxes to avoid layout jumps.
- Provide still-image fallback for low-end devices and reduced motion.
- Use real SVG logos for social proof when brands are real. If brands are fictional, create simple marks instead of plain text wordmarks.

---

## L. Content, CTAs, and social proof

### Copy

- One copy register per page.
- Prefer concrete verbs over filler: avoid "elevate", "unleash", "next-gen", "seamless" unless the brand voice truly uses them.
- Short section headline: usually 8 words or fewer.
- Short supporting paragraph: usually 25 words or fewer.
- Re-read all visible strings before delivery.
- Avoid fake precision. Numbers need source data or clear mock labeling.
- Quotes should be short enough to read at a glance.

### CTAs

- One primary CTA per view.
- One label per intent. Do not mix "Contact", "Let's talk", "Start a project", and "Reach out" for the same action.
- CTA labels should not wrap at desktop.
- Button text must pass contrast against its background.
- Ghost buttons over media need scrim, stroke, or solid backdrop.

### Social proof

- Logo wall belongs below the hero.
- Logo wall is logos only, not logos plus industry labels.
- For real brands, use real SVG logos or approved assets.
- For fictional brands, make simple marks that match the style.
- Do not use "Quietly trusted by" style copy as default.

---

## M. Forms, feedback, charts, and data

Forms:

- Labels are visible and above inputs.
- Placeholders are not labels.
- Error text sits near the field.
- First invalid field receives focus after failed submit.
- Toasts use polite live regions and do not steal focus.
- Destructive actions offer confirmation or undo.
- Long forms preserve draft state when possible.

Feedback:

- Loading states match the final layout shape.
- Empty states explain what to do next.
- Error states explain what happened and how to recover.
- Disabled states are semantic and visually clear.
- Pressed states do not shift layout.

Charts/data:

- Chart type matches data type.
- Data has table/text summary for accessibility.
- Legends are visible and close to the chart.
- Tooltip content is keyboard/tap reachable.
- Color is not the only differentiator.
- Large datasets are aggregated or virtualized.
- Data-heavy sections avoid decorative gradients/shadows that obscure reading.

---

## N. Redesign protocol

Classify the redesign:

- **Preserve**: modernize while keeping brand memory.
- **Overhaul**: new art direction, but preserve content/IA unless asked.
- **Greenfield**: full reset approved.

Audit before touching:

- Brand colors, fonts, logo, radii, imagery.
- Page tree, routes, slugs, anchors, nav labels.
- Current conversion paths.
- Content blocks that work.
- Filler or broken blocks to retire.
- Signature interactions worth preserving.
- Accessibility wins: focus, alt text, keyboard paths, contrast.
- SEO baseline: ranking pages, meta titles, structured data, OG cards.
- Analytics hooks and event names.

Modernization order:

1. Typography refresh.
2. Spacing and rhythm.
3. Color recalibration.
4. Motion layer.
5. Hero and key-section recomposition.
6. Full block replacement only when necessary.

Never silently change:

- URL structure or route slugs.
- Primary navigation labels.
- Form field names/order.
- Brand logo or wordmark.
- Legal, consent, cookie, or regulated copy.
- Analytics event IDs or tracking hooks.

---

## O. Anti-template preflight

Before delivery, scan for these tells:

- AI-purple glow without brand reason.
- Centered dark mesh hero by default.
- Three equal feature cards.
- Repeated section eyebrows.
- Section numbers masquerading as design.
- Decorative status dots.
- Scroll cues.
- Version labels/beta badges without real status.
- Weather/location/time strips without place-based reason.
- Div-based fake product screenshots.
- Placeholder dashboard rectangles.
- Generic names like "Acme", "Jane Doe", "John Smith".
- Startup-slop terms: "seamless", "unleash", "next-gen", "revolutionize".
- Too many cards where whitespace or dividers would work.
- Same split layout repeated across sections.
- Long spec rows with hairlines on every row.
- Decorative labels over images.
- Duplicate CTA intent.
- CTA text wrapping at desktop.
- Button/form contrast failures.
- Copy that sounds clever but unclear.

Mechanical checks:

- Count section-level eyebrows. Use at most one per three sections.
- Count repeated layout families. Break the third repeated split.
- Confirm bento cell count equals real content count.
- Confirm at least 2-3 bento cells have real visual variation.
- Confirm all visible copy has been reread.
- Confirm theme does not flip randomly between sections.
- Confirm all motion has a reason.
- Confirm no scroll listener drives React state.

---

## P. Implementation guardrails

React/Next:

- Isolate interactive animation components with `"use client"`.
- Keep Server Components static where possible.
- Use `next/font` or self-hosted fonts with `font-display: swap`.
- Check dependencies before imports.
- Lazy-load below-fold heavy Three/Motion/GSAP code.

R3F/Three:

- Keep renderer, resources, camera, and world ownership clear.
- Dispose geometries, materials, textures, render targets, and event listeners.
- Do not remount WebGL contexts per gallery item.
- Use refs/stores/uniforms for high-frequency values.
- Cap DPR by device tier.
- Hide/cull offscreen groups.
- Pre-warm shaders where worth it.

CSS:

- Use `min-height: 100dvh` for viewport sections.
- Prefer grid over fragile flex math.
- Animate transform and opacity.
- Use `will-change` only during real animation.
- Keep z-index scale intentional.
- Put grain/noise in fixed pointer-events-none overlays, not scrolling containers.

QA:

- 375px phone.
- Mobile landscape.
- Tablet.
- Desktop.
- Wide desktop.
- Keyboard-only.
- Reduced motion.
- Dark and light modes.
- Slow network.
- Low-end device tier.
- Lighthouse/Core Web Vitals when possible.
