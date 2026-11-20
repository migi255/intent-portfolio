# Miguel Mazumder | Software Engineer

An evidence-first engineering portfolio. The opening presents selected contributions and routes to the résumé, experience and all five project cases. Technical briefings compare validation decisions and organize systems work by responsibility.

## Run locally

Use Node.js 22.12+ or 20.19+.

```sh
npm install
npm run dev
```

## Try the workflows

- **Correctness and testing** holds the same projects constant while changing the requirement, implementation, reference, validation, result or uncertainty under discussion.
- **Backend and systems** organizes contributions around boundaries, data and testing. Each briefing exposes evidence and limits, with a secondary Interface Inspector.
- **Find work by technology or topic** opens the existing deterministic explorer. Existing query and filter URLs continue to use that surface.
- **Public evidence JSON** exposes the compact package at `/evidence.v1.json`. See the [contract and enrichment workflow](docs/evidence.md).

## Validate

```sh
npm run lint
npm test
npm run build
PAGES_VERIFY_DIST=1 npm test
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
