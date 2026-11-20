# Public evidence and briefing contract

`/evidence.v1.json` is the stable, single-request starting point. The HTML links to it as an alternate representation. Resolve the payload’s root-relative URLs against the portfolio origin. `/evidence-schema.v1.json` describes the JSON shape and contains the presentation plan definition. Clients can use the payload alone to reconstruct the authored briefings.

1. Start with `claims` for documented work. Join on `projectId` for context and maturity. Cite the claim ID with the stable source URL and keep its role, classification, and limit with the conclusion.
2. Use `relationships` as reviewed interpretations. An assistant can combine any public claims to address a new question and explain its reasoning with citations.
3. Treat prospective responsibilities and team fit as hypotheses. Explain why past work is relevant, state assumptions and uncertainties, and suggest a way to test each projection. An evidence gap leaves the capability unknown.
4. Use `briefings` and their plans to reproduce the site's authored views if desired. External readers can construct their own prose, tables, or interfaces from the package alone.

The package embeds this guidance in `interpretationGuide`. It distinguishes candidate-published accounts, evidence classifications, and reviewed interpretations. The `source.type` and `details` fields are optional additions within v1. Existing claim fields, IDs, URLs, and plans are stable. Clients enforcing an older closed schema need the updated schema to accept the additive fields. Resolve root-relative URLs against the portfolio origin that served the package. When using an uploaded copy, also supply the portfolio URL.

`details` supports optional claim kind, responsibility roles, collaboration and AI assistance, problem and constraints, documented alternatives, validation reference and environment, coordination, and a positive revision number. Read these labels alongside the role text and limitations. Missing details are unspecified, and the structured roles may describe only part of a contribution. Current values are drawn from the approved public accounts. Revision history and historical source references stay in the private review record.

The current operations are `comparison` and `responsibility`. A comparison keeps the claims constant across its authored questions. A responsibility briefing groups contributions around a responsibility such as trust boundaries. The renderer has no project-specific comparison code. A new relationship can reuse either operation and gets a stable path that includes its ID and focus. The runtime validator checks referential integrity, operation and focus compatibility, required evidence order, approved status, exact fields and size limits. It accepts neither display text nor code. The TypeScript `parsePlan` function is the interface for a future local importer. The current UI uses authored plans and has no public model or plan intake.

## Publication boundary

- `src/data/projects.ts` and `src/data/public.ts` contain existing public careers content. `src/evidence/approved.ts` contains reviewed public summaries, attribution, qualifications and authored relationships.
- The site and export read those same inputs. Public validation selects approved records and checks IDs, relationships, qualifications and sources. Production preflight rejects draft or withdrawn data in public input modules, a nonempty tracked review stub, and unexpected public assets. The postbuild checks that each published claim and its source resolve to real anchors. Vite uses its default disabled production sourcemaps.
- The legacy review overlay is for authorized loopback development. It is outside the evidence catalog. Resume sources and future repository research remain separate from this repository’s public inputs and output.
- Source references are links to public candidate-authored cases. They establish provenance and do not raise a claim’s evidence classification.

## Later evidence enrichment

1. **Private investigation.** Record authorized repositories, branches and time ranges. Inspect read-only and keep notes, paths, commit references and experimental artifacts in the authorized private workspace outside the portfolio repository. Distinguish merged, unmerged, reverted and deployed work.
2. **Evidence extraction.** Classify source, implementation status, evaluation setup and what the source can verify. Document independent reproduction separately. Presence in a branch or a passing test does not establish deployment.
3. **Candidate claims.** Draft one coherent contribution, decision or result per claim. Capture the problem, approach, validation reference, observed outcome and limits that the sources support.
4. **Attribution and accuracy review.** Separate system behavior, team contributions and personal work. Record which parts were designed, implemented, directed, reviewed, approved or validated by the candidate. Commit authorship and co-author trailers alone do not establish manual implementation. Keep uncertain ownership explicit.
5. **Confidentiality review.** Scrub internal identifiers, sensitive infrastructure, unpublished data and security findings. Review claims and any proposed cross-project interpretations separately.
6. **Explicit approval.** Approve the exact public wording, structured fields, attribution, source anchor and limitations before creating or changing a public record.
7. **Curated inclusion.** Revise the same stable ID when the underlying contribution stays the same. Mint a new ID for a materially different claim. Keep revisions and withdrawals in the private ledger and remove withdrawn content from publication inputs. Review dependent relations and previously deployed artifacts.
8. **Generate and inspect.** Build the human views and package from approved modules. Verify JSON, rendered HTML, bundles, source anchors and approval boundaries. Compare the artifacts with the previous release before any authorized publication.

The résumé builder continues to use its own Markdown inventory and evidence ledger. The public résumé route is a printable selection of approved portfolio records. The two surfaces overlap on research software and AI projects. The résumé builder also has dated roles, education and more detailed technical bullets. Its wording can differ from the public catalog’s narrower scope and attribution. Review shared facts in both sources when changing project maturity, dates, contribution ownership or validation results. Education, a downloadable résumé and additional career history require an approved public source. Changes to portfolio claims do not enter résumé generation automatically.

## Pending disclosure review

The existing public designation for the mass spectrometry application is retained. The optimization implementation, matching and tie-breaking mechanics, differential and regression-test details, and additional application-delivery specifics require review against that disclosure boundary. The public site excludes earlier unsupported performance figures. Review the more detailed TOHSA stack, access-control implementation, persistence and delivery specifics before adding them. For Ariadne, review further details of the HTTP integration, independent reference data and individual authorship before extending the published account.

## Visitor handoff

`/bring-your-agent/` leads with shareable portfolio and evidence URLs, a JSON download, and an authored example of a qualified assessment for a hypothetical team. General instructions and the five example prompts are optional. Visitors supply their objectives and any job description directly to their assistant. Task selection and clipboard actions stay on the page.

The build writes the evidence package and schema before the onboarding page that links to them. The page displays the schema version and the UTC export timestamp. That timestamp records generation, rather than a review date for each claim. Set `PORTFOLIO_ORIGIN` to the public HTTP(S) origin at build time when serving the site from multiple origins. Without it, the page resolves the links and prompts against the visitor's current origin. The static HTML keeps relative links available when JavaScript is disabled. A local preview URL requires access to that preview. Visitors can attach the JSON when their assistant supports file uploads.

`/how-it-works/` explains how the site's reviewed interpretations and validated plans differ from an assistant's own conclusions. Clients can read the static package where their tools support URL retrieval. A future MCP adapter could expose the same package through a compatible client. The portfolio currently publishes static JSON and has no hosted MCP service.
