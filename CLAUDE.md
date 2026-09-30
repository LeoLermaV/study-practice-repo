@AGENTS.md

## Project: faang-study

A personal FAANG interview study app. Content-first, local-first, minimal AI. Library-first UI in light and dark (amber accent, Helvetica) — see `DESIGN.md`.

### Quick start
```bash
npm run ingest    # Clone repos + generate content → src/content/*.mdx
npm run dev       # Dev server at localhost:3000
npm run build     # Production build → out/
```

### Current state
- **472 topics** across 5 categories: system-design (80), dsa (221), ddia (153), behavioral (11), cs-fundamentals (7)
- **10 adapters** in `scripts/adapters/` ingest content from open-source repos + hardcoded content
- **Pre-rendered static pages**, client-side search (MiniSearch / cmdk palette), progress tracking (IndexedDB with optional GitHub Gist sync)
- **Re-reading rotation**: "Mark as studied" schedules a topic; due topics show on `/review` and are rated Fuzzy / Mostly / Solid (SM-2)

### Key files
| File | What it is |
|------|-----------|
| `PLAN.md` | Architecture, content sources, todos, file index |
| `HANDOVER.md` | Current state, gotchas, fresh-agent prompt |
| `src/lib/content/types.ts` | All TypeScript types |
| `scripts/adapters/base.ts` | `SourceAdapter` interface |
| `src/lib/content/sections.ts` | Section definitions + `groupTopics` / `orderedSlugs` (grouping and reading order) |
| `src/lib/content/library.ts` | `getLibrary()`, `findTopic()`, `placeTopic()` (server-only) |
| `src/components/library/Library.tsx` | Library screen used by `/` and every category route |
| `src/components/progress/ReviewPanel.tsx` | Mark as studied / recall rating at the end of each topic |
| `src/components/topic/TopicPageContent.tsx` | Topic page, breadcrumb, Quick Reference supplements, related topics, prev/next |
| `src/lib/progress/sync.ts` | GitHub Gist push/pull + auto-sync |
| `src/lib/progress/merge.ts` | CRDT-style entry merge for sync |
| `src/components/layout/SyncProvider.tsx` | Auto-sync hook (pull on mount, flush on hide) |

### Content sources
| Adapter | Repo | Stars | Topics |
|---------|------|:----:|:------:|
| karan | karanpratapsingh/system-design | 44k | 59 SD |
| hello-algo | krahets/hello-algo | 127k | 94 DS&A |
| yangshun | yangshun/tech-interview-handbook | 140k | 11 BH + 7 CS + cheatsheets |
| donnemartin | donnemartin/system-design-primer | 353k | 30 SD (16 hidden + 8 solutions + 6 OO) |
| neetcode | neetcode-gh/leetcode | 6.4k | 36 DS&A |
| seanprashad | seanprashad/leetcode-patterns | 13k | 48 DS&A |
| ddia | — (DDIA TOC + ept/ddia-references) | — | 153 DDIA |
| dsa-supplements | hardcoded | — | 8 DS&A |
| python-practice | hardcoded | — | _ DS&A |
| leetcode-hints | hardcoded | — | 25 DS&A |
