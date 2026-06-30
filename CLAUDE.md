@AGENTS.md

## Project: faang-study

A personal FAANG interview study app. Content-first, local-first, minimal AI.

### Quick start
```bash
npm run ingest    # Clone repos + generate content → src/content/*.mdx
npm run dev       # Dev server at localhost:3000
npm run build     # Production build → out/
```

### Current state
- **432 topics** across 5 categories: system-design (83), dsa (202), ddia (153), behavioral (11), cs-fundamentals (7)
- **7 adapters** in `scripts/adapters/` ingest content from open-source repos
- **444 pre-rendered static pages**, client-side search (MiniSearch), progress tracking (IndexedDB)

### Key files
| File | What it is |
|------|-----------|
| `PLAN.md` | Architecture, content sources, todos, file index |
| `HANDOVER.md` | Current state, gotchas, fresh-agent prompt |
| `src/lib/content/types.ts` | All TypeScript types |
| `scripts/adapters/base.ts` | `SourceAdapter` interface |
| `src/components/layout/CategoryPage.tsx` | Sectioned category listing |
| `src/components/topic/TopicPageContent.tsx` | Topic page + Quick Reference supplements |

### Content sources
| Adapter | Repo | Stars | Topics |
|---------|------|:----:|:------:|
| karan | karanpratapsingh/system-design | 44k | 59 |
| hello-algo | krahets/hello-algo | 127k | 94 |
| yangshun | yangshun/tech-interview-handbook | 140k | 36 |
| donnemartin | donnemartin/system-design-primer | 353k | 30 |
| neetcode | neetcode-gh/leetcode | 6.4k | 36 |
| seanprashad | seanprashad/leetcode-patterns | 13k | 48 |
| ddia | — (DDIA TOC) | — | 153 |
