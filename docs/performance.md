# Performance

| Metric | Target |
| --- | --- |
| Lighthouse mobile performance | 95 or higher |
| Initial compressed JavaScript | Approximately 150 KB or less |
| Core intent interaction requests | Zero serverless requests and no repeat asset requests |
| Field INP | 200 ms or less where representative field data exists |

## Reproduce

1. Install the dependencies and run `npm run build` and `npm run preview`. Record Node.js, Vite, browser, and Lighthouse versions along with machine and network conditions.
2. Use the initial page's request trace to identify entry chunks and imported JavaScript, then measure their gzip or Brotli sizes. Record the encoding with the result.
3. Run Lighthouse against the production preview using its mobile preset. Record the median of three runs.
4. Open the network panel, let the initial load settle, and navigate among goals, submit several queries, and open the inspector. Record any requests after the page settles.
5. Collect field INP after an approved deployment has representative traffic. Report browser smoke tests and lab metrics separately.

## Local verification status

The environment could run the TypeScript checks and core tests using cached artifacts. npm registry DNS was unavailable and the Vite package was absent from the local cache. This prevented the Vite production build, a verified lockfile, and production Lighthouse and bundle measurements.

React static rendering passed for the three default layouts, query failures, and invalid-plan fallback. A temporary Webpack 5.97.1 production bundle built under Node 20.19.2 measured 64587 bytes with gzip. This measures the temporary bundle. The Vite output remains unmeasured.

Chromium startup was blocked by the workspace sandbox. Browser keyboard and responsive checks, runtime request measurements, Lighthouse, and field INP remain pending. Source inspection found no network calls, external resource references, or serverless routes in the application.

## Editorial Spectrum

Vite remained unavailable because the npm registry could not be resolved and Vite was absent from the cache. The comparison below uses the same temporary Webpack 5.97.1 production JavaScript build and separate unminified CSS for the privacy checkpoint (`ff926eb`) and Editorial Spectrum. Node.js 20.19.2 and `gzip -n` were used for both samples.

| Asset | Baseline raw | Editorial raw | Baseline gzip | Editorial gzip |
| --- | ---: | ---: | ---: | ---: |
| JavaScript | 208,376 B | 209,790 B | 65,332 B | 65,705 B |
| CSS | 8,963 B | 12,048 B | 2,550 B | 3,298 B |
| HTML, including the theme bootstrap | 649 B | 1,266 B | 383 B | 630 B |

Token contrast was calculated using WCAG relative luminance. Across the sampled light and dark surface combinations, the lowest ratios were 5.82:1 for body and muted text, 5.00:1 for accents, 8.35:1 for button labels, 3.30:1 for control borders, and 5.53:1 for focus rings. These calculations cover the specified color pairs. Chromium could not start inside the sandbox, so live layout, focus, and paint timing checks remain unverified.
