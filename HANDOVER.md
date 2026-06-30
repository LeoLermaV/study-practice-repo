# FAANG Study App — Handover

## Project overview

A personal FAANG interview study app built with Next.js 16 static export. Content is ingested from open-source repos at build time. Local-first progress (IndexedDB), client-side search (MiniSearch). Deployed to S3 + Cloudflare.

**432 topics across 5 categories:** System Design (83), DS&A (202), DDIA (153), Behavioral (11), CS Fundamentals (7).

---

## How to run

```bash
# First time or after pulling new content sources:
npm run ingest    # Clone repos, parse content, generate MDX files + search index

# Development:
npm run dev       # localhost:3000

# Build for production:
npm run build     # Outputs to out/
```

---

## File index

### Entry points
| File | Purpose |
|------|---------|
| `PLAN.md` | Full build plan, architecture, todo list |
| `package.json` | Dependencies, scripts |
| `next.config.ts` | Next.js config |
| `src/app/layout.tsx` | Root layout (sidebar, theme, fonts — Inter + JetBrains Mono) |
| `src/app/globals.css` | Tailwind v4 + custom `.topic-content` styles |

### Routes
| File | What it renders |
|------|----------------|
| `src/app/page.tsx` | Home page — reads topic files, renders `HomeClient` |
| `src/app/HomeClient.tsx` | Home — daily queue, stats cards, category navigation |
| `src/app/system-design/page.tsx` | System Design category listing |
| `src/app/system-design/[slug]/page.tsx` | System Design topic page |
| `src/app/ddia/page.tsx` | DDIA category listing |
| `src/app/ddia/[slug]/page.tsx` | DDIA topic page |
| `src/app/dsa/page.tsx` | DS&A category listing |
| `src/app/dsa/[slug]/page.tsx` | DS&A topic page |
| `src/app/cs-fundamentals/page.tsx` | CS Fundamentals listing |
| `src/app/cs-fundamentals/[slug]/page.tsx` | CS Fundamentals topic page |
| `src/app/behavioral/page.tsx` | Behavioral listing |
| `src/app/behavioral/[slug]/page.tsx` | Behavioral topic page |
| `src/app/search/page.tsx` | Client-side search (MiniSearch) |
| `src/app/progress/page.tsx` | Stats dashboard |
| `src/app/settings/page.tsx` | Theme toggle, clear data |

### Components
| File | Purpose |
|------|---------|
| `src/components/layout/Sidebar.tsx` | Desktop sidebar (home, SD, DDIA, DS&A, CS, behavioral, search, progress, settings) |
| `src/components/layout/MobileNav.tsx` | Mobile hamburger sheet |
| `src/components/layout/ThemeProvider.tsx` | next-themes wrapper |
| `src/components/layout/CategoryPage.tsx` | Shared category listing (used by all 5 categories) |
| `src/components/topic/TopicPageContent.tsx` | Topic page layout — header, prerequisites, related, MDX body, prev/next nav |
| `src/components/topic/TopicHeader.tsx` | Title, difficulty badge, reading time, tags |
| `src/components/topic/TopicContent.tsx` | MDX-rendered body wrapper (uses `.topic-content` CSS) |
| `src/components/progress/StatusBadge.tsx` | Clickable progress state (not-started → reading → understood → reviewed → mastered) |

### Library
| File | Purpose |
|------|---------|
| `src/lib/content/types.ts` | All TypeScript types (TopicMeta, ProgressEntry, StudyStats, Category, etc.) |
| `src/lib/content/fs.ts` | Build-time file system helpers (getTopicFiles, readTopicMeta, readTopicMdx) |
| `src/lib/content/topics.ts` | Server-side topic loading + graph building |
| `src/lib/content/search.ts` | MiniSearch wrapper |
| `src/lib/progress/db.ts` | IndexedDB via idb-keyval (getProgress, setProgress, updateStatus, getStudyStats) |
| `src/lib/progress/queue.ts` | Daily queue builder with spaced repetition |

