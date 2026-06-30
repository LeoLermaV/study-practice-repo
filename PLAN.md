# FAANG Study App — Build Plan

## What we're building

A personal web app for studying FAANG interviews. Content-first, local-first, minimal AI.
Self-hosted on S3 + Cloudflare, deployed as a static Next.js export.

Not a note-taking app. Not an AI chatbot. The value comes from curated content + great UX.

The app covers: **System Design, Data Structures & Algorithms, CS Fundamentals, Behavioral interviews**, and a **DDIA book study track**.

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Static export, SSG, file-based routing |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 + shadcn/ui v4 | Base UI primitives (@base-ui/react) |
| Content | MDX via next-mdx-remote v6 | Markdown-rendered topic pages |
| Search | MiniSearch | Client-side, prebuilt index at build time |
| Progress | IndexedDB via idb-keyval | Local-first, offline |
| Graph viz | @xyflow/react (react-flow) | Knowledge graph visualization |
| AI Tutor | Cloudflare Worker → Google AI Studio Gemini Flash | Socratic tutor, $0 (free tier) |
| Deploy | S3 + Cloudflare CDN | Static export, $0 |

---

## Content sources

| # | Repo | Stars | Category | What we get | Status |
|---|------|-------|----------|-------------|--------|
| 1 | karanpratapsingh/system-design | 44k | System Design | 59 topics, prose + images | ✅ Ingested |
| 2 | neetcode-gh/leetcode | 6.4k | DS&A | NeetCode 150 roadmap, problem lists | ✅ Ingested |
| 3 | seanprashad/leetcode-patterns | 13k | DS&A | 178 questions, difficulty, tags, companies | ✅ Ingested |
| 4 | — (DDIA TOC) | — | System Design | DDIA book structure, 12 chapters, ~150 sections | ✅ Generated |
| 5 | krahets/hello-algo | 127k | DS&A | 94 topics, book-quality prose + diagrams + code | ✅ [hello-algo.ts](scripts/adapters/hello-algo.ts) |
| 6 | yangshun/tech-interview-handbook | 140k | Behavioral + CS | 36 topics: behavioral guides + cheatsheets + career | ✅ [yangshun.ts](scripts/adapters/yangshun.ts) |
| 7 | donnemartin/system-design-primer | 353k | System Design | 30 topics: theory + solutions + OO design | ✅ [donnemartin.ts](scripts/adapters/donnemartin.ts) |
| 8 | djeada/Algorithms-And-Data-Structures | 469 | DS&A | Deep prose explanations | ⏳ Pending |
| 9 | ept/ddia-references | 7.1k | System Design | Paper references per DDIA chapter | ⏳ Pending |

---

## Architecture

```
Build time (npm run ingest + npm run build):
┌──────────────────────────────────────────────────────────┐
│  scripts/ingest.ts                                       │
│   1. Clone/pull source repos → .cache/repos/             │
│   2. Per-source adapters parse → TopicMeta[]             │
│   3. Emit MDX files → src/content/{category}/*.mdx       │
│   4. Emit metadata → src/content/{category}/*.json       │
│   5. Emit search-index.json + topics-graph.json → public/│
│                                                           │
│  next build → static HTML export                          │
│  → Upload to S3 → Cloudflare CDN                          │
└──────────────────────────────────────────────────────────┘

Runtime (browser):
┌──────────────────────────────────────────────────────────┐
│  Static pages (MDX → HTML, pre-rendered at build time)    │
│  Client-side search (MiniSearch, prebuilt index)          │
│  Progress tracking → IndexedDB (idb-keyval)               │
│  Daily queue → derived from IndexedDB + topic graph       │
│  Socratic tutor → Cloudflare Worker → Google AI Studio    │
└──────────────────────────────────────────────────────────┘
```

---

## Routes

| Route | Type | Content |
|-------|------|---------|
| `/` | Static | Home page with daily queue + stats + category cards |
| `/system-design` | Static | Category listing (59 SD topics + 153 DDIA topics) |
| `/system-design/[slug]` | SSG | Individual topic page |
| `/ddia` | Static | DDIA chapter listing (12 chapters) |
| `/ddia/[slug]` | SSG | DDIA chapter/section page |
| `/dsa` | Static | DS&A category listing (84 topics) |
| `/dsa/[slug]` | SSG | DS&A topic page |
| `/cs-fundamentals` | Static | CS Fundamentals listing |
| `/cs-fundamentals/[slug]` | SSG | CS Fundamentals topic page |
| `/behavioral` | Static | Behavioral listing |
| `/behavioral/[slug]` | SSG | Behavioral topic page |
| `/search` | Static | Search page (client-side MiniSearch) |
| `/progress` | Static | Progress stats + study breakdown |
| `/settings` | Static | Theme + data management |

