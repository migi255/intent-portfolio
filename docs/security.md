# Browser security headers

Cloudflare Pages applies the rule in `public/_headers` to static responses. Vite's default build copies `public/` to the root of `dist/` unchanged, so Pages reads `dist/_headers`. Vite's own preview server does not apply the Pages rule. [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/) · [Vite public directory](https://vite.dev/guide/assets.html#the-public-directory)

The MIME, referrer, framing, and permissions headers take effect independently of CSP. `X-Frame-Options: DENY` provides framing protection during the report-only rollout. The proposed CSP denies unlisted resources, frames, objects, workers, native form submissions, and changes to the document base URL. React handles portfolio searches locally. Styles, images, and application scripts use same-origin URLs.

## Theme and Web Analytics

The theme bootstrap remains in the HTML head. Its SHA-256 source expression covers the exact script text, including whitespace, so only that inline script is allowed by the proposed policy. After editing the script, run `node tests/headers.test.mjs` and use the resulting hash in `public/_headers`.

Dashboard-enabled Web Analytics is injected by Pages. The script source list allows the documented beacon URL and versioned URLs under that path. The connection policy permits the expected same-origin `/cdn-cgi/rum` endpoint. Check the actual script and collector URLs on the deployed hostname before considering enforcement. [Enable Web Analytics on Pages](https://developers.cloudflare.com/pages/how-to/web-analytics/) · [Web Analytics CSP guidance](https://developers.cloudflare.com/web-analytics/faq/#what-do-i-need-to-add-to-my-content-security-policy-csp)

## Verify a build and a deployment

1. Run `npm run build` and then `PAGES_VERIFY_DIST=1 node --test tests/headers.test.mjs`. This compares the emitted header file against the source and verifies that the built HTML contains only the expected same-origin scripts and hashed theme bootstrap.
2. On an authorized Pages deployment, open DevTools in a clean browser profile. In **Network**, reload and inspect the document response headers. Confirm that the CSP header is `Content-Security-Policy-Report-Only` and that the other four headers have the values in `public/_headers`. Spot-check a static asset, too.
3. In **Console**, enable **Preserve log**, reload, and look for CSP diagnostics. Switch themes, refresh a manual theme choice, submit a supported search, and open the inspector. In **Network**, verify the app assets and the single analytics beacon script. Watch for a same-origin request to `/cdn-cgi/rum` after navigation or when leaving the tab. Note the directive and resource URL for any diagnostic. Avoid including query text or analytics identifiers in shared screenshots.
4. Some browsers may warn that the policy has no reporting destination or omit violation diagnostics. The absence of console messages alone does not establish compatibility. This rollout sends no CSP reports. Enforcement requires a separate decision after checking the deployed assets and analytics. [CSP Level 3](https://www.w3.org/TR/CSP3/)
