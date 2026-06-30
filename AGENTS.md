<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FAANG Study — Agent Guide

## Project overview

FAANG interview study app — Next.js 16 App Router, Tailwind v4, shadcn/ui v4 (@base-ui/react), TypeScript strict. Content is ingested from open-source repos at build time. 466 topics across 5 categories. Static export to S3 + Cloudflare CDN.

## Quick start

```bash
npm run ingest    # Clone repos, parse content, generate MDX files + search index
npm run dev       # Development server at localhost:3000
npm run build     # Static export to out/
```

## Architecture

### Build time (npm run ingest + npm run build)
1. `scripts/ingest.ts` — clones/pulls repos, runs adapters, emits MDX + JSON + search + graph
2. `next build` — pre-renders all pages as static HTML

### Runtime (browser)
- Static HTML pages (pre-rendered)
- Client-side search (cmdk + MiniSearch)
- Progress tracking (IndexedDB via idb-keyval)
- Spaced repetition daily queue
- Flashcards with SRS
- Pomodoro timer with BroadcastChannel sync

## Routes

| Route | Type | Content |
|-------|------|---------|
| `/` | Static | Home — daily queue, stats, category cards (spotlight gradients) |
| `/system-design` | Static | SD listing (9 sections, 59+16 topics) |
| `/system-design/[slug]` | SSG | SD topic page |
| `/ddia` | Static | DDIA chapter listing (12 chapters, 153 topics) |
| `/ddia/[slug]` | SSG | DDIA chapter/section page |
| `/dsa` | Static | DS&A listing (6 sections: hello-algo, Cheatsheets, Python Practice E/M/H, LeetCode Hints, Problem Lists) |
| `/dsa/[slug]` | SSG | DS&A topic page |
| `/cs-fundamentals` | Static | CS Fundamentals listing |
| `/cs-fundamentals/[slug]` | SSG | CS topic page |
| `/behavioral` | Static | Behavioral listing |
| `/behavioral/[slug]` | SSG | Behavioral topic page |
| `/flashcards` | Static | Flashcard study mode with SRS |
| `/graph` | Static | Knowledge graph viz (react-flow) |
| `/search` | Static | Client-side search |
| `/progress` | Static | Stats dashboard + heatmap + mastery |
| `/settings` | Static | Clear data + content info |

## Key data types (src/lib/content/types.ts)

```typescript
interface TopicMeta {
  slug: string
  title: string
  category: 'system-design' | 'dsa' | 'cs-fundamentals' | 'behavioral' | 'ddia'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedReadingTime: number
  tags: string[]
  prerequisites: string[]
  relatedTopics: string[]
  sourceRepos: string[]
  neetcodeRoadmap?: { group: string; order: number; isBlind75: boolean }
  leetcodePatterns?: { patterns: string[]; companies: { name: string; frequency: number }[] }
}

interface ProgressEntry {
  slug: string
  readAt: number | null
  studiedAt: number | null
  practicedAt: number | null
  practiceNotes: PracticeNote[]
  reviewCount: number
  nextReviewDue: number
}

interface StudyStats {
  currentStreak: number
  longestStreak: number
  totalRead: number
  totalStudied: number
  totalPracticed: number
  topicsDueForReview: number
  recentlyStudied: { slug: string; lastTouched: number }[]
}
```

## Content sections (src/lib/content/sections.ts)

Shared section definitions used by both sidebar and category pages. Defines:

```typescript
interface SectionDef {
  label: string
  description: string
  icon?: string   // lucide icon name
  slugPrefix?: string  // matches topics by slug prefix
  slugs: string[]      // explicit slug list
}
```

DS&A sections: hello-algo, Cheatsheets, Python Practice Easy/Medium/Hard, LeetCode Hints, Problem Lists.

## Adapters (scripts/adapters/)

Each adapter implements `SourceAdapter` interface:

```typescript
interface SourceAdapter {
  name: string
  cloneUrl: string
  topics(): Promise<TopicMeta[]>
  content(slug: string): Promise<string>
}
```

| Adapter | Source | Topics | Type |
|---------|--------|:------:|------|
| `karan.ts` | karanpratapsingh/system-design | 59 SD | Clone repo, parse README |
| `donnemartin.ts` | donnemartin/system-design-primer | 30 SD | Clone repo, parse README + solutions |
| `ddia.ts` | Hardcoded TOC + references | 153 DDIA | Hardcoded + clone ept/ddia-references |
| `hello-algo.ts` | krahets/hello-algo | 94 DS&A | Clone repo, parse mkdocs.yml + docs |
| `seanprashad.ts` | seanprashad/leetcode-patterns | 48 DS&A | Clone repo, parse JSON |
| `neetcode.ts` | neetcode-gh/leetcode | 36 DS&A | Clone repo, parse JSON |
| `yangshun.ts` | yangshun/tech-interview-handbook | 36 BH/CS/DS&A | Clone repo, parse sidebars.js |
| `python-practice.ts` | Hardcoded | 9 DS&A | No clone — hardcoded topics with hints |
| `leetcode-hints.ts` | Hardcoded | 25 DS&A | No clone — 25 LeetCode Easy problems |

### Python Practice adapter
Hardcoded adapter generating 9 Python concept refresher topics. Each topic has concept explanation, code examples, common pitfalls, and "Before you solve" problem references. Slugs: `python-practice-easy-*`.

### LeetCode Hints adapter
Hardcoded adapter generating 25 LeetCode Easy problem topics. Each problem has a LeetCode URL link, syntax heads-up, and step-by-step hints. Slugs: `leetcode-hint-*`. Content method prepends the LeetCode link from a hardcoded slug map.

## Progress tracking

