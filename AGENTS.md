<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FAANG Study — Agent Guide

## Project overview

FAANG interview study app — library-first, light/dark, Next.js 16 App Router, Tailwind v4, shadcn/ui v4 (@base-ui/react), TypeScript strict. Content is ingested from open-source repos at build time by adapters in `scripts/adapters/`, producing MDX + JSON under `src/content/{category}/` (those files are gitignored — only adapters and ingest logic are in the repo). 472 topics across 5 categories (`system-design` 80, `dsa` 221, `ddia` 153, `behavioral` 11, `cs-fundamentals` 7). Static export — deployed to GitHub Pages via `.github/workflows/deploy.yml`. Progress data lives client-side in IndexedDB, with optional cross-device sync via private GitHub Gists.

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
1. CI runs `npm ci && npm run lint && npm test && npm run ingest && npm run build` — a lint error or failing test stops the deploy.
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
- Library-first UI: `/` and each category route render the same `Library` component (category rail, collapsible sections, filters, re-read panel)
- Re-reading schedule: "Mark as studied" puts a topic in the rotation; due topics appear on `/review`, in the library's Re-read panel and as the Review count in the nav
- Client-side search (cmdk → `CommandPalette`, ⌘K or the search button; `/search` page uses MiniSearch) over `public/search-index.json`
- Progress tracking in IndexedDB via `idb-keyval`
- Optional GitHub Gist sync (see "Sync" section below)
- Flashcards with four-way SRS rating
- Pomodoro timer as a top-bar pill with BroadcastChannel cross-tab sync
- Light/dark theme via `next-themes` (`defaultTheme="system"`, `.dark` class)
- Knowledge graph (`@xyflow/react`, `/graph`) — still built, but removed from navigation

### Key file map
| Path | Purpose |
|------|---------|
| `scripts/ingest.ts` | Orchestrator: clone → adapter → MDX/JSON → search + graph |
| `scripts/adapters/base.ts` | `SourceAdapter` interface |
| `scripts/adapters/*.ts` | One adapter per content source |
| `src/lib/content/types.ts` | Domain types (`TopicMeta`, `ProgressEntry`, `TopicGraph`, etc.) |
| `src/lib/content/sections.ts` | `SectionDef` arrays per category plus `groupTopics` / `orderedSlugs` — the single source of truth for grouping and reading order |
| `src/lib/content/library.ts` | Server-only: `getLibrary()` (slim, serialisable `LibraryData` for client pages), `findTopic(slug)` (cross-category lookup), `placeTopic()` (breadcrumb section + prev/next) |
| `src/lib/content/fs.ts` | Cached topic file readers (`readTopicMeta`, `readTopicMdx`, `getTopicFiles`) — use these rather than touching `fs` directly in pages |
| `src/lib/content/topics.ts` | `getAllTopics`, `buildTopicGraph` (server-side, reads from disk) |
| `src/lib/content/search.ts` | `createSearchIndex` (build-time; stores slug, title, category, difficulty, tags, estimatedReadingTime) |
| `src/lib/content/matchTopic.ts` | Word-based scoring used by the command palette |
| `src/lib/progress/db.ts` | IndexedDB progress mutations + stats/streak |
| `src/lib/progress/scheduler.ts` | SM-2 scheduling (`nextSchedule`, ease factor per topic) |
| `src/lib/progress/queue.ts` | `buildQueue` (daily/review modes, used by flashcards) + `isInRotation` |
| `src/lib/progress/status.ts` | `topicStatus`, `isDue`, `dueEntries`, `upcomingEntries`, review/late labels |
| `src/lib/progress/recall.ts` | The three topic-page answers (Fuzzy/Mostly/Solid → hard/good/easy) and interval previews |
| `src/lib/progress/streak.ts` | `streakFromDates` (pure; used by `getStudyStats`) |
| `src/lib/progress/events.ts` | `notifyProgressChanged` / `onProgressChanged` — fired by every db mutation and sync pull |
| `src/lib/progress/useProgress.ts` | Client hooks: `useProgress()` (all entries, live) and `useTopicIndex(data)` |
| `src/lib/progress/merge.ts` / `sync.ts` | CRDT-style entry merge; GitHub Gist push/pull + auto-sync |
| `src/lib/progress/backup.ts` | `parseBackup` (zod-validated JSON backup, same shape as `SyncPayload`) + `backupFileName`; import goes through `importProgress`, so it merges |
| `src/lib/useLocalStorage.ts` | `useLocalStorage` (hydration-safe localStorage state) and `useHydrated` |
| `src/components/library/*` | `Library`, `CategoryView`, `DuePanel`/`DueBanner`, `StatusIcon` |
| `src/components/review/ReviewList.tsx` | `/review` page body |
| `src/components/topic/TopicPageContent.tsx` | Topic page renderer, `supplementMap`, MDX body, breadcrumb, related topics, prev/next |
| `src/components/progress/ReviewPanel.tsx` | End-of-article action (mark studied / rate recall / in review) and header `ReviewStatus` pill; notes |
| `src/components/layout/TopBar.tsx` / `BottomTabs.tsx` / `nav.ts` | Desktop top bar, phone tab bar, shared nav items + due count |
| `src/components/layout/ThemeProvider.tsx` / `ThemeToggle.tsx` | next-themes setup and the top-bar light/dark toggle |
| `src/components/layout/SyncProvider.tsx` | Invisible `'use client'` component in `layout.tsx` — fires `autoPull` on mount and `flushPush` on visibilitychange |
| `src/components/flashcards/CardDeck.tsx` | Flashcard session UI + keyboard shortcuts |
| `src/components/pomodoro/PomodoroTimer.tsx` | Top-bar timer pill + panel |
| `src/components/search/CommandPalette.tsx` | Cmdk search overlay; `openSearch()` in `openSearch.ts` opens it from buttons |

