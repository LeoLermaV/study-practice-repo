<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FAANG Study — Agent Guide

## Project overview

FAANG interview study app — Next.js 16 App Router, Tailwind v4, shadcn/ui v4 (@base-ui/react), TypeScript strict. Content is ingested from open-source repos at build time by adapters in `scripts/adapters/`, producing MDX + JSON under `src/content/{category}/` (those files are gitignored — only adapters and ingest logic are in the repo). 472 topics across 5 categories (`system-design` 80, `dsa` 221, `ddia` 153, `behavioral` 11, `cs-fundamentals` 7). Static export — deployed to GitHub Pages via `.github/workflows/deploy.yml`. Progress data lives client-side in IndexedDB, with optional cross-device sync via private GitHub Gists.

`README.md`, `CLAUDE.md`, `PLAN.md`, `HANDOVER.md`, and `DESIGN.md` are companion docs that overlap with this file for different audiences — this one is the canonical agent reference. When they disagree, trust the code (and this file).

## Quick start

```bash
npm run ingest    # Clone/pull repos, run adapters, write MDX + JSON + search-index.json + topics-graph.json
npm run dev       # Development server at localhost:3000
npm run build     # Static export to out/
npm run lint      # ESLint (eslint-config-next, flat config in eslint.config.mjs)
```

