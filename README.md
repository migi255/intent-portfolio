# Miguel Mazumder | Software Engineer

A browser-first engineering portfolio demonstrating how a controlled language query can change both the records shown and the way they are presented. The public catalog includes five engineering projects with case studies and experience records.

## Run locally

Use Node.js 22.12+ or 20.19+.

```sh
npm install
npm run dev
```

## Try the workflows

- Enter an intent such as `Where testing changed the design` to see matching projects, decisions, and experience together. The results show how the request was interpreted.
- Use **Browse directly** for the project grid, experience comparison, or selected engineering decisions. Try `case study Ariadne` for a direct detail view.
- **Why these results?** summarizes the filters and record types shown. Open **Structured criteria** to see the parsed expression. Shared links preserve validated criteria and the view. Search text stays in the browser session.

## Validate

```sh
npm run lint
npm test
npm run build
npm run preview
```

The lint command checks strict TypeScript and unused declarations. The test command compiles the framework-independent modules and uses Node's built-in test runner.

## Cloudflare Pages

| Setting | Value |
| --- | --- |
| Framework preset | React (Vite) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | Repository root |
| Production branch | `main` |
| Environment variables | None |

Publication requires explicit approval. The connected Pages project can run its normal Git-triggered deployment after an approved push.

## Engineering notes

- [Architecture and URL contract](docs/architecture.md)
- [Design philosophy](docs/design-philosophy.md)
- [Performance targets and validation](docs/performance.md)
- [Tradeoffs](docs/tradeoffs.md)
- [Agent instructions](AGENTS.md)