### Routes
| Route | Type | Content |
|-------|------|---------|
| `/` | Static | Library, reopening the last category visited (`library:last-category` in localStorage; System Design by default) |
| `/system-design` | Static | Library for System Design: 9 sections (Getting Started … Interview Practice) |
| `/system-design/[slug]` | SSG | SD topic page |
| `/ddia` | Static | Library for DDIA: 12 chapter sections, each led by its chapter overview, then book order |
| `/ddia/[slug]` | SSG | DDIA chapter/section page |
| `/dsa` | Static | Library for DS&A: 10 sections — hello-algo, Advanced Algorithms, Cheatsheets, Python Practice E/M/H, LeetCode Hints, Problem Lists, NeetCode Roadmap (with a Blind 75 toggle), Object-Oriented Design |
| `/dsa/[slug]` | SSG | DS&A topic page |
| `/cs-fundamentals` | Static | Library for CS Fundamentals: "Coding Interview Prep" (7 topics) |
| `/cs-fundamentals/[slug]` | SSG | CS topic page |
| `/behavioral` | Static | Library for Behavioral: Interview Guides, Career & Negotiation (11 topics) |
| `/behavioral/[slug]` | SSG | Behavioral topic page |
| `/review` | Static | Topics due for re-reading (most overdue first) + what comes up this week |
| `/flashcards` | Static | Flashcard study mode with SRS — category selector then `CardDeck` |
| `/progress` | Static | Stats, recent activity, 365-day heatmap, by-category bars, 7-day due forecast |
| `/search` | Static | Client-side search page |
| `/settings` | Static | Appearance (System/Light/Dark), Sync (token, push/pull, auto-sync), Backup (export/import JSON), Clear data, content sources |
| `/graph` | Static | Knowledge graph — not linked from the UI |

Category and topic routes have a `loading.tsx`; category pages link sections as `/<category>#section-<id>` (the legacy `?section=` form still works).

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
  studiedAt: number | null          // last added to the re-reading rotation
  rotationRemovedAt: number | null  // tombstone; later than studiedAt means "not in rotation"
  practicedAt: number | null        // last recall rating
  practiceNotes: PracticeNote[]
  reviewCount: number
  nextReviewDue: number
  deletedNotes: number[]            // tombstones so removed notes stay removed after sync
  ease: number                      // SM-2, 1.3–2.5, per topic
  intervalDays: number
  reps: number
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

The single source of truth for how topics are grouped into sections and in what order they are read. Defines:

```typescript
interface SectionDef {
  label: string          // section heading text (also the #anchor via sectionId)
  description: string    // shown when the section is open
  slugPrefix?: string    // topics whose slug starts with this are grouped here
  slugs: string[]        // explicit members, in this order
  match?: (t) => boolean // metadata-based membership (Problem Lists, NeetCode, DDIA chapters)
  sort?: (a, b) => number              // order for prefix/match sections; default sortOrder, then title
  variant?: { label: string; match }   // alternative topic set the section can switch to (NeetCode → Blind 75)
}
```