**Order is important:** `npm run ingest` writes `src/content/` and `public/*.json`. That directory is gitignored and does not exist after a fresh clone — `dev` and `build` will fail until you run `ingest` first.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml`:
1. CI runs `npm ci && npm run ingest && npm run build`.
2. `BASE_PATH=/study-practice-repo` is set as an env var in the workflow → consumed by `next.config.ts` (`basePath: process.env.BASE_PATH ?? ""`).
3. The `out/` directory is uploaded as a Pages artifact and deployed.
4. Live site: https://leolermav.github.io/study-practice-repo/

For local builds with the same `basePath`, run `BASE_PATH=/study-practice-repo npm run build`. The default empty `basePath` is what you want for normal local dev.

## Architecture

### Build time
1. `scripts/ingest.ts` orchestrates — instantiates each adapter, clones/pulls its repo (if `cloneUrl` is set), calls `topics()` and `content(slug)`, and writes `<slug>.mdx` + `<slug>.json` per topic into `src/content/{category}/`. Brace and `<` escaping is done here (`scripts/ingest.ts:42`).
2. After all adapters run, `createSearchIndex(topics)` writes `public/search-index.json` and `buildTopicGraph()` writes `public/topics-graph.json`.
3. `next build` pre-renders every page as static HTML into `out/`.

### Runtime (browser only — there is no server)
- Static HTML pages pre-rendered at build time
- Client-side search (cmdk → CommandPalette + MiniSearch over `public/search-index.json`)
- Progress tracking in IndexedDB via `idb-keyval`
- Optional GitHub Gist sync (see "Sync" section below)
- Spaced-repetition daily queue on the home page
- Flashcards with SRS rating
- Pomodoro timer with BroadcastChannel cross-tab sync
- Knowledge graph (`@xyflow/react`) consuming `public/topics-graph.json`

### Key file map
| Path | Purpose |
|------|---------|
| `scripts/ingest.ts` | Orchestrator: clone → adapter → MDX/JSON → search + graph |
| `scripts/adapters/base.ts` | `SourceAdapter` interface |
| `scripts/adapters/*.ts` | One adapter per content source |
| `src/lib/content/types.ts` | Domain types (`TopicMeta`, `ProgressEntry`, `TopicGraph`, etc.) |
| `src/lib/content/sections.ts` | `SectionDef` arrays per category — the single source of truth for grouping |
| `src/lib/content/fs.ts` | Cached topic file readers (`readTopicMeta`, `readTopicMdx`, `getTopicFiles`) — use these rather than touching `fs` directly in pages |
| `src/lib/content/topics.ts` | `getAllTopics`, `buildTopicGraph` (server-side, reads from disk) |
| `src/lib/content/search.ts` | `createSearchIndex` (build-time) + client search helpers |
| `src/lib/progress/db.ts` | IndexedDB progress mutations + stats/streak calc |
| `src/lib/progress/queue.ts` | `buildDailyQueue` (home page) |
| `src/lib/progress/flashcards.ts` | `buildFlashcardQueue` + `nextReviewDue` |
| `src/lib/progress/merge.ts` | CRDT-style entry merge for sync |
| `src/lib/progress/sync.ts` | GitHub Gist push/pull + auto-sync orchestration |
| `src/components/topic/TopicPageContent.tsx` | Topic page renderer, `supplementMap`, MDX body, prev/next nav, Quick Reference |
| `src/components/layout/CategoryPage.tsx` | Sectioned category listing (used by all 5 category pages) |
| `src/components/layout/Sidebar.tsx` / `MobileNav.tsx` | Desktop sidebar + mobile Sheet nav; both feed off `sectionsByCategory` |
| `src/components/layout/SyncProvider.tsx` | Invisible `'use client'` component in `layout.tsx` — fires `autoPull` on mount and `flushPush` on visibilitychange |
| `src/components/layout/BrandMark.tsx` | SVG logo mark used in sidebar and home header |
| `src/components/flashcards/CardDeck.tsx` | Flashcard session UI + keyboard shortcuts |
| `src/components/pomodoro/PomodoroTimer.tsx` | Fixed bottom-bar timer |
| `src/components/search/CommandPalette.tsx` | Cmdk search overlay |
| `src/components/progress/ProgressToggles.tsx` | Read / Studied / Practiced buttons on topic pages |

### Routes
| Route | Type | Content |
|-------|------|---------|
| `/` | Static | Home — stat cards, daily queue, category cards (`tint-*` washes) |
| `/system-design` | Static | 9 sections: Getting Started, Foundations, Infrastructure, Data Layer, Architecture, Advanced Infrastructure, Security, Case Studies, Interview Practice (59 karan topics + 8 donnemartin solutions + 16 hidden theory) |
| `/system-design/[slug]` | SSG | SD topic page |
| `/ddia` | Static | 12 chapter sections, 153 topics |
| `/ddia/[slug]` | SSG | DDIA chapter/section page |
| `/dsa` | Static | 8 sections: hello-algo, Advanced Algorithms, Cheatsheets, Python Practice E/M/H, LeetCode Hints, Problem Lists |
| `/dsa/[slug]` | SSG | DS&A topic page |
| `/cs-fundamentals` | Static | Single section: "Coding Interview Prep" (7 topics) |
| `/cs-fundamentals/[slug]` | SSG | CS topic page |
| `/behavioral` | Static | 2 sections: Interview Guides, Career & Negotiation (11 topics) |
| `/behavioral/[slug]` | SSG | Behavioral topic page |
| `/flashcards` | Static | Flashcard study mode with SRS — category selector then `CardDeck` |
| `/graph` | Static | Knowledge graph viz (`@xyflow/react`) |
| `/search` | Static | Client-side search |
| `/progress` | Static | Stats dashboard + 365-day heatmap + by-category breakdown + recent activity list with stage filter |
| `/settings` | Static | Sync (token, push/pull, auto-sync toggle) + Clear Data + content info |

Every category route (and every `[slug]`) also has a `loading.tsx` for streaming/suspense and no fallback page is needed since the topic pages are pre-rendered at build time.

## Key data types (`src/lib/content/types.ts`)

```typescript
type Category = 'system-design' | 'dsa' | 'cs-fundamentals' | 'behavioral' | 'ddia'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface TopicMeta {
  slug: string
  title: string
  category: Category
  difficulty: Difficulty
  estimatedReadingTime: number
  tags: string[]
  prerequisites: string[]
  relatedTopics: string[]
  sourceRepos: string[]
  sortOrder?: number              // hello-algo topics carry this for book-progression ordering
  neetcodeRoadmap?: { group: string; order: number; isBlind75: boolean }
  leetcodePatterns?: { patterns: string[]; companies: { name: string; frequency: number }[] }
}

interface TopicGraphEdge { source: string; target: string; type: 'prerequisite' | 'related' }
interface TopicGraph { nodes: TopicMeta[]; edges: TopicGraphEdge[] }

interface PracticeNote { text: string; timestamp: number }

interface ProgressEntry {
  slug: string
  readAt: number | null
  studiedAt: number | null
  practicedAt: number | null
  practiceNotes: PracticeNote[]
  reviewCount: number
  nextReviewDue: number
  deletedNotes: number[]         // tombstones for notes removed via removePracticeNote — keeps merge idempotent
}

interface StudyStats {
  currentStreak: number
  longestStreak: number             // currently mirrors currentStreak (single calc)
  totalRead: number
  totalStudied: number
  totalPracticed: number
  topicsDueForReview: number
  recentlyStudied: { slug: string; lastTouched: number }[]
}
```

## Content sections (`src/lib/content/sections.ts`)

The single source of truth for how topics are grouped into sections on category pages and in the sidebar. Defines:

```typescript
interface SectionDef {
  label: string          // chapter/section heading text
  description: string    // shown on the category page
  icon?: string          // lucide icon name
  slugPrefix?: string    // topics whose slug starts with this are grouped here
  slugs: string[]        // explicit slug list when slugPrefix is not used
}
```

Helpers exported from the same file:
- `sectionId(label)` — deterministic id for `?section=` URL fragments
- `categoryTitles` — display name per category (used on topic pages' back-link and elsewhere)
- `utilitySlugs` — `Set` of `'table-of-contents' | 'references' | 'next-steps'` filtered out of all listings
- `hiddenSlugs` — `Set` of 16 `donnemartin-*` theory topics excluded from category listings (still reachable via `supplementMap`)
- `sectionsByCategory` — the per-category `Record<string, SectionDef[]>` consumed by both sidebar and `CategoryPage`

DSA section drift to watch for: there are now 8 sections in this order — `hello-algo` (slugPrefix `hello-algo-`), `Advanced Algorithms` (explicit list of 8 dsa-supplements slugs), `Cheatsheets` (slugPrefix `cheatsheet-`), `Python Practice — Easy/Medium/Hard` (em-dashes, slugPrefix `python-practice-{easy,medium,hard}-`), `LeetCode Hints` (slugPrefix `leetcode-hint-`), `Problem Lists`.

## Adapters (`scripts/adapters/`)

Each adapter implements:

```typescript
interface SourceAdapter {
  name: string
  cloneUrl: string      // empty string for hardcoded adapters
  topics(): Promise<TopicMeta[]>
  content(slug: string): Promise<string>
}
```

| Adapter | Source | Topics | How it works |
|---------|--------|:------:|------|
| `karan.ts` | karanpratapsingh/system-design | 59 SD | Clone repo, parse README.md — headings split into topics |
| `donnemartin.ts` | donnemartin/system-design-primer | 30 SD | Clone repo, parse README + per-problem solution files. 16 hidden theory topics + 8 interview solutions + 6 OO design topics |
| `ddia.ts` | Hardcoded TOC + references | 153 DDIA | No repo clone for TOC; additionally clones `ept/ddia-references` to populate per-section "References" sections |
| `hello-algo.ts` | krahets/hello-algo | 94 DS&A | Clone with `--depth 1 --filter=blob:none` + sparse checkout (repo is 465MB full). Parses `mkdocs.yml` nav + `docs/**/*.md`. Emits `sortOrder` per topic so chapters natural book order is preserved |
| `dsa-supplements.ts` | Hardcoded | 8 DS&A | No clone. 8 hand-written algorithm deep-dives: shortest paths (Dijkstra/Bellman-Ford/Floyd-Warshall), MST (Kruskal/Prim), fast-slow pointers, Kadane, sliding window template + 3 classic LeetCode problems. Escapes `<` to `&lt;` in `content()` |
| `seanprashad.ts` | seanprashad/leetcode-patterns | 48 DS&A | Clone repo, parse JSON patterns file |
| `neetcode.ts` | neetcode-gh/leetcode | 36 DS&A | Clone repo, parse JSON — fits each topic with `neetcodeRoadmap` |
| `yangshun.ts` | yangshun/tech-interview-handbook | 11 BH + 7 CS + cheatsheets | Clone repo, parse `sidebars.js` |
| `python-practice.ts` | Hardcoded | (_DS&A) | No clone. Python concept refresher topics with concept explanation + code examples + pitfalls + "Before you solve" links. Slugs: `python-practice-easy-*` / `python-practice-medium-*` / `python-practice-hard-*` |
| `leetcode-hints.ts` | Hardcoded | 25 DS&A | No clone. 25 LeetCode Easy problems, each with a LeetCode URL link, syntax heads-up, and step-by-step hints. Slugs: `leetcode-hint-*`. `content()` prepends the LeetCode link from a hardcoded slug map |

Adapters are registered in order in `scripts/ingest.ts`. That order matters: `buildOrderedSlugs` in `TopicPageContent.tsx` walks `sectionsByCategory` to compute prev/next navigation — so the section/prefix orders above effectively determine the reading order across topics.

### Quick Reference supplements on topic pages
`supplementMap` in `TopicPageContent.tsx` (lines ~15-36) hashes a primary topic slug → array of slugs (typically `donnemartin-*`) to surface as a "Quick Reference" card below the main content. Recently also includes a `sliding-window` entry pointing into python-practice and the sliding-window template. Never edit `supplementMap` blindly — it relies on topics existing in the matching category directory.

## Progress tracking

IndexedDB via `idb-keyval`. Three *independent* toggles on every topic page — each has its own button (`ProgressToggles.tsx`):
- **Read** — consumed the content. Button: blue outline/filled.
- **Studied** — actively worked through it. Button: amber outline/filled.
- **Practiced** — solved problems. Button: emerald; opens a note dialog.

All keys are prefixed `progress:<slug>`. There is one extra non-progress key: `study-log` — an array of `new Date().toDateString()` strings updated by `logStudyDay()` every time any toggle fires; it's the source of truth for the streak. It is also exported with synced payloads (see Sync).

### Migration
`migrateEntry` in `db.ts` auto-upgrades entries with the legacy `status: 'not-started' | 'understood' | 'reviewed' | 'mastered'` shape. Forward-compatible: writes always stamp the new `readAt/studiedAt/practicedAt` and `deletedNotes: []` fields. No data loss.

### `db.ts` public API

| Function | Behavior |
|----------|---------|
| `getProgress(slug)` | Read one entry; runs `migrateEntry` on the raw value |
| `getAllProgress()` | Reads every `progress:*` key through the same migration |
| `setProgress(slug, entry)` | Low-level write — bypasses migration; only for tests/low-level callers |
| `markRead(slug)` | Idempotent — no-op if `readAt` already set. Also logs the study day |
| `markStudied(slug)` | Idempotent — no-op if `studiedAt` already set. Also logs the study day |
| `markPracticed(slug)` | Increments `reviewCount`; computes `nextReviewDue` via the `intervals = [1,3,7,14,30,60]` table. Also logs the study day |
| `addPracticeNote(slug, text)` | Appends a note at `Date.now()`; *also* bumps `reviewCount` and recomputes `nextReviewDue` (same as `markPracticed`) |
| `removePracticeNote(slug, timestamp)` | Removes the note AND appends its timestamp to `deletedNotes`. The tombstone is what stops the note from reappearing after a Gist pull (see Sync). Does not touch `reviewCount` |
| `getDueTopics()` | Returns entries with `nextReviewDue <= now && practicedAt !== null` |
| `getStudyStats()` | Aggregates counts; also computes streak via `study-log` |

### `autoPush()` is called by every mutation
`markRead`, `markStudied`, `markPracticed`, and `addPracticeNote` all call `autoPush()` from `sync.ts` at the end. That function is a no-op when no token is saved — so local-only users pay no network cost, and enabling sync requires zero migration. **If you add a new mutation in `db.ts`, remember to call `autoPush()` at the end.**

## Sync (`src/lib/progress/sync.ts` + `merge.ts`)

Optional cross-device progress sync via private GitHub Gists (the Settings page has the UI). The whole design is *local-first with a remote mirror* — no device ever has authority; everyone merges.

### Storage keys (localStorage, not IndexedDB)
- `gist-sync-token` — GitHub personal access token (only needs `gist` scope)
- `gist-sync-id` — gist id once created/discovered
- `gist-sync-last` — last successful sync timestamp
- `gist-sync-error` — last error message (Settings shows it in red)
- `gist-sync-auto` — `'true'` if auto-sync is enabled
Gist description is the literal string `'FAANG Study — progress sync'` and the file inside is `faang-study-progress.json`. `findExistingGist` paginates the user's gists, matches by description, and prefers the most recently updated gist that actually contains entries.

### Payload shape (`SyncPayload`)
```typescript
{ version: 1, updatedAt: number, entries: Record<slug, ProgressEntry>, studyLog: string[] }
```

### Merge semantics (`merge.ts`)
`mergeEntry(a, b)` is **commutative, associative, and idempotent** over normalized entries — so devices can push and pull in any order without losing data. Per-field rules:
- `readAt` / `studiedAt`: earliest (a "first seen" timestamp survives)
- `practicedAt`: latest — the device that practiced most recently wins, and its `nextReviewDue` goes with it
- `reviewCount`: `Math.max`
- `practiceNotes`: union by `timestamp` — same-timestamp collisions resolved by lexicographic comparison of `text` (so two devices can't disagree)
- `deletedNotes`: union of tombstones — then applied to the unioned notes (a tombstoned timestamp is gone even if another device pushed the note)
- `studyLog` (the streak log): `mergeStudyLog` is just array union

### Push flow (`pushProgress`)
Serialized via an `inFlight` promise chain so concurrent calls can't write a stale gist. Read-modify-write: pulls the current gist, merges the local payload on top via `mergePayload`, writes back. This is why a device that hasn't pulled yet still can't clobber remote state. Empty payloads are rejected with `'Nothing to sync — study some topics first'`.

### Auto-sync (`autoPush` + `autoPull`)
When both token and auto-sync are enabled:
- `SyncProvider` (in `layout.tsx`) calls `autoPull()` on mount → silently imports any remote changes.
- Each `db.ts` mutation calls `autoPush()` → debounced (2s) so a Read→Studied→Practiced click-through becomes one gist write.
- `visibilitychange === 'hidden'` flushes any pending debounced push so a tab close doesn't drop it.

### Sync public API (used by Settings)
| Export | Purpose |
|--------|---------|
| `getToken`, `setToken`, `clearToken` | Token lifecycle in localStorage |
| `getSyncStatus()` | `{ lastSync, lastError }` from localStorage keys |
| `isAutoSync()`, `setAutoSync(on)` | Toggle auto-sync |
| `pushProgress(token)` | Read-modify-write gist update |
| `pullProgress(token)` | Fetch gist payload (no apply) |
| `importProgress(payload)` | Apply a pulled payload to IndexedDB |
| `exportProgress()` | Snapshot IndexedDB into a `SyncPayload` |
| `autoPush()`, `autoPull()`, `flushPush()` | Internal hooks called by `db.ts` and `SyncProvider` |

## Queue logic (`src/lib/progress/queue.ts`)

`buildDailyQueue(topics, progress, maxItems=5)` returns `QueueItem[]` in priority order:

1. **Review** — `practicedAt !== null && nextReviewDue <= now && readAt !== null`
2. **Practice** — `practicedAt === null && studiedAt !== null`
3. **Study** — `practicedAt === null && studiedAt === null && readAt !== null`
4. **New** — Not yet in progress, AND (`prerequisites.length === 0` OR `prerequisites.some(p => completedSlugs.has(p))`), where `completedSlugs` = slugs with `readAt !== null`. Note this is **any** prerequisite read, not **all** — keep that in mind when loosening prerequisite gates.

Sorted by `difficulty` ascending within each bucket. New topics only backfill the remaining slots after Review/Practice/Study; then the whole queue is sliced to `maxItems` (default 5).

## Flashcard mode (`src/lib/progress/flashcards.ts`)

### Queue builder
`buildFlashcardQueue(topics, progress, maxNew=5)` — similar buckets (due / studied-not-practiced / read-only / fresh), but **does not** gate fresh topics by prerequisites. Fresh topics are sliced to `maxNew` before being appended.

### Rating → nextReviewDue
```typescript
function nextReviewDue(reviewCount, ease): number {
  intervals = [1, 3, 7, 14, 30, 60]             // days
  multipliers = { again: 0, hard: 0.5, good: 1, easy: 2 }
  base = intervals[min(reviewCount, intervals.length-1)]
  days = base * multipliers[ease]
  return Date.now() + max(days, ease === 'again' ? 0.01 : 0.5) * 86400000
}
```
The `Math.max` floor exists so `again` doesn't schedule a review for the same instant (which the queue would instantly re-surface) — it gets a ~14-minute grace instead. `hard` floors at 12 hours.

### `CardDeck` component (`src/components/flashcards/CardDeck.tsx`)
- Keyboard shortcuts: Space = flip, 1-4 = rate (again / hard / good / easy)
- Rating a card also calls `markRead` / `markStudied` / `markPracticed` — so the flashcard mode advances progress toggles, not just SRS scheduling
- Session summary at the end with rating distribution
- Category selector on the landing page; "back" returns to the selector

## Pomodoro timer (`src/components/pomodoro/PomodoroTimer.tsx`)

### Bottom bar
Fixed `bottom-0`, 36px, semi-transparent blur, across all pages (rendered in `layout.tsx`).

### Features
- Work / Short Break / Long Break (configurable 1-120 minutes)
- `BroadcastChannel('pomodoro')` for cross-tab sync — any tab can start/pause/skip and all tabs reflect it
- localStorage persistence + recovery on mount
- Web Audio API bell chime (no audio file) — generated in-browser
- Dashboard: phase indicator, progress bar, timer, cycle count, controls (play/pause, skip, reset)
- Settings: gear icon → flyout with three number inputs

### Config keys (localStorage)
- `pomodoro-state` — current timer state (phase, startTime, elapsedBeforePause, paused, cycle, duration)
- `pomodoro-config` — user preferences `{ work, shortBreak, longBreak }` minutes

## Design system ("Refined dark study" — see `DESIGN.md`)

Dark-only. Graphite ramp (never pure black), softened ink (never pure white), one accent (`#0099ff`). **Use semantic tokens — never hardcode hex.** When you need a new surface or text role, add it to `globals.css` as a token, then reference it via Tailwind's `--color-*` mapping.

