# FAANG Study App — Changelog

All significant changes since initial app setup.

---

## 1. Static Export Config

**Files changed:** `next.config.ts`, `src/app/layout.tsx`

- Added `output: 'export'` to Next.js config — enables static HTML export to `out/`
- Added `suppressHydrationWarning` on `<html>` element (required for next-themes with static export)
- Verified clean: all `[slug]` pages have `generateStaticParams()`, no API routes, no middleware, no `next/image`

---

## 2. Knowledge Graph Viz

**Files created:** `src/app/graph/page.tsx`, `src/components/graph/GraphCanvas.tsx`, `src/components/graph/TopicNode.tsx`
**Files modified:** `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileNav.tsx`

- New `/graph` route with interactive React Flow canvas using `@xyflow/react` (already installed)
- 432 topics rendered as category-colored nodes (5 categories: SD=blue, DS&A=green, DDIA=purple, CS=gray, Behavioral=orange)
- ~900 edges showing prerequisite (solid) and related (dashed) relationships
- Category filter toggle buttons to show/hide categories
- MiniMap + Controls for navigation
- Click any node → navigates to that topic's page
- Grid layout by category with difficulty-based ordering within each category

---

## 3. DDIA References Enrichment

**Files modified:** `scripts/adapters/ddia.ts`

- DDIA adapter now clones `ept/ddia-references` repo during ingest
- Parses 12 `chapter-XX-refs.md` files with bibliographic citations
- Chapter-level pages (`ddia-ch1`–`ddia-ch12`): full reference appendix (e.g., Ch.1 has 34 entries, Ch.12 has 114 entries)
- Section-level pages: "See Ch. X References" link with absolute path to chapter page
- Falls back gracefully if clone fails

---

## 4. Progress Tracking Overhaul

**Files created:** `src/components/progress/ProgressToggles.tsx`
**Files modified:** `src/lib/content/types.ts`, `src/lib/progress/db.ts`, `src/lib/progress/queue.ts`, `src/components/topic/TopicPageContent.tsx`, `src/components/topic/TopicHeader.tsx`, `src/app/HomeClient.tsx`, `src/app/progress/page.tsx`
**Files deleted:** `src/components/progress/StatusBadge.tsx`

Replaced the old 5-state linear badge (`not-started → reading → understood → reviewed → mastered`) with 3 independent toggles:

| Toggle | What it means | Queue behavior |
|--------|---------------|----------------|
| **Read** | I consumed the content | Shows up as "study deeper" suggestion |
| **Studied** | Actively worked through it | Shows up as "next to practice" |
| **Practiced** | Solved problems, mock interview | Opens dialog for notes, schedules spaced review |

### New data model
```typescript
interface ProgressEntry {
  slug: string
  readAt: number | null
  studiedAt: number | null
  practicedAt: number | null
  practiceNotes: PracticeNote[]    // { text: string; timestamp: number }
  reviewCount: number
  nextReviewDue: number
}
```

### New db functions
- `markRead(slug)` — toggles read timestamp
- `markStudied(slug)` — toggles studied timestamp (also sets read if unset)
- `markPracticed(slug)` — toggles practiced, increments reviewCount, sets nextReviewDue
- `addPracticeNote(slug, text)` — adds a practice note with timestamp
- `removePracticeNote(slug, timestamp)` — deletes a specific note

### Practice notes
- Click ✅ Practiced → marks as practiced + opens dialog
- Dialog has textarea for LeetCode links, problem names, mock interview notes
- Notes appear inline below the toggles on the topic page
- Practice Log section on progress page shows all notes across topics

### Migration
Existing IndexedDB entries with old `status` field auto-migrate on read:
- `not-started` → all nulls
- `reading` → `readAt` set
- `understood/reviewed/mastered` → `readAt` + `studiedAt` set
- `reviewed/mastered` → `practicedAt` set too

---

## 5. Queue Fix

**Files modified:** `src/app/HomeClient.tsx`, `src/lib/progress/queue.ts`

### Bug found
`HomeClient.tsx` was calling `getDueTopics()` (only overdue items) when building the daily queue. The "3 most recently studied" logic in the queue was computed from this filtered set — meaning it was actually "3 most recently studied among OVERDUE items," not the user's actual recent activity.

### Fix
- Changed `getDueTopics()` → `getAllProgress()` in HomeClient
- Rebuilt queue logic for 3-toggle model:

| Queue priority | Condition |
|---------------|-----------|
| 1. Review | Practiced AND nextReviewDue <= now |
| 2. Practice | Studied but not practiced |
| 3. Study | Read but not studied |
| 4. New | Unread topics with prerequisites met |