- `groupTopics(category, topics)` → `{ sections, leftovers }`. A topic belongs to the **first** section that claims it. The library, `/review` lookups and topic-page breadcrumbs all use it. `leftovers` should be empty; anything unclaimed shows as "Other topics".
- `orderedSlugs(category, topics)` → prev/next reading order: section order (main list, then variant), chapter summaries and leftovers at the end.
- Also exported: `sectionId(label)`, `categoryOrder`, `categoryTitles` (long), `categoryShortTitles`, `categoryColor(category)` (`var(--cat-<category>)`), `utilitySlugs`, `hiddenSlugs`, `isListedTopic(slug)`.

Tests live in `sections.test.ts`. DS&A section order: `hello-algo` (prefix), `Advanced Algorithms` (explicit), `Cheatsheets` (prefix), `Python Practice — Easy/Medium/Hard` (explicit lists, em-dashes), `LeetCode Hints` (prefix), `Problem Lists` (topics with `leetcodePatterns`), `NeetCode Roadmap` (`neetcodeRoadmap`, not Blind 75, sorted by roadmap `order`; variant = the Blind 75 pages), `Object-Oriented Design` (prefix `donnemartin-oo-`).

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
| `ddia.ts` | Hardcoded TOC + references | 153 DDIA | No repo clone for TOC; additionally clones `ept/ddia-references` to populate per-section "References" sections. Emits `sortOrder` (chapter overview 0, sections 1…n in book order) |
| `hello-algo.ts` | krahets/hello-algo | 94 DS&A | Clone with `--depth 1 --filter=blob:none` + sparse checkout (repo is 465MB full). Parses `mkdocs.yml` nav + `docs/**/*.md`. Emits `sortOrder` per topic so chapters natural book order is preserved |
| `dsa-supplements.ts` | Hardcoded | 8 DS&A | No clone. 8 hand-written algorithm deep-dives: shortest paths (Dijkstra/Bellman-Ford/Floyd-Warshall), MST (Kruskal/Prim), fast-slow pointers, Kadane, sliding window template + 3 classic LeetCode problems. Escapes `<` to `&lt;` in `content()` |
| `seanprashad.ts` | seanprashad/leetcode-patterns | 48 DS&A | Clone repo, parse JSON patterns file |
| `neetcode.ts` | neetcode-gh/leetcode | 36 DS&A | Clone repo, parse JSON. 18 NeetCode 150 group pages + 18 `-blind75` pages. `neetcodeRoadmap.order` = roadmap position (upstream group order); `isBlind75` marks the Blind 75 page, which lists only Blind 75 problems |
| `yangshun.ts` | yangshun/tech-interview-handbook | 11 BH + 7 CS + cheatsheets | Clone repo, parse `sidebars.js` |
| `python-practice.ts` | Hardcoded | (_DS&A) | No clone. Python concept refresher topics with concept explanation + code examples + pitfalls + "Before you solve" links. Slugs: `python-practice-easy-*` / `python-practice-medium-*` / `python-practice-hard-*` |
| `leetcode-hints.ts` | Hardcoded | 25 DS&A | No clone. 25 LeetCode Easy problems, each with a LeetCode URL link, syntax heads-up, and step-by-step hints. Slugs: `leetcode-hint-*`. `content()` prepends the LeetCode link from a hardcoded slug map |

Adapters are registered in order in `scripts/ingest.ts`. Reading order comes from `sectionsByCategory` via `orderedSlugs` (see Content sections), so section order and each section's sort determine prev/next navigation.

### Quick Reference supplements on topic pages
`supplementMap` in `TopicPageContent.tsx` maps a primary topic slug → slugs (typically `donnemartin-*`) shown as a "Quick reference" card below the article. Slugs are resolved with `findTopic`, so unknown slugs are skipped rather than linked. Prerequisites and related topics are resolved the same way, which matters because DDIA relates to System Design topics in another category.

## Progress tracking

IndexedDB via `idb-keyval`, keys `progress:<slug>` plus `study-log` (an array of `Date.toDateString()` values, one per study day; source of the streak, exported with sync payloads).

