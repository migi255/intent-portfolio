# Intent Portfolio

A browser-first engineering portfolio demonstrating how a controlled language query can change both the records shown and the way they are presented. The first milestone uses labeled demonstration content while professional details await release review.

## Run locally

Use Node.js 22.12+ or 20.19+.

```sh
npm install
npm run dev
```

## Try the workflows

- **Explore Projects** shows expandable project cards. Try `projects involving APIs but not coursework`.
- **Evaluate Experience** shows a technology summary, capability comparison, and timeline. Try `what experience do you have with infrastructure?`.
- **Understand Engineering Decisions** shows architecture sequences, rationale, and tradeoffs. Try `case study Dataset Catalog` for one case.
- **Inspector** shows the input, resolved intent, expression, evaluation, plan, and component selection. Copy the URL to share the current view and validated filters.

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