- Sorted by difficulty within each bucket
- MaxItems increased from 3 → 5

---

## 6. Framer Dark Design System

**Files created:** `DESIGN.md` (installed from getdesign.md)
**Files modified:** `src/app/globals.css`, `src/components/layout/ThemeProvider.tsx`, `src/app/layout.tsx`, `src/app/settings/page.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/input.tsx`, `src/app/HomeClient.tsx`, `src/components/layout/CategoryPage.tsx`, `src/components/topic/TopicPageContent.tsx`, `src/components/topic/TopicHeader.tsx`, `src/components/layout/Sidebar.tsx`, `src/app/search/page.tsx`, `src/components/progress/ProgressToggles.tsx`, `src/app/progress/page.tsx`, `src/components/graph/GraphCanvas.tsx`

### Design tokens
| Token | Light mode | Dark mode |
|-------|-----------|-----------|
| Canvas | — | `#090909` (near-black) |
| Surface-1 | — | `#141414` |
| Surface-2 | — | `#1c1c1c` |
| Ink (primary) | — | `#ffffff` |
| Ink-muted | — | `#999999` |
| Accent blue | — | `#0099ff` |
| Hairline | — | `#262626` |

### Dark mode only
- `ThemeProvider` → `forcedTheme="dark"`
- `<html>` always has `class="dark"`
- Settings page theme toggle removed

### Buttons
- All buttons pill-shaped (`rounded-full`)
- White pills (default), charcoal pills (secondary), ghost text
- `active:scale-[0.97]` press animation
- `duration-200` transitions

### Animations
- **Page fade-in:** `.animate-fade-in` on every page wrapper
- **Card hover-lift:** `translate-y(-2px)` + shadow on hover
- **Button snappy press:** `scale-[0.97]` on click
- **Nav items:** `duration-200` background/color transitions on hover

### Spotlight cards (home page)
- System Design card → violet gradient (`#6a4cf5` → `#4a2cd5`)
- DS&A card → magenta gradient (`#d44df0` → `#b03ad0`)
- Hover glow overlay effect

---

## 7. Typography Fix — Reading Comfort

**Files modified:** `src/app/globals.css`, `src/components/topic/TopicPageContent.tsx`

| Before | After |
|--------|-------|
| 15px body, 1.3 line-height | 16px body, 1.55 line-height |
| -0.15px letter-spacing on body | 0 letter-spacing |
| -0.8px to -0.3px heading tracking | -0.3px to 0 heading tracking |
| Content edge-to-edge (768px) | Constrained to 680px (~65 chars/line) |

---

## 8. Collapsible Sidebar Tree

**Files created:** `src/lib/content/sections.ts`
**Files modified:** `src/components/layout/Sidebar.tsx`, `src/components/layout/CategoryPage.tsx`, `src/components/layout/MobileNav.tsx`

### Shared section definitions
Extracted `sectionsByCategory`, `categoryTitles`, `hiddenSlugs`, `utilitySlugs` from `CategoryPage.tsx` into shared `src/lib/content/sections.ts`. Both sidebar and category page import from this single source.

### Sidebar replaces flat links with expandable tree

**Before:** 12 flat links, no structural information
**After:**

```
Home
▼ System Design (83)
    Getting Started (2)
    Foundations (5)
    Infrastructure (7)
    Data Layer (15)
    Architecture (12)
    ...
  ▸ DDIA (12 chapters)
  ▸ DS&A (3 sections)
  ▸ CS Fundamentals
  ▸ Behavioral
  ─────────
  Graph  Search ⌘K  Progress  Settings
```

### Toggle behavior
- Only the category you're viewing is expanded — all others collapsed
- Click chevron (▸/▾) to manually expand/collapse
- Manual override persists across navigation within that category
- Auto-expands when navigating to a different category
- Section names clickable → navigate to category page with hash anchor (`/system-design#section-foundations`)

---

## 9. Command Palette (⌘K)

**Files created:** `src/components/search/CommandPalette.tsx`
**Files modified:** `src/components/ui/command.tsx`, `src/app/layout.tsx`

- `Cmd+K` / `Ctrl+K` opens from any page. `Esc` closes.
- All 432 topics searchable by title + tags via cmdk's built-in filtering
- Results grouped by category with icons
- Arrow keys navigate, Enter opens topic
- Shows reading time per result
- Fetches `/search-index.json` once on mount
- **Bug fix:** Wrapped children in `</Command><Command>` inside `CommandDialog` — cmdk requires this context for filtering to work

---