The model is a **re-reading rotation**:
- **Mark as studied** (`markStudied`) adds a topic to the rotation; first re-read is due tomorrow.
- When due, the topic page asks "How much did you still remember?" with three answers — **Fuzzy / Mostly / Solid** → `rateReview(slug, 'hard' | 'good' | 'easy')`, which reschedules via SM-2. `again` is deliberately not offered on topic pages (it resets and re-shows in 10 minutes); flashcards keep all four.
- **Remove from review** tombstones rotation membership (`rotationRemovedAt`); history and notes are kept.
- Library status (`topicStatus`): `studied` = in rotation, `read` = has `readAt` but not in rotation (older entries, or removed from review), `new` = neither. Nothing in the UI calls `markRead` any more.

### Migration
`migrateEntry` in `db.ts` upgrades the legacy `status` shape and backfills v2 scheduling fields (`backfillSchedule`). No data loss.

### `db.ts` public API

| Function | Behavior |
|----------|---------|
| `getProgress(slug)` / `getAllProgress()` | Read through `migrateEntry` |
| `setProgress(slug, entry)` | Low-level write — no migration, no sync, no event; tests/low-level only |
| `markRead(slug)` | Idempotent `readAt` stamp (kept for compatibility; unused by the UI) |
| `markStudied(slug)` | Adds to rotation, due tomorrow; no-op if already in rotation |
| `removeFromRotation(slug)` | Tombstones rotation membership |
| `rateReview(slug, rating)` | SM-2 reschedule; joins the rotation if needed |
| `markPracticed(slug)` | `rateReview(slug, 'good')` |
| `addPracticeNote` / `removePracticeNote` | Notes; removal writes a tombstone so sync can't resurrect it |
| `getDueTopics()` | Entries in rotation with `nextReviewDue <= now` |
| `getStudyStats()` | Counts + streak (`streakFromDates`: consecutive days ending today or yesterday; 0 after a missed day) |

### Every mutation calls `autoPush()` and `notifyProgressChanged()`
`autoPush` is a no-op without a saved token. `notifyProgressChanged` lets mounted views (library, nav badge, review list, topic header) refresh. **If you add a mutation in `db.ts`, call both at the end.**

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
- Applying a pulled payload fires `notifyProgressChanged()`, so open views update without a reload.

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

## Due lists and queues

- **Topic pages, library, `/review`, nav badge**: `status.ts` — `isDue(entry, now)` = in rotation and `nextReviewDue <= now`; `dueEntries` sorts most overdue first so the list rotates; `upcomingEntries(progress, now, days)` feeds "Coming up this week".
- **Flashcards**: `buildQueue(topics, progress, { mode: 'review' })` in `queue.ts` returns every due topic. `daily` mode (reserves slots for unrotated and new material) is kept and tested but no longer rendered.
- **Scheduling**: `scheduler.ts` `nextSchedule(prev, rating, now)` — SM-2 with a per-topic ease factor (1.3–2.5). First success: 1 day (`easy` 4), second: 6 days, then interval × ease (`hard` ×1.2, `easy` ×ease×1.3). `again` resets reps and re-shows in 10 minutes. Because the first two steps are fixed, the three topic-page answers can preview the same date; the panel says so, since the answer still moves the ease factor.

### `CardDeck` component (`src/components/flashcards/CardDeck.tsx`)
- Keyboard: Space/Enter flips, 1–4 rates (again / hard / good / easy) via `rateReview`
- Session summary with rating counts

## Pomodoro timer (`src/components/pomodoro/PomodoroTimer.tsx`)

### Top-bar pill
Shows the remaining time; clicking opens a panel with phase, progress, Start/Pause/Resume, Skip, Reset and the three durations. Until hydration a static pill holds the space; `LiveTimer` then reads saved state directly (lazy `useState`) instead of correcting itself in an effect.

### Features
- Focus / Short break / Long break (configurable 1–120 minutes), 4 cycles
- `BroadcastChannel('pomodoro')` for cross-tab sync
- localStorage persistence (`pomodoro-state`, `pomodoro-config`)
- Web Audio bell generated in-browser

## Design system ("Quiet amber library" — see `DESIGN.md`)

Light and dark. Tokens live in `src/app/globals.css`: the light palette on `:root`, the dark one on `.dark`, mapped to Tailwind in `@theme inline`. **Use semantic tokens — never hardcode hex or Tailwind palette colours.** New colour? Add the token to both palettes first.

