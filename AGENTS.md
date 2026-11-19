# Intent Portfolio

Build a recruiter-friendly portfolio that demonstrates a deterministic, browser-first intent interface. Read [architecture](docs/architecture.md) before changing stage boundaries.

- Keep parsing, evaluation and planning independent of React. Use typed data and a closed renderer registry.
- Keep core interactions local. Prefer small modules and minimal dependencies. Measure the production bundle before introducing optimization infrastructure.
- Support explicit navigation, shareable state, keyboard access, transition focus and responsive layouts.
- Use approved content in the public site. Keep private sources, drafts, credentials and unpublished details out of Git and build outputs.
- Run `npm run lint`, `npm test` and `npm run build`. Validate the built site and inspect the publication surface.
- Cloudflare Pages builds from the repository root on `main` with `npm run build` and publishes `dist`. Obtain explicit approval before pushing or deploying.

## Repository skills

- [Symbolic intent engine](.agents/skills/symbolic-intent-engine/SKILL.md)
- [Adaptive UI composition](.agents/skills/adaptive-ui-composition/SKILL.md)
- [Portfolio content management](.agents/skills/portfolio-content-management/SKILL.md)
- [Performance and deployment](.agents/skills/performance-and-deployment/SKILL.md)