## 10. Section Anchor Navigation

**Files modified:** `src/lib/content/sections.ts`, `src/components/layout/CategoryPage.tsx`, `src/components/layout/Sidebar.tsx`

- Added `sectionId(label)` helper that generates kebab-case IDs from section labels
- Category page: each section `<div>` now has `id={sectionId(section.label)}`
- Sidebar: section links use `/${cat}#${sectionId(section.label)}` instead of deep-linking to first topic
- Clicking a section name in the sidebar navigates to the category page and scrolls to that section

---

## 11. Python Practice Section

**Files created:** `scripts/adapters/python-practice.ts`
**Files modified:** `scripts/ingest.ts`, `src/lib/content/sections.ts`

Hardcoded adapter (no repo clone needed) generating 9 Python syntax refresher topics, placed between Cheatsheets and Problem Lists in DS&A:

| # | Topic | Matched LeetCode Problems | How |
|---|-------|--------------------------|-----|
| 1 | Loops & Conditions | 2798, 2652, 3024, 1822 | `for`/`while`, `if`/`elif`, `range()`, `%` |
| 2 | Lists & Comprehensions | 2942, 2114, 1672 | `[x for x in list if cond]`, `sum()`, `max()` |
| 3 | String Operations | 709, 2108, 3019 | `.lower()`, `[::-1]`, `zip()`, `.split()` |
| 4 | Sets & Predicates | 1832, 657, 1550 | `set()`, `any()`, `all()`, list slicing |
| 5 | Dictionaries & Counting | 387, 3232 | `dict`, `collections.Counter`, `.get()` |
| 6 | Digit Manipulation | 1281, 258, 2520, 2535 | `%` and `//`, digit extraction loops |
| 7 | Sorting & Built-ins | 977, 2974 | `sorted()`, `.sort()`, list swapping |
| 8 | Stacks | 682 | `list.append/.pop`, `isinstance()` |
| 9 | Bitwise & Math Tricks | 1486, 2894, 2769 | `^`, range formulas, sign math |

Each topic includes concept explanation, code examples, common pitfalls, and "Before you solve" syntax heads-ups for each referenced LeetCode problem.

Now lives as 3 difficulty sub-sections:
- **Python Practice — Easy** (9 topics, current)
- **Python Practice — Medium** (0 topics, placeholder)
- **Python Practice — Hard** (0 topics, placeholder)

---

## 12. LeetCode Hints Section

**Files created:** `scripts/adapters/leetcode-hints.ts`
**Files modified:** `scripts/ingest.ts`, `src/lib/content/sections.ts`

25 LeetCode Easy problems, each as an individual browsable topic with:
- Problem recap (1-2 sentences)
- Syntax heads-up with code examples
- "Before You Solve" step-by-step hints
- Direct LeetCode link (`https://leetcode.com/problems/{slug}/`)

Linked problems cover: loops, lists, strings, sets, dictionaries, digit manipulation, sorting, stacks, bitwise/math — all Python concepts from the Practice section.

Section placed between Python Practice and Problem Lists in DS&A:
```
hello-algo → Cheatsheets → Python Practice → LeetCode Hints → Problem Lists
```

---

## 13. Flashcards + Spaced Repetition

**Files created:** `src/app/flashcards/page.tsx`, `src/components/flashcards/CardDeck.tsx`, `src/lib/progress/flashcards.ts`
**Files modified:** `src/components/layout/Sidebar.tsx`, `src/components/layout/MobileNav.tsx`

### Card queue
SRS-ordered by priority:
1. Practiced topics due for review (scheduler)
2. Studied but not practiced
3. Read but not studied
4. New topics (capped at 5 per session)

### Card interaction
- Front: topic title as prompt
- Flip: tap or spacebar
- Back: tags, difficulty, reading time, "Open full topic" link, rating buttons
- Rate with 1-4 keys or click: Again (🔴), Hard (🟡), Good (🟢), Easy (🟢🌟)
- Rating feeds `nextReviewDue` with ease multipliers
- Progress saved to IndexedDB via `rateCard()` helper

### Keyboard shortcuts
| Key | Action |
|-----|--------|
| Space / Enter | Flip card |
| 1 | Rate Again |
| 2 | Rate Hard |
| 3 | Rate Good |
| 4 | Rate Easy |

### Session summary
After completing the queue: cards reviewed count, time spent, rating distribution, "Study Again" and "Back" buttons.

### Category selector
Landing page shows 5 categories. System Design is the default (83 topics with rich prose). Other categories selectable.

---

## 14. Progress Page Enhancements