- Surfaces: `bg-background` (canvas), `bg-card` (panels, inputs), `bg-secondary` (hover/selected), `bg-accent` (pressed)
- Ink: `text-foreground`, `text-reading` (article body), `text-muted-foreground`, `text-ink-faint`
- Lines: `border-border`, `border-border-strong`
- Accent: `text-brand` / `bg-brand` + `text-brand-foreground` — links, focus, progress, due, primary action only
- Categories: `categoryColor(category)` or `bg-cat-<category>` — small dots, never tinted surfaces
- Semantic: `text-success`, `text-destructive`
- Type: Helvetica stack (`font-sans`), system mono (`font-mono`, tabular numbers for counts and timers); no web fonts
- Reading: `.topic-content` — 17px/1.75 at a 680px measure; code, tables and blockquotes all use tokens

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
10. **Library state** — collapsed sections (`library:open-sections`) and the last category (`library:last-category`) live in localStorage via `useLocalStorage`, which returns `null` during SSR/hydration. Don't read localStorage in `useState` initialisers of server-rendered components or set state from it in effects (lint: `react-hooks/set-state-in-effect`); use `useLocalStorage`, or gate a subtree on `useHydrated()` and read storage in lazy initialisers (see Settings and the Pomodoro timer).
11. **Loading states** — each category, topic and `/review` route has a `loading.tsx`. If you add a new route, copy the pattern; otherwise Next will synthesize a default one that doesn't match the design.
12. **`fs` usage at build time** — `topics.ts`, `fs.ts`, `library.ts`, `search.ts`, and `TopicPageContent.tsx` all call `node:fs` directly. They're safe in SSG because `next build` runs them as server code at build time. *Never* import these from a `'use client'` component — you'll see the `Module not found` ReferenceError on the client. Need data on the client? Pass `getLibrary()` from the server page (as the library routes do), or fetch `/topics-graph.json` / `/search-index.json`. The search index's documents are under `storedFields` (there is no `documents` key).
13. **`autoPush` cadence** — never call `autoPush()` or `notifyProgressChanged()` from a UI component directly. Always go through `db.ts` mutation functions, which call it at the end. Setting `progress:*` keys directly via `idb-keyval` bypasses sync and will not propagate to other devices.

14. **Stale dev styles or data** — the dev server caches compiled CSS in `.next/dev` and topic data in memory (`fs.ts`, `library.ts`). After `npm run ingest` or a git operation that swaps files under a running server, restart it; if styles are still old, stop it and delete `.next/dev`.
15. **Dev indicator** — Next's dev-mode "N" badge sits bottom-left, over the phone tab bar's Library tab. Production builds don't have it; `devIndicators: false` in `next.config.ts` would hide it in dev.

## Content gotchas

1. **hello-algo repo is 465MB** — `hello-algo.ts` clones with `--depth 1 --filter=blob:none` + sparse checkout. Don't "simplify" it to a full clone; CI ingest will run out of disk.
2. **donnemartin hidden theory topics** (`hiddenSlugs` in `sections.ts`) — 16 `donnemartin-{load-balancer,cache,...}` single-page theory topics excluded from category listings. They're not deleted — `supplementMap` wires them into Quick Reference cards on the relevant karan topic.
3. **donnemartin interview solutions** — 8 `donnemartin-{pastebin,twitter,web_crawler,...}` topics gathered under the "Interview Practice" section in system-design.
4. **donnemartin OO design** — 6 `donnemartin-oo-*` topics living in the DSA directory. They look like stray leftovers; they're intentional (OO design question practice).
5. **`utilitySlugs`** — `table-of-contents`, `references`, `next-steps` are filtered out of listings everywhere. Still reachable by URL but hidden from nav.
6. **DDIA references** — `ddia.ts` additionally clones `ept/ddia-references` during ingest to enrich each chapter with a "References" section.
7. **Python Practice and LeetCode Hints adapters** — hardcoded (no repo clone). Both have explicit content sections matching their slug prefix. When adding topics, update the adapter and the section in lockstep.
8. **`dsa-supplements.ts` is hardcoded** — 8 curated algorithm deep-dives. Topics live directly in the `Advanced Algorithms` section in `sections.ts` via an explicit `slugs` array (no prefix-based section).
9. **Section order is reading order** — `orderedSlugs` walks `sectionsByCategory` in order, then appends chapter summaries and leftovers. Reordering sections or changing a section's sort changes both the library and prev/next navigation.
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
| `npm test` | Vitest (`src/**/*.test.ts`) |
| `BASE_PATH=/study-practice-repo npm run build` | Local build matching the deployed URL prefix |
| `npx getdesign@latest add <name>` | Install a DESIGN.md (from getdesign.md) |