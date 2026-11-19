# Design philosophy

The three named visitor goals provide predictable starting points. A shared corpus supports multiple routes through the same evidence. Project cards support quick discovery. The experience view groups technologies, compares capabilities in a table, and provides time context. The decisions view makes rationale and tradeoffs expandable, with a dedicated case-study layout for deeper inspection.

Layout changes follow deliberate actions such as a submitted query or a goal selection. Results can be linked directly, and Back and Forward restore committed criteria. Focus moves to the results heading after navigation. An unsupported query leaves the primary navigation available and offers a way to edit the input.

The inspector shows what the application actually did. It exposes the expression and plan alongside the matched records, making identical inputs and engine outputs easy to compare.

## Editorial Spectrum

The visual system uses warm canvas, paper, and inset surfaces. Space Grotesk leads the font stack for headings, controls, and prose, with a system sans-serif fallback. IBM Plex Mono leads the stack for code and structured Inspector output. Rules and whitespace organize the screen, and a restrained heading scale leaves room for longer project titles.

Semantic CSS tokens cover text, surfaces, borders, controls, hover and focus. Category and goal selectors assign a foreground and surface color where the label carries meaning. Project topic labels carry through to comparison rows and decision details. Goal accents distinguish project, experience, and decisions views. Correction states use rose alongside the existing written feedback.

Both themes use the same component structure and breakpoints. The native theme select keeps its keyboard behavior. Visible focus and written labels carry interaction state alongside color, and short color transitions apply only when reduced motion has not been requested. Comparison tables scroll within a labeled region on narrow screens.

The font stacks currently rely on installed fonts and system fallbacks. Official WOFF2 binaries were unavailable during this refinement. When vendoring them, use a Latin subset of the Space Grotesk variable font and IBM Plex Mono Regular, include the corresponding OFL notices, and use `font-display: swap`. Allow same-origin fonts in the Pages CSP before serving font files. [Space Grotesk releases](https://github.com/floriankarsten/space-grotesk/releases) · [IBM Plex Mono](https://github.com/IBM/plex/tree/master/packages/plex-mono)