### Ingestion pipeline
| File | Purpose |
|------|---------|
| `scripts/ingest.ts` | Main orchestrator — clones repos, runs adapters, emits MDX + search index |
| `scripts/adapters/base.ts` | `SourceAdapter` interface (name, cloneUrl, topics(), content()) |
| `scripts/adapters/karan.ts` | Parses karanpratapsingh/system-design README.md — 59 topics |
| `scripts/adapters/seanprashad.ts` | Parses seanprashad/leetcode-patterns questions.json — 48 pattern topics |
| `scripts/adapters/neetcode.ts` | Parses neetcode-gh/leetcode .problemSiteData.json — 36 topics + Blind 75 |
| `scripts/adapters/ddia.ts` | Generates DDIA structure from hardcoded TOC — 153 topics |
| `scripts/adapters/hello-algo.ts` | Parses krahets/hello-algo en/mkdocs.yml nav + en/docs/ markdown — 94 topics |
| `scripts/adapters/yangshun.ts` | Parses yangshun/tech-interview-handbook sidebars.js + markdown files — 36 topics |
| `scripts/adapters/donnemartin.ts` | Parses donnemartin/system-design-primer README.md sections + solution READMEs — 30 topics |

### Content (generated)
| Directory | Topics | Sources |
|-----------|:------:|---------|
| `src/content/system-design/` | 83 | karanpratapsingh (59) + donnemartin (24) |
| `src/content/dsa/` | 202 | hello-algo (94 prose) + neetcode/seanprashad (84) + cheatsheets (18) + OO design (6) |
| `src/content/ddia/` | 153 | Auto-generated from DDIA TOC |
| `src/content/behavioral/` | 11 | yangshun (interview guides + career) |
| `src/content/cs-fundamentals/` | 7 | yangshun (prep + cheatsheets + rubrics) |

### Cache (cloned repos)
| Directory | Size |
|-----------|:----:|
| `.cache/repos/karanpratapsingh-system-design/` | 18MB |
| `.cache/repos/neetcode-leetcode/` | 43MB |
| `.cache/repos/seanprashad-leetcode-patterns/` | 9.1MB |
| `.cache/repos/krahets-hello-algo/` | 465MB (sparse checkout: ~50MB of docs) |
| `.cache/repos/yangshun-tech-interview-handbook/` | ~50MB |
| `.cache/repos/donnemartin-system-design-primer/` | ~30MB |

---

## Current state

### Works
- Layout with sidebar + mobile nav + dark/light mode
- Home page with daily queue + stats cards + category cards
- All 5 category listing pages — **sectioned** (grouped by source/topic area with headers and descriptions)
- Topic pages with MDX rendering (tables, images, code blocks)
- **Quick Reference supplements** — donnemartin theory cards appear on relevant karan topic pages
- Search (client-side MiniSearch)
- Progress tracking (IndexedDB, click status to cycle)
- Progress stats dashboard
- Settings page (theme, clear data)
- Ingestion pipeline (**7 adapters**, 432 topics)
- **444 pre-rendered static pages**

### Known issues
- `params` is a Promise in Next.js 16 — must use `await params` in all `[slug]/page.tsx`
- shadcn/ui v4 uses `@base-ui/react` — `asChild` doesn't exist, use `render` prop
- MDX needs `remark-gfm` for markdown tables to render
- `{` and `}` in markdown body (LaTeX, JSON examples) cause MDX compile errors — escaped at ingestion time with `\{`
- Images from karanpratapsingh repo are hotlinked from `raw.githubusercontent.com` — may be slow or blocked
- Donnemartin images are hotlinked — GitHub raw URLs, 30 images total
- Hello-algo uses 16-language code tabs — only Python is kept during ingestion
- HTML comments from yangshun content (`<!-- -->`) must be stripped before MDX compilation
- `<id>` in MkDocs table captions must be replaced with `ID` to avoid broken HTML tags
- Tab markers like `=== "<1>"` in MkDocs content must be parsed as non-Python tab blocks
- Blockquote `>` shouldn't be escaped to `&gt;` during HTML sanitization

### Content priorities (what's built + what's next)

#### ✅ Built in this session

| Source | Topics | Where |
|--------|:-----:|-------|
| hello-algo adapter | 94 | `src/content/dsa/` — book-quality DS&A prose |
| yangshun adapter | 36 | `src/content/behavioral/` (11) + `src/content/cs-fundamentals/` (7) + `src/content/dsa/` (18 cheatsheets) |
| donnemartin adapter | 30 | `src/content/system-design/` — theory (16) + solutions (8) + OO design in DSA (6) |
| Category page sections | — | `CategoryPage.tsx` groups 432 topics into 10 SD sections, 3 DSA, 5+ behavioral/CS, 12 DDIA |
| Quick Reference supplements | — | `TopicPageContent.tsx` shows donnemartin cards on karan topic pages via `supplementMap` |
| hiddenSlugs filter | — | 16 donnemartin theory topics hidden from category listing, only accessible via Quick Reference links |

#### 🔴 Next priorities

| Priority | What | Effort | Why now |
|:--------:|------|:------:|---------|
| **1** | **Static export config** | 15 min | `next.config.ts: output: 'export'` — audited clean, one-liner. Unblocks deployment. |
| **2** | **DDIA references enrichment** | 1-2 hrs | Clone `ept/ddia-references`, add paper links to 153 DDIA chapter stubs. High impact-to-effort ratio. |
| **3** | **Knowledge graph viz** | 2-3 hrs | react-flow widget using `public/topics-graph.json`. Interaction with xyflow. |
| **4** | **Socratic tutor** | 3-4 hrs | Cloudflare Worker + Gemini Flash, embedded topic tutor panel. Separate deployable. |
| **5** | **S3 deploy script** | 30 min | `aws s3 sync out/` + CloudFront invalidation. |

#### 🟢 Future options

| Feature | Effort | Notes |
|---------|:------:|-------|
| Code playground | 4-6 hrs | Monaco editor + WASM runtime for DSA |
| Topic comparison | 2 hrs | Side-by-side topic view |
| Anki export | 2 hrs | Export topics as Anki flashcards |
| djeada/Algorithms-And-Data-Structures | 1-2 hrs | 469-star repo, niche DS&A prose |
| donnemartin Anki decks | 30 min | Extract `.apkg` files as downloadable resources |

---

## Gotchas for a fresh agent

### Framework & UI (always true)
1. **Next.js 16** — `params` is always a Promise in page components. All `[slug]/page.tsx` must be `async` with `await params`
2. **shadcn/ui v4** — uses `@base-ui/react`, NOT Radix UI. No `asChild` prop anywhere. Use `render` prop for composition
3. **Base UI imports** — components import from `@base-ui/react/{component}` not `@radix-ui/react-{component}`
4. **Tailwind v4** — uses the new CSS-first config (`@import "tailwindcss"`), not `tailwind.config.js`
5. **No `@tailwindcss/typography`** — don't use `prose` classes. Use `.topic-content` custom CSS instead
6. **Font** — Inter for body, JetBrains Mono for code. Imported via `next/font/google` in `layout.tsx`
7. **Icons** — use `lucide-react` (already installed and used throughout)

### Build & ingestion pipeline
8. **Ingestion must run before build** — `npm run ingest` generates `src/content/` files and `public/search-index.json`. These are gitignored
9. **`.cache/repos/` is gitignored** — cloned repos don't persist in version control
10. **Type strict** — TypeScript strict mode is on. Be careful with `Record<string, unknown>` casts
11. **MDX brace escaping** — `{` and `}` in markdown body must be escaped as `\{` and `\}` to avoid MDX acorn parse errors. Done generically in `ingest.ts:42` for ALL adapters. LaTeX `\frac{1}{2}` gets escaped to `\frac\{1\}\{2\}` which renders correctly in text.

### hello-algo adapter specific
12. **Repo size** — 465MB full, use `--depth 1 --filter=blob:none` with sparse checkout for `en/docs/` + `en/mkdocs.yml`
13. **English content** — lives in `en/docs/chapter_*/`. Falls back to root `docs/` (Chinese) if English missing
14. **Multi-language tabs** — `=== "Python"` / `=== "C++"` etc. Content tab parser must match `^=== "([^"]+)"$` (not `\w+`) to catch tab markers like `=== "<1>"`
15. **Non-Python tabs** — Image-only tabs (animation steps) with `=== "<1>"` labels have no Python variant. Parser must fall through to keep ALL tab content when no Python tab exists
16. **`<id>` in MkDocs table captions** — `Table <id> &nbsp; caption` appears in ~20 files. Replace `<id>` → `ID`, then convert `<p align="center">Table ID ...</p>` to markdown italic `*Table: ...*`
17. **Remaining `<number>` patterns** — After tab processing, any `<1>`, `<2>` etc. in table cells must be escaped with `&lt;1&gt;` to prevent MDX HTML tag parsing
18. **`??? pythontutor` admonitions** — Collapsible admonitions with links to pythontutor.com. Strip the admonition line AND the indented URL following it
19. **Custom `src` code imports** — ```src [file]{...}``` syntax pulls code from source files. Strip these entirely (can't resolve at build time)
20. **Image path rewriting** — Relative paths like `array.assets/array_definition.png` → `https://raw.githubusercontent.com/krahets/hello-algo/main/en/docs/chapter_dir/path`

### yangshun adapter specific
21. **HTML comments** — `<!-- ... -->` blocks in content cause MDX errors. Must be stripped with `<!--[\s\S]*?-->`
22. **Docusaurus JSX components** — `<InDocAd />`, `<AlgorithmCourses />`, `<QuestionList />` must all be stripped. Some are self-closing, some have children
23. **`import` statements** — Docusaurus imports on the same line: `import X from 'path'; import Y from 'path'`. Regex `^import .+ from .+;?` catches whole line
24. **`<head>` meta blocks** — `<head><meta ...></head>` blocks in Docusaurus frontmatter must be stripped

### donnemartin adapter specific
25. **Monolithic README.md** — 1839 lines, ~58KB. All theory content in one file. Parse by `##` heading boundaries
26. **Unquoted HTML URLs** — `<i><a href=http://example.com>Source: ...</a></i>` has URLs WITHOUT quotes. The caption regex must handle both `href="..."` and `href=http://...`
27. **`<` escaping must NOT escape blockquote `>`** — Don't do `result.replace(/>/g, '&gt;')` or blockquotes like `> text` become `&gt; text`. Only escape `<` globally
28. **HTML image blocks** — Contains `<p align="center"><img src="images/xxx.png"><br/><i><a href=...>Source: ...</a></i></p>`. Strip wrapper tags, convert `<img>` to markdown `![diagram](raw_url)`, convert `<i><a>` captions to `*[Source](url)*`
29. **Solution READMEs** — Located at `solutions/system_design/{dir}/README.md`. 8 solutions with their own section structure
30. **OO Design in Jupyter notebooks** — `.ipynb` files contain JSON with markdown + code cells. Parse notebook JSON to extract content
31. **Deep heading nesting** — README uses `####` through `######`. The content processor should NOT shift heading levels (left as-is)

### Category page & topic page specific
32. **hiddenSlugs filter** — Donnemartin theory topics (16) are in `hiddenSlugs` set in `CategoryPage.tsx`. They're excluded from all sections AND the catch-all leftovers. Only accessible via Quick Reference links on topic pages
33. **supplementMap** — Hardcoded in `TopicPageContent.tsx`. Maps karan slugs → donnemartin supplement slugs. Only show Quick Reference cards when donnemartin genuinely adds value (not thin/short pages)
34. **Section ordering** — System-design sections are hardcoded in `sectionsByCategory` in `CategoryPage.tsx`. Karan chapters come first in progression, solutions section last
35. **Utility pages** — `table-of-contents`, `references`, `next-steps` in `utilitySlugs` set. Filtered from all category listings

---

## Fresh agent prompt

Copy-paste this to start a new opencode session with full context:

```
You are working on a FAANG interview study app at /Users/leo/Documents/claude/projects/faang-study.

Next.js 16, App Router, Tailwind v4, shadcn/ui v4 (@base-ui/react), TypeScript strict.
Content ingested from 7 open-source repos into src/content/{category}/*.mdx.
432 topics across 5 categories: system-design (83), dsa (202), ddia (153), cs-fundamentals (7), behavioral (11).

Commands: npm run ingest → npm run dev → npm run build

Key files to read first:
- PLAN.md — full architecture, todos, file index, current state
- HANDOVER.md — gotchas, adapters, content priorities
- src/lib/content/types.ts — TopicMeta type and all interfaces
- scripts/adapters/base.ts — SourceAdapter interface
- src/components/layout/CategoryPage.tsx — sectioned category page layout
- src/components/topic/TopicPageContent.tsx — topic page + Quick Reference supplements

Adapters (scripts/adapters/):
- karan.ts — system design prose from karanpratapsingh (59 topics)
- neetcode.ts — NeetCode 150 patterns from neetcode-gh/leetcode (36 topics)
- seanprashad.ts — LeetCode pattern metadata from seanprashad/leetcode-patterns (48 topics)
- ddia.ts — DDIA book structure from hardcoded TOC (153 topic stubs)
- hello-algo.ts — DS&A textbook prose from krahets/hello-algo (94 topics)
- yangshun.ts — Behavioral + CS fundamentals + cheatsheets from yangshun/tech-interview-handbook (36 topics)
- donnemartin.ts — System design theory + solutions + OO design from donnemartin/system-design-primer (30 topics)

UI features built:
- Sectioned category pages — topics grouped by concept area with headers (CategoryPage.tsx)
- Quick Reference supplements — donnemartin theory cards appear on karan topic pages (TopicPageContent.tsx)
- hiddenSlugs — 16 donnemartin theory topics hidden from category listing, only accessible via Quick Reference
- supplementMap — hardcoded karan-slug → donnemartin-slug mapping in TopicPageContent.tsx

Key gotchas (full list with details in HANDOVER.md):
- params is a Promise in Next.js 16 — must await
- shadcn v4 uses @base-ui/react — no asChild, use render prop
- remark-gfm required for markdown tables
- No Tailwind prose — use .topic-content CSS
- { and } in markdown escaped as \{ \} for MDX (done in ingest.ts)
- Donnemartin: HTML <i> captions with unquoted URLs, <id> table captions, <number> tab markers
- Donnemartin: DON'T escape > globally (breaks blockquotes)
- Yangshun: strip HTML comments <!-- -->, strip Docusaurus JSX components (InDocAd, QuestionList, AlgorithmCourses)
- Hello-algo: repo is 465MB — use sparse checkout, parse en/mkdocs.yml for nav, keep only Python from multi-language tabs
- hiddenSlugs filter: 16 donnemartin topics excluded from category listing
- supplementMap: only show Quick Reference when donnemartin adds genuine value (not thin/short pages)
- Utility pages (table-of-contents, references, next-steps) filtered from all listings

Remaining priorities (in order):
1. Static export config — next.config.ts: output: 'export' (single line, audited clean)
2. DDIA references enrichment — clone ept/ddia-references, add paper links to 153 DDIA chapter stubs
3. Knowledge graph viz — react-flow widget using public/topics-graph.json
4. Socratic tutor — Cloudflare Worker + Gemini Flash, separate deployable
5. S3 deploy script — aws s3 sync out/ + CloudFront invalidation

Start by reading PLAN.md, then HANDOVER.md for the full gotchas and file index.
```
