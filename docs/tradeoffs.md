# Tradeoffs

| Decision | Benefit | Cost |
| --- | --- | --- |
| Controlled vocabulary and grammar | Deterministic results and explainable failures | Aliases and supported phrasing need deliberate maintenance |
| Exact predicates and source order | Predictable filtering and simple tests | Relevance ranking is outside the first milestone |
| Three-valued evaluation | Missing data cannot become a positive factual claim through negation | Incomplete records can yield fewer matches |
| Closed component registry | Plans remain serializable, testable, and bounded | New layouts require implementation in the registry |
| Shared content records | Claims and descriptions have one source across views | Every public record needs review before publication |
| Static browser-first delivery | Core interactions work without an API or backend | The initial download carries the small demonstration corpus |