### Colors (dark only — no light mode)
```
--background: #0e0f13        // canvas (graphite, faint cool cast)
--card: #15171c              // surface-1 (cards, inputs)
--secondary/--muted: #1d2026 // surface-2 (hover fills, badges)
--accent: #23262e            // surface-3 (pressed/active)
--sidebar: #0b0c0f           // shell (sidebar, pomodoro bar) — below canvas
--foreground: #e7e9ee        // ink (headings, UI)
--reading-foreground: #cdd1d9 // long-form body ink (.topic-content)
--muted-foreground: #9aa1ad  // ink-muted
--ink-faint: #646b78         // meta, eyebrows, counts (text-ink-faint)
--border: #262a32            // hairline (cards use border-border/60)
--brand: #0099ff             // links, focus, progress (text-brand, bg-brand/10)
--brand-soft: #58b6ff        // links inside .topic-content
--chart-1..5                 // #0099ff #8b84f5 #c77df0 #eb9a5f #ef7189 (category hues — used by tint-* and progress chips)
```

### Surfaces & depth
- All Cards: hairline `border-border/60` + inset top-light, `rounded-xl` (14px). Cards settle on `--card`, not `--background`.
- Category identity: `.tint-blue / .tint-violet / .tint-magenta / .tint-orange / .tint-coral` — faint radial wash of the category hue over `--card`. `.spotlight-*` names still alias to these.
- List-row hover: `hover:bg-secondary/50 hover:border-border` (no translate)
- Category card hover: `hover-lift` (translateY(-1px) + soft shadow)