3 independent toggles per topic page:
- **Read** — consumed the content. Button: blue outline/filled.
- **Studied** — actively worked through it. Button: amber outline/filled.
- **Practiced** — solved problems. Button: emerald, opens note dialog.

### db.ts functions
| Function | Purpose |
|----------|---------|
| `getProgress(slug)` | Read single progress entry (with migration) |
| `getAllProgress()` | Read all progress entries |
| `markRead(slug)` | Toggle read timestamp |
| `markStudied(slug)` | Toggle studied timestamp |
| `markPracticed(slug)` | Toggle practiced, increment reviewCount |
| `addPracticeNote(slug, text)` | Add practice note with timestamp |
| `removePracticeNote(slug, timestamp)` | Delete practice note |
| `getDueTopics()` | Topics due for review (practiced + overdue) |
| `getStudyStats()` | Aggregate stats + recently studied |

### Migration
Old entries with `status` field are auto-migrated on read. No data loss.

## Queue logic (queue.ts)

Daily queue shows 5 items max in priority order:
1. **Review** — practiced AND `nextReviewDue <= now` (spaced repetition)
2. **Practice** — studied but not practiced
3. **Study** — read but not studied
4. **New** — unread with prerequisites met

Sorted by difficulty within each bucket.

## Flashcard mode (flashcards.ts)

### Queue builder
`buildFlashcardQueue(topics, progress, maxNew=5)` — same priority as daily queue.

### Rating → nextReviewDue
```typescript
function nextReviewDue(reviewCount, ease): number {
  intervals: [1, 3, 7, 14, 30, 60] days
  multipliers: { again: 0, hard: 0.5, good: 1, easy: 2 }
  baseDays = intervals[reviewCount]
  return Date.now() + baseDays * multiplier[ease] * 86400000
}
```

### CardDeck component
- Keyboard shortcuts: Space=flip, 1-4=rate
- Session summary at end with rating distribution
- Category selector on landing page

## Pomodoro timer

### Bottom bar
Fixed `bottom-0`, 36px, semi-transparent blur, across all pages.

### Features
- Work / Short Break / Long Break (configurable 1-120 min)
- BroadcastChannel cross-tab sync
- localStorage persistence + recovery
- Web Audio API bell chime (no audio file)
- Dashboard: phase indicator, progress bar, timer, cycle count, controls
- Settings: gear icon → flyout with 3 number inputs

### Config keys (localStorage)
- `pomodoro-state` — current timer state
- `pomodoro-config` — user preferences

## Design system (inherited from Framer DESIGN.md)

### Colors (dark only — no light mode)
```
--background: #090909        // canvas (near-black)
--card: #141414              // surface-1
--muted: #1c1c1c             // surface-2
--foreground: #ffffff        // ink
--muted-foreground: #999999  // ink-muted
--border: #262626            // hairline
--ring: rgba(0,153,255,0.3)  // accent blue
--sidebar: #090909
--sidebar-border: #262626
--sidebar-accent: #1c1c1c
--sidebar-primary: #0099ff
```

### Animations
- `.animate-fade-in` — 300ms ease-out fade + slide
- `.animate-scale-in` — 200ms ease-out scale
- `.hover-lift` — translateY(-2px) + shadow on hover
- `.spotlight-violet` / `.spotlight-magenta` — gradient backgrounds
- Button `active:scale-[0.97]` press effect

### Typography
```css
body { font-size: 16px; line-height: 1.55; letter-spacing: 0; }
h1 { letter-spacing: -0.3px; }
h2 { letter-spacing: -0.15px; }
```

## Framework gotchas

1. **params is a Promise in Next.js 16** — all `[slug]/page.tsx` must `await params`
2. **shadcn/ui v4 uses @base-ui/react** — no `asChild`, use `render` prop instead
3. **remark-gfm required for tables** in MDX compilation
4. **No @tailwindcss/typography** — use `.topic-content` CSS class
5. **Brace escaping** — `{` and `}` in MDX body must be escaped as `\{` (done in ingest.ts)
6. **`<` escaping** — `<` in MDX body must be `&lt;` (done per adapter where needed)
7. **BroadcastChannel** — browser-only Web API, safe in `useEffect`/`'use client'`
8. **All [slug] pages** have `generateStaticParams()` — required for static export
9. **Topic page content max-width**: 680px for optimal reading line length
10. **Sidebar tree** auto-expands current category; manual toggle via chevron button

## Content gotchas

1. **hello-algo repo** is 465MB — use `--depth 1 --filter=blob:none` with sparse checkout
2. **donnemartin** generates utility topics (hiddenSlugs, 16) only accessible via Quick Reference supplements
3. **hididenSlugs** — 16 donnemartin theory topics excluded from category listing
4. **supplementMap** — hardcoded karan-slug → donnemartin-slug mapping in TopicPageContent.tsx
5. **utilitySlugs** — `table-of-contents`, `references`, `next-steps` filtered from all listings
6. **DDIA references** automatically clone `ept/ddia-references` during ingest
7. **Python Practice** and **LeetCode Hints** are hardcoded adapters (no repo clone)
8. **Ingest ordering** matters for prev/next nav (uses `sectionsByCategory` order, not alphabetical)

## Remaining priorities

| Priority | Feature | Effort | Notes |
|:--------:|---------|:------:|-------|
| Medium | S3 deploy script | 30 min | `aws s3 sync out/` + CloudFront invalidation |
| Low | Socratic tutor | 3-4 hrs | Cloudflare Worker + Gemini/LLM |

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build + static export |
| `npm run ingest` | Pull repos + generate MDX + search + graph |
| `npx getdesign@latest add <name>` | Install a DESIGN.md (from getdesign.md) |
