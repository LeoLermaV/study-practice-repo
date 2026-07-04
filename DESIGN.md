---
version: 1.0
name: Refined-dark-study
description: "A refined dark study environment for long, focused reading sessions. Graphite surfaces with a faint cool cast (never pure black, never flat), softened off-white ink, near-neutral tracking, and one chromatic accent — #0099ff — reserved for links, focus, and progress. Depth comes from a quiet four-step surface ramp plus hairline borders; the old marketing gradient spotlights are replaced by faint per-category tint washes that identify without shouting. Reading typography is tuned mobile-first: 17px/1.75 body, generous section rhythm, scroll-in-place tables and compact code blocks."
colors:
  canvas: "#0e0f13"
  surface-1: "#15171c"
  surface-2: "#1d2026"
  surface-3: "#23262e"
  popover: "#191b21"
  sidebar: "#0b0c0f"
  hairline: "#262a32"
  ink: "#e7e9ee"
  ink-reading: "#cdd1d9"
  ink-muted: "#9aa1ad"
  ink-faint: "#646b78"
  brand: "#0099ff"
  brand-soft: "#58b6ff"
  destructive: "#e5484d"
  chart-1: "#0099ff"
  chart-2: "#8b84f5"
  chart-3: "#c77df0"
  chart-4: "#eb9a5f"
  chart-5: "#ef7189"

typography:
  page-title:
    fontFamily: Inter Variable
    fontSize: 26-28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  topic-title:
    fontFamily: Inter Variable
    fontSize: 26px mobile / 32px desktop
    fontWeight: 600
    lineHeight: 1.15-1.2
    letterSpacing: -0.02em
  section-heading:
    fontFamily: Inter Variable
    fontSize: 17px
    fontWeight: 600
    letterSpacing: -0.01em
  eyebrow:
    fontFamily: Inter Variable
    fontSize: 11px
    fontWeight: 600
    letterSpacing: 0.08-0.1em
    transform: uppercase
  reading-body:
    fontFamily: Inter Variable
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0
  reading-h2:
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.012em
    marginTop: 2.75rem
  ui-body:
    fontSize: 14-15px
    lineHeight: 1.6
  caption:
    fontSize: 13px
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px (block) / 0.85em (inline)
    lineHeight: 1.65

rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  xxl: 18px
  pill: 100px
---

## Overview

This is the design language of a **dark study environment**, not a marketing
artboard. Its predecessor was reverse-engineered from Framer's landing pages —
pure black, poster-tight tracking, loud gradient tiles. Those choices optimize
for a 10-second first impression; this app is read for an hour at a time,
mostly on a phone. Every decision below trades punch for endurance.

**Key principles:**

- **Graphite, not black.** The canvas is `#0e0f13` — a deep graphite with a
  faint cool cast. Surfaces step up through `#15171c` → `#1d2026` → `#23262e`.
  The sidebar and bottom bar sit one step *below* canvas (`#0b0c0f`) so the
  content area reads as the lit surface of the app.
- **Softened ink.** Headings and UI text are `#e7e9ee`, never `#ffffff`.
  Long-form reading body drops one more step to `#cdd1d9` to reduce glare.
  Hierarchy: ink → ink-muted (`#9aa1ad`) → ink-faint (`#646b78`).
- **Near-neutral tracking.** Poster tracking is gone. Titles run -0.02em,
  section heads -0.01em, reading body 0. Hierarchy is carried by size, weight
  (500–650 band), and the eyebrow style — not by compression.
- **One accent, two temperatures.** `#0099ff` (brand) marks links, focus,
  progress, and the active timer. Inside long-form reading, links use
  `#58b6ff` (brand-soft) — same hue, less sting against dark ground.
- **Tint washes, not spotlights.** Category identity is a faint radial wash of
  the category hue (≤13% opacity) over the standard card surface, anchored at
  the top-left corner. The chromatic family (blue/violet/magenta/orange/coral)
  survives from the old system but whispers instead of shouting.
- **Hairline depth.** Every card carries a `border-border/60` hairline plus a
  1px inset top-light (`rgba(255,255,255,0.03)`). Hover states brighten the
  border and lift the surface half a step — no translate jumps on list rows.

## Reading surface (`.topic-content`)

The most important component in the system. Mobile-first:

- 17px / 1.75 body at a 680px max measure (~66ch)
- Paragraph spacing 1.25rem; h2 gets 2.75rem above / 0.875rem below
- Inline code: `rgba(255,255,255,0.055)` chip with matching hairline, 0.85em
- Code blocks: `#101216` inset panel, 13px JetBrains Mono, 12px radius
- Blockquotes: 2px brand-tinted left rule over a 5% brand wash — no italics
- Tables: `display:block; overflow-x:auto` so wide tables scroll in place
  instead of breaking the page on a phone
- Links: brand-soft with a 35%-opacity underline that solidifies on hover

## Elevation

| Level | Surface | Use |
|---|---|---|
| -1 | `#0b0c0f` | Sidebar, mobile nav sheet, pomodoro bar |
| 0 | `#0e0f13` | Canvas |
| 1 | `#15171c` + hairline | Cards, inputs, code chip ground |
| 2 | `#1d2026` | Hover fills, badges, selected nav |
| 3 | `#23262e` | Pressed/active fills |
| float | `#191b21` + `0 12px 40px rgba(0,0,0,0.5)` | Popovers, flyouts |

## Do

- Keep the app dark-only; there is no light mode.
- Reserve `#0099ff` for signal: links, focus rings, progress, active states.
- Use eyebrows (11px / 600 / +0.08em uppercase, ink-faint) to label groups —
  Today's Queue, Library, Prerequisites, Previous/Next.
- Keep tap targets ≥ 40px on anything reachable by thumb.
- Let tables and code scroll inside their own container on mobile.

## Don't

- Don't reintroduce saturated gradient tiles or any surface above ~13% chroma.
- Don't use pure white text or pure black surfaces.
- Don't tighten tracking below -0.02em at any size.
- Don't hardcode hex values in components — use the semantic tokens
  (`bg-card`, `text-muted-foreground`, `text-brand`, `text-ink-faint`, …).
