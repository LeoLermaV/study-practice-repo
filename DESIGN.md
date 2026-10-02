---
version: 2.0
name: Quiet-amber-library
description: "A minimal, library-first study app in light and dark. Quiet neutrals with a faint cool cast, Helvetica throughout, and one amber accent reserved for links, focus, progress and anything due. Categories are told apart by a small coloured dot, never by tinted surfaces. Reading typography is tuned mobile-first: 17px/1.75 body at a 680px measure."
colors:
  light:
    canvas: "#f9f9fb"
    surface: "#ffffff"
    sunken: "#f1f1f5"
    pressed: "#e9e9ef"
    hairline: "#e6e6ec"
    hairline-strong: "#d3d3dc"
    ink: "#16161c"
    ink-reading: "#3a3a44"
    ink-muted: "#6f6f7b"
    ink-faint: "#93939e"
    brand: "#b85c12"
    brand-foreground: "#ffffff"
    success: "#1f8a5b"
    destructive: "#d23b3b"
  dark:
    canvas: "#0f0f12"
    surface: "#16161b"
    sunken: "#1c1c22"
    pressed: "#24242b"
    hairline: "#26262e"
    hairline-strong: "#34343e"
    ink: "#ececf1"
    ink-reading: "#c9c9d2"
    ink-muted: "#8e8e9a"
    ink-faint: "#66666f"
    brand: "#eea25c"
    brand-foreground: "#1a1206"
    success: "#4cc596"
    destructive: "#e5484d"
  categories:
    system-design: ["#3d7ce0", "#78a4f0"]
    dsa: ["#7c5cd6", "#a68cf0"]
    ddia: ["#c0507a", "#e088ad"]
    cs-fundamentals: ["#1f9488", "#5bc7ba"]
    behavioral: ["#6f8f2a", "#a9c45e"]

typography:
  family: '"Helvetica Neue", Helvetica, Arial, sans-serif'
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace'
  page-title:
    fontSize: 24-28px
    fontWeight: 600
    lineHeight: 1.15-1.2
    letterSpacing: -0.02em
  topic-title:
    fontSize: 28px mobile / 34px desktop
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.025em
  section-heading:
    fontSize: 15px
    fontWeight: 600
    letterSpacing: -0.01em
  label:
    fontSize: 13px
    fontWeight: 500
    color: ink-muted
  reading-body:
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.75
  ui-body:
    fontSize: 14-15px
    lineHeight: 1.5
  numbers:
    fontFamily: mono
    fontVariantNumeric: tabular-nums

rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
  pill: 100px
---

## Overview

The app is a **library first**: most sessions start by browsing a category and
opening a topic, and the second job is re-reading topics that have come due.
The design stays out of the way of both. It replaced a dark-only graphite
theme with a blue accent and gradient category cards.

**Key principles:**

- **Light and dark, following the system.** Light is the base palette on
  `:root`; `.dark` (set by next-themes from the OS setting, the top-bar toggle,
  or Settings → Appearance) swaps every token. Components only use tokens, so
  both themes come for free.
- **One accent, used for signal.** Amber marks links, focus, progress bars,
  "Due" states, the review count and the main action on a screen. It is never
  decoration. Dark mode uses a lighter amber with dark text on filled buttons.
- **Categories are dots.** Each category has one hue (`--cat-*`), shown as an
  8px dot in the rail, chips, lists and breadcrumbs. No tinted cards, no
  gradients.
- **Hairlines over cards.** Lists are rows separated by hairlines. A bordered
  card is reserved for the one element on a screen that needs to stand apart:
  the re-read panel, the recall panel, a settings group.
- **Helvetica, set tight at display sizes.** Titles run -0.02 to -0.025em;
  body text is untracked. Counts, minutes and timers use the system monospace
  with tabular figures so columns line up.
- **Status is a shape, not only a colour.** Library rows show an empty ring
  (not started), a half-filled ring (read) or a filled check (studied, i.e. in
  the re-reading rotation).

## Layout

- **Top bar** (sticky, blurred): wordmark, Library / Review / Flashcards /
  Progress, search (⌘K), focus timer pill, theme toggle, settings.
- **Phone**: the nav moves to a bottom tab bar (Library, Review with due
  count, Flashcards, Progress); search stays in the top bar.
- **Library** (`/` and each category route): category rail on the left
  (chips that wrap on phones), sections in the middle, "Re-read today" panel
  on the right from 1280px (a one-line banner below that).
- **Reading pages** hold a 680px measure; the recall panel sits at the end of
  the article, above related topics and previous/next.

## Reading surface (`.topic-content`)

- 17px / 1.75 body at a 680px max measure (~66ch)
- Paragraph spacing 1.25rem; h2 gets 2.75rem above / 0.875rem below
- Inline code: sunken chip with a matching hairline, 0.85em mono
- Code blocks: `--pre-bg` panel, 13px mono, 10px radius, scroll in place
- Blockquotes: 2px amber left rule, muted text, no fill
- Tables: `display:block; overflow-x:auto` so wide tables scroll in place
- Links: `--brand-soft` with a 35% underline that solidifies on hover

## Elevation

| Level | Token | Use |
|---|---|---|
| 0 | `--background` | Canvas, top bar and tab bar (blurred, 85–92%) |
| 1 | `--card` + hairline | Panels, inputs, active rail item |
| 2 | `--secondary` | Row hover, selected segment, note chips |
| 3 | `--accent` | Pressed fills, switch track |
| float | `--popover` + soft shadow | Timer panel, command palette, dialogs |

## Do

- Use semantic tokens (`bg-card`, `text-muted-foreground`, `text-brand`,
  `bg-cat-dsa`, `border-border-strong`, …). Add a token to `globals.css` in
  both palettes before using a new colour.
- Keep amber for signal: links, focus, progress, due, primary action.
- Keep tap targets ≥ 36px (≥ 44px for the main action on phones).
- Let tables and code scroll inside their own container on mobile.
- Check every screen in both themes and at 390px wide.

## Don't

- Don't reintroduce tinted or gradient category cards.
- Don't hardcode hex values or Tailwind palette colours (`emerald-500`, …) in
  components.
- Don't add a second accent colour; use a category dot or muted text instead.
- Don't load web fonts; the stack is Helvetica with system fallbacks.