**Files modified:** `src/app/progress/page.tsx`

Added to the existing progress page:

### Study heatmap
- GitHub-style contribution grid (12 months, 365 days)
- Each cell = one day, blue if study activity logged, dark gray if not
- Cells are 12px squares, compact layout
- Legend: Less — (gray) (light blue) (blue) (dark blue) — More

### Due forecast
- Bar chart showing how many topics come due for each of the next 7 days
- Vertical bars with count labels
- Labels: "Today", "Tom.", then day names or "Nd"

### Mastery by category
- One stacked horizontal bar per category
- Blue = read, amber = studied, emerald = practiced
- Counts below each bar
- Categories: System Design, DS&A, DDIA, CS Fundamentals, Behavioral

---

## 15. Pomodoro Timer

**Files created:** `src/components/pomodoro/PomodoroTimer.tsx`
**Files modified:** `src/app/layout.tsx`, `src/components/layout/Sidebar.tsx`

### Thin bottom bar
Fixed to viewport bottom, 36px tall, semi-transparent, appears on every page:

```
⬤ Work · ████████░░░░  18:34  Cycle 2/4    [▶/⏸] [⏭] [↺] [⚙]
```

| Element | Detail |
|---------|--------|
| ⬤ indicator | Blue dot = work, green = break |
| Progress bar | Thin horizontal bar (200px max, desktop only) |
| Timer | Monospace, dims when paused |
| Cycle | Shows 1/4–4/4 (auto-resets after long break) |
| Start/Pause | Contextual: shows "Start" initially, "Pause" when running, "Resume" when paused |
| Skip (⏭) | Jumps to next phase immediately |
| Reset (↺) | Resets current timer to beginning |
| Settings (⚙) | Opens config popover |

### Timer phases
- Work: 25 min (default)
- Short Break: 5 min (default)
- Long Break: 15 min (default) — after every 4 work cycles
- Auto-advances: work ends → bell chime → break starts (paused)
- Bell uses Web Audio API: 660Hz + 880Hz sine wave, no audio file needed

### Configurable durations
Settings popover (anchored above the bar):
```
Timer Settings
  Work          [25] min
  Short Break   [5]  min
  Long Break    [15] min
```
Each input validates 1-120 min. Changing a value resets the timer with the new duration. Stored in `localStorage` under `pomodoro-config`.

### Cross-tab sync with BroadcastChannel
- `new BroadcastChannel('pomodoro')` shares state across all tabs
- Start/pause/skip in one tab → all other tabs sync instantly
- Closing a tab doesn't affect the others
- `localStorage` fallback for page refresh recovery
- Periodic save every 3 seconds
- Clicks outside settings popover dismisses it

### Timeline for sidebar and content
- Sidebar: `pb-9` (36px) added so bottom items aren't hidden behind the bar
- Main content: `pb-9` added in layout.tsx

---

## 16. Build Statistics

| Metric | Before | After |
|--------|:------:|:-----:|
| Total topics | 432 | 466 |
| Total pages | 445 | 480 |
| Content categories | 5 | 5 |
| Python practice topics | 0 | 9 |
| LeetCode hint topics | 0 | 25 |
| Built routes | — | /flashcards, /graph |
| DS&A sections | 3 | 6 |
| Static export size | ~65MB | ~70MB |

---

## Files Index (Key Files Created/Modified)

### Root
- `DESIGN.md` — Framer design system spec (installed from getdesign.md)

### App pages
- `src/app/flashcards/page.tsx` — Flashcard study mode
- `src/app/graph/page.tsx` — Knowledge graph viz

### Components
- `src/components/flashcards/CardDeck.tsx` — Queue + card flip + ratings
- `src/components/graph/GraphCanvas.tsx` — React Flow canvas
- `src/components/graph/TopicNode.tsx` — Custom flow node
- `src/components/pomodoro/PomodoroTimer.tsx` — Timer bar + BroadcastChannel
- `src/components/progress/ProgressToggles.tsx` — Read/Studied/Practiced toggles
- `src/components/search/CommandPalette.tsx` — Cmd+K search

### Library
- `src/lib/content/sections.ts` — Shared section definitions
- `src/lib/progress/flashcards.ts` — Flashcard queue builder + SRS

### Scripts
- `scripts/adapters/python-practice.ts` — Python practice adapter
- `scripts/adapters/leetcode-hints.ts` — LeetCode hints adapter

### Content (generated)
- `src/content/dsa/python-practice-easy-*.mdx` — 9 Python practice topics
- `src/content/dsa/leetcode-hint-*.mdx` — 25 LeetCode hint topics