### Sidebar
Sidebar uses its own token family (`bg-sidebar`, `border-sidebar-border`, `bg-sidebar-accent`) so it can sit one step darker than the main canvas (`--sidebar: #0b0c0f`) while still using Tailwind's palette utility classes (`--color-sidebar-*` are wired in `@theme inline` in `globals.css`). Don't use `bg-secondary` etc. in the sidebar — use the `sidebar-*` equivalents.

### Typography
```css
body { font-size: 16px; line-height: 1.6; font-feature-settings: "cv05","cv11"; }
/* page titles: 26-28px / 600 / -0.02em; section heads 17px / 600 / -0.01em */
/* eyebrows: 11px / 600 / uppercase / +0.08-0.1em / text-ink-faint */
/* .topic-content (MDX reading): 17px / 1.75, 680px measure, tables scroll
   in place (display:block; overflow-x:auto), code blocks #101216 @ 13px */
```

### Animations
- `.animate-fade-in` — 350ms ease-out fade + slide
- `.animate-scale-in` — 180ms ease-out scale
- `.hover-lift` — translateY(-1px) + soft shadow (category cards only)
- Button `active:scale-[0.97]` press effect

## Framework gotchas

1. **`params` is a Promise in Next.js 16** — every `[slug]/page.tsx` must `await params` (you cannot destructure it directly).
2. **shadcn/ui v4 uses `@base-ui/react`** — no `asChild`; use the `render` prop instead. Radix patterns you're used to won't compile.
3. **`remark-gfm` is required for tables** in MDX compilation. Tables without it silently render as paragraphs.
4. **No `@tailwindcss/typography`** — typography is hand-rolled in the `.topic-content` CSS class. Add prose-related styles there, not as a new plugin.
5. **Brace escaping** — `{` and `}` in MDX body must be escaped as `\{` / `\}`. This is done centrally in `scripts/ingest.ts:42` using a `(?<!\\)` lookbehind, so adapters should write raw braces.
6. **`<` escaping** — `<` in MDX body must be `&lt;`. The generic ingest step does not do this — it's per-adapter where needed (`dsa-supplements.ts` escapes in `content()`; `hello-algo.ts` escapes during parsing). When you add a new adapter, check whether your raw body contains `<` and add the escape yourself.
7. **`BroadcastChannel`** — browser-only Web API. Always use it inside `useEffect` / a `'use client'` component. Don't import it at module scope.
8. **All `[slug]` pages have `generateStaticParams()`** — required because `next.config.ts` sets `output: 'export'`. If you add a new `[slug]` route, `generateStaticParams` returning an empty array is fine but it must exist.
9. **Topic page content max-width**: 680px for optimal reading line length — don't widen this.
10. **Sidebar tree** auto-expands the current category; manual override via the chevron button. The same `sectionsByCategory` array feeds both Sidebar and `CategoryPage` — when you reorder there, both views move.
11. **Loading states** — each route has a `loading.tsx`. If you add a new route, copy the pattern; otherwise Next will synthesize a default one that doesn't match the design.
12. **`fs` usage at build time** — `topics.ts`, `fs.ts`, `search.ts`, and `TopicPageContent.tsx` all call `node:fs` directly. They're safe in SSG because `next build` runs them as server code at build time. *Never* import these from a `'use client'` component — you'll see the `Module not found` ReferenceError on the client. Need data on the client? Fetch `/topics-graph.json` or `/search-index.json` instead.
13. **`autoPush` cadence** — never call `autoPush()` from a UI component directly. Always go through `db.ts` mutation functions, which call it at the end. Setting `progress:*` keys directly via `idb-keyval` bypasses sync and will not propagate to other devices.