---

## Content model

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
```

Each topic is stored as `src/content/{category}/{slug}.mdx` (YAML frontmatter + MDX body)
with a companion `{slug}.json` for fast metadata access at build time.

---

## What's built

### Content: 432 topics total across 5 categories

| Category | Count | Sources | Content quality |
|----------|:-----:|---------|----------------|
| System Design | 83 | karanpratapsingh (59) + donnemartin (24) | Solid prose + diagrams + quick references + solutions |
| DS&A | 202 | hello-algo (94) + neetcode/seanprashad (84) + cheatsheets (18) + OO design (6) | Book-quality prose + problem lists + reference guides |
| DDIA | 153 | Generated from TOC | Chapter/section stubs with cross-references |
| Behavioral | 11 | yangshun/tech-interview-handbook | Full behavioral guides + career + negotiation |
| CS Fundamentals | 7 | yangshun/tech-interview-handbook | Interview prep, study plans, cheatsheets |

### Features built

| Feature | Status | Key files |
|---------|--------|-----------|
| Ingestion pipeline | ✅ | scripts/ingest.ts, scripts/adapters/*.ts |
| Sidebar layout | ✅ | src/components/layout/Sidebar.tsx |
| Mobile nav | ✅ | src/components/layout/MobileNav.tsx |
| Dark/light theme | ✅ | ThemeProvider + next-themes |
| Home page | ✅ | src/app/HomeClient.tsx |
| Category listing (sectioned) | ✅ | src/components/layout/CategoryPage.tsx |
| Topic pages | ✅ | src/components/topic/TopicPageContent.tsx |
| Quick Reference supplements | ✅ | src/components/topic/TopicPageContent.tsx (supplementMap + hiddenSlugs) |
| MDX rendering | ✅ | compileMDX + remark-gfm |
| Topic header | ✅ | src/components/topic/TopicHeader.tsx |
| Status badge | ✅ | src/components/progress/StatusBadge.tsx |
| Search | ✅ | src/app/search/page.tsx (client-side MiniSearch) |
| Progress tracking | ✅ | src/lib/progress/db.ts (IndexedDB) |
| Daily queue | ✅ | src/lib/progress/queue.ts |
| Spaced repetition | ✅ | src/lib/progress/db.ts (fixed intervals) |
| Stats dashboard | ✅ | src/app/progress/page.tsx |
| Settings | ✅ | src/app/settings/page.tsx |
| Theme toggle | ✅ | next-themes |

### Features built (since initial launch)

| Feature | Status | Key files |
|---------|--------|-----------|
| hello-algo adapter | ✅ | scripts/adapters/hello-algo.ts — 94 DS&A prose topics |
| yangshun adapter | ✅ | scripts/adapters/yangshun.ts — 36 behavioral + CS topics |
| donnemartin adapter | ✅ | scripts/adapters/donnemartin.ts — 30 system design topics |
| Category page sections | ✅ | src/components/layout/CategoryPage.tsx — 10 SD sections, 3 DSA, 2 behavioral, 12 DDIA |
| Quick Reference supplements | ✅ | src/components/topic/TopicPageContent.tsx — supplementMap + hiddenSlugs |

### Features pending

| Feature | Priority | Notes |
|---------|----------|-------|
| Static export config | **High** | next.config.ts `output: 'export'` — one-line change, verified clean |
| DDIA references enrichment | Medium | Clone ept/ddia-references, add paper links per chapter |
| Knowledge graph viz | Low | react-flow component, reads public/topics-graph.json |
| Socratic tutor | Low | Cloudflare Worker + Gemini Flash |
| S3 deploy script | Low | aws s3 sync script |
| Code playground | **V2** | Monaco editor + WASM runtime |
| Topic comparison | **V2** | Side-by-side view |
| Anki export | **V2** | Export topics as Anki cards |

---

## Key decisions

1. **params is a Promise in Next.js 16** — all `[slug]/page.tsx` must use `async function Page({ params }: { params: Promise<{ slug: string }> })` with `await params`
2. **shadcn/ui v4 uses @base-ui/react** — no `asChild` prop, use `render` prop instead
3. **remark-gfm required for tables** — MDX doesn't enable GFM tables by default
4. **MDX brace escaping** — `{` in markdown (e.g. LaTeX) must be escaped as `\{` to avoid acorn parse errors
5. **No @tailwindcss/typography** — use custom `.topic-content` CSS class instead of `prose`

---

## Build commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Build + static export to `out/` |
| `npm run ingest` | Pull repos + generate MDX content + search index |
| `npm run lint` | ESLint |

## File index

### App pages
```
src/app/page.tsx                      ← Home (server, reads fs)
src/app/HomeClient.tsx                ← Home (client, interacts with IndexedDB)
src/app/layout.tsx                    ← Root layout (sidebar + mobile nav)
src/app/system-design/page.tsx        ← SD category listing
src/app/system-design/[slug]/page.tsx ← SD topic
src/app/ddia/page.tsx                 ← DDIA category listing
src/app/ddia/[slug]/page.tsx          ← DDIA topic
src/app/dsa/page.tsx                  ← DS&A category listing
src/app/dsa/[slug]/page.tsx           ← DS&A topic
src/app/cs-fundamentals/page.tsx      ← CS fundamentals listing
src/app/cs-fundamentals/[slug]/page.tsx
src/app/behavioral/page.tsx           ← Behavioral listing
src/app/behavioral/[slug]/page.tsx
src/app/search/page.tsx               ← Search
src/app/progress/page.tsx             ← Progress/stats
src/app/settings/page.tsx             ← Settings
src/app/globals.css                   ← Tailwind + custom styles
```

### Components
```
src/components/layout/Sidebar.tsx       ← Desktop sidebar nav
src/components/layout/MobileNav.tsx     ← Mobile hamburger nav
src/components/layout/ThemeProvider.tsx ← Dark/light theme
src/components/layout/CategoryPage.tsx  ← Shared category listing
src/components/topic/TopicHeader.tsx    ← Topic title + metadata
src/components/topic/TopicPageContent.tsx ← Full topic page layout
src/components/topic/TopicContent.tsx   ← MDX-rendered body
src/components/progress/StatusBadge.tsx ← Clickable progress status
components/ui/*                         ← shadcn/ui primitives
```

### Library
```
src/lib/content/types.ts  ← All TypeScript types (TopicMeta, ProgressEntry, etc.)
src/lib/content/topics.ts ← Topic loading + graph building (server-side, reads fs)
src/lib/content/fs.ts     ← File system helpers for build-time content reading
src/lib/content/search.ts ← MiniSearch setup
src/lib/progress/db.ts    ← IndexedDB wrapper (getProgress, setProgress, stats)
src/lib/progress/queue.ts ← Spaced repetition daily queue builder
```

### Content (generated by ingestion)
```
src/content/system-design/*.{mdx,json}  ← 59 SD topics
src/content/dsa/*.{mdx,json}            ← 84 DS&A topics
src/content/ddia/*.{mdx,json}           ← 153 DDIA topics
```

### Ingestion scripts
```
scripts/ingest.ts                         ← Main orchestrator
scripts/adapters/base.ts                  ← SourceAdapter interface
scripts/adapters/karan.ts                 ← karanpratapsingh (system design)
scripts/adapters/seanprashad.ts           ← seanprashad (leetcode metadata)
scripts/adapters/neetcode.ts              ← neetcode-gh (NeetCode 150)
scripts/adapters/ddia.ts                  ← DDIA book structure
```

### Cache (cloned repos, generated at build time)
```
.cache/repos/
  karanpratapsingh-system-design/    ← 18MB
  neetcode-leetcode/                 ← 43MB
  seanprashad-leetcode-patterns/     ← 9.1MB
```

### Public (generated at build time)
```
public/search-index.json   ← MiniSearch index (~36KB)
public/topics-graph.json   ← Knowledge graph edges (~121KB)
```

---

## Current state: 444 pages, 432 topics, 7 source repos

The app compiles and runs. Layout, navigation, search, progress, stats, dark mode all work.
All 5 categories have content: System Design (83), DS&A (202 prose + lists), DDIA (153), Behavioral (11), CS Fundamentals (7).
Category pages now group topics into sections with clear headers. Quick Reference cards link supplementary content.
Biggest remaining content gap: DDIA chapters are stubs with no deep content.
