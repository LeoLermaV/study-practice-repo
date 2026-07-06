# FAANG Study

A personal web app for studying FAANG interviews. Content-first, local-first, minimal AI.

**432 topics** across 5 categories, ingested from 7 open-source GitHub repos.


Live Repo: [Study Practice Repo](https://leolermav.github.io/study-practice-repo/)

---

## Quick start

```bash
npm run ingest    # Clone repos, parse content, generate MDX → src/content/
npm run dev       # Dev server at localhost:3000
npm run build     # Production build → out/
```

**Order:** always `npm run ingest` first (generates the content files), then `npm run dev` or `npm run build`.

---

## Content

| Category | Topics | Sources |
|----------|:------:|---------|
| System Design | 83 | karanpratapsingh (59) + donnemartin (24 solutions + theory) |
| Data Structures & Algorithms | 202 | hello-algo (94 prose) + neetcode/seanprashad (84 problem lists) + cheatsheets (18) + OO design (6) |
| Designing Data-Intensive Applications | 153 | Auto-generated from book TOC |
| Behavioral | 11 | yangshun/tech-interview-handbook |
| CS Fundamentals | 7 | yangshun/tech-interview-handbook |

### Source repos

| Repo | Stars | What it provides |
|------|:----:|-----------------|
| karanpratapsingh/system-design | 44k | 59 textbook-style chapters with diagrams |
| krahets/hello-algo | 127k | 94 book-quality DS&A prose chapters |
| yangshun/tech-interview-handbook | 140k | Behavioral guides + algorithm cheatsheets + career topics |
| donnemartin/system-design-primer | 353k | 16 quick-reference theory pages + 8 interview solutions + 6 OO design |
| neetcode-gh/leetcode | 6.4k | NeetCode 150 problem lists by pattern |
| seanprashad/leetcode-patterns | 13k | 178 LeetCode questions with difficulty, tags, company frequency |

---

## How the category pages work

Each category page groups topics into sections with clear headers:

- **System design:** Foundations → Infrastructure → Data Layer → Architecture → Advanced → Security → Case Studies → Interview Practice
- **DSA:** hello-algo chapters → Cheatsheets → Problem Lists
- **Behavioral:** Interview Guides → Career & Negotiation
- **CS Fundamentals:** single section
- **DDIA:** 12 chapters, one section each

Quick Reference links appear at the bottom of relevant topic pages, linking to supplementary content from a different source.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) — static export |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui v4 (@base-ui/react) |
| Content | MDX via next-mdx-remote + remark-gfm |
| Search | MiniSearch (client-side, prebuilt index) |
| Progress | IndexedDB via idb-keyval |
| Visualization | @xyflow/react (knowledge graph) |

---

## Architecture

```
npm run ingest:
  1. Clone/pull source repos → .cache/repos/
  2. Per-source adapters parse → TopicMeta[]
  3. Emit MDX files → src/content/{category}/*.mdx
  4. Emit metadata → src/content/{category}/*.json
  5. Emit search-index.json + topics-graph.json → public/

npm run build → static HTML in out/ → S3 + Cloudflare CDN
```

---

## File structure

```
scripts/
  ingest.ts                         ← Main orchestrator
  adapters/                         ← 7 source adapters
    base.ts                         ← SourceAdapter interface
    karan.ts                        ← karanpratapsingh (system design)
    hello-algo.ts                   ← krahets/hello-algo (DS&A prose)
    yangshun.ts                     ← yangshun behavioral + CS + cheatsheets
    donnemartin.ts                  ← donnemartin system design + solutions
    neetcode.ts / seanprashad.ts    ← LeetCode problem lists
    ddia.ts                         ← DDIA book structure

src/
  app/                              ← Next.js App Router pages
  components/
    layout/CategoryPage.tsx         ← Sectioned category listing
    topic/TopicPageContent.tsx      ← Topic page + Quick Reference supplements
  lib/
    content/                        ← Types, file helpers, search, graph
    progress/                       ← IndexedDB, daily queue
  content/                          ← Generated MDX + JSON (gitignored)
```

---

## Docs

- **PLAN.md** — Full architecture, content sources, build plan, todos
- **HANDOVER.md** — Current state, known issues, gotchas, fresh-agent prompt
- **CLAUDE.md** — Project context for AI agent sessions