## Content gotchas

1. **hello-algo repo is 465MB** — `hello-algo.ts` clones with `--depth 1 --filter=blob:none` + sparse checkout. Don't "simplify" it to a full clone; CI ingest will run out of disk.
2. **donnemartin hidden theory topics** (`hiddenSlugs` in `sections.ts`) — 16 `donnemartin-{load-balancer,cache,...}` single-page theory topics excluded from category listings. They're not deleted — `supplementMap` wires them into Quick Reference cards on the relevant karan topic.
3. **donnemartin interview solutions** — 8 `donnemartin-{pastebin,twitter,web_crawler,...}` topics gathered under the "Interview Practice" section in system-design.
4. **donnemartin OO design** — 6 `donnemartin-oo-*` topics living in the DSA directory. They look like stray leftovers; they're intentional (OO design question practice).
5. **`utilitySlugs`** — `table-of-contents`, `references`, `next-steps` are filtered out of listings everywhere. Still reachable by URL but hidden from nav.
6. **DDIA references** — `ddia.ts` additionally clones `ept/ddia-references` during ingest to enrich each chapter with a "References" section.
7. **Python Practice and LeetCode Hints adapters** — hardcoded (no repo clone). Both have explicit content sections matching their slug prefix. When adding topics, update the adapter and the section in lockstep.
8. **`dsa-supplements.ts` is hardcoded** — 8 curated algorithm deep-dives. Topics live directly in the `Advanced Algorithms` section in `sections.ts` via an explicit `slugs` array (no prefix-based section).
9. **Ingest ordering matters** — `buildOrderedSlugs` in `TopicPageContent.tsx` walks `sectionsByCategory` in order, then falls back to leftover files alphabetically. Reordering sections or prefix expansion changes both the sidebar and the prev/next navigation on topic pages.
10. **`sourceRepos` is stripped from JSON** — `ingest.ts:47` deletes `sourceRepos` before writing the sidecar `<slug>.json` (information-density; the frontmatter in the `.mdx` keeps it).
11. **Content directory is gitignored** — after `npm run ingest`, `src/content/` and `public/search-index.json` + `public/topics-graph.json` exist locally; they're not committed. A fresh clone has none of them. Don't commit a `.mdx` meant to be ingested — add an adapter.

## Remaining priorities

| Priority | Feature | Notes |
|:--------:|---------|-------|
| Low | Socratic tutor | Cloudflare Worker + Gemini/LLM. No scaffolding yet — see `PLAN.md` if it's mentioned there. |
| Ongoing | Content refinement | `sortOrder`, related-topic "adjacent peers" heuristic, difficulty metadata, and SLA/SD ordering have all been iterated recently — expect more data-quality passes to come. |

The git log should be the authoritative source for "what was just done". Cross-reference `PLAN.md` / `HANDOVER.md` before picking up work.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server (must run `ingest` first) |
| `npm run build` | Static export into `out/` (must run `ingest` first) |
| `npm run ingest` | Pull repos + generate `src/content/`, `public/search-index.json`, `public/topics-graph.json` |
| `npm run lint` | ESLint via `eslint-config-next` (flat config in `eslint.config.mjs`) |
| `BASE_PATH=/study-practice-repo npm run build` | Local build matching the deployed URL prefix |
| `npx getdesign@latest add <name>` | Install a DESIGN.md (from getdesign.md) |