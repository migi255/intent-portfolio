---
name: performance-and-deployment
description: Type-check and build the Intent Portfolio locally and review its static output for Cloudflare Pages.
---

# Portfolio validation

- Install dependencies with `npm ci` when a lockfile is present, or `npm install` otherwise. Run `npm run typecheck` and `npm run build` from the repository root.
- Serve the built output with `npm run preview`. Check the entry page, section links, keyboard access, and narrow layouts.
- Check that `dist/index.html` and its referenced assets exist. Look for any draft content, credentials, private links, or source documents in the build and the files intended for Git.
- Report the completed checks and any verification limits. Cloudflare Pages builds with `npm run build` and serves `dist` after an authorized push.
- Measure compressed initial JavaScript from the production output. Use a production preview for Lighthouse and network observations, and record tool versions and conditions in `docs/performance.md`.
- Verify that repeated queries create no network requests once the relevant UI code is loaded. Treat INP as a field metric and label local timings separately.
