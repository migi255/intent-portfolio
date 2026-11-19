# Design philosophy

The three named visitor goals provide predictable starting points. A shared corpus supports multiple routes through the same evidence. Project cards support quick discovery. The experience view groups technologies, compares capabilities in a table, and provides time context. The decisions view makes rationale and tradeoffs expandable, with a dedicated case-study layout for deeper inspection.

Layout changes follow deliberate actions such as a submitted query or a goal selection. Results can be linked directly, and Back and Forward restore committed criteria. Focus moves to the results heading after navigation. An unsupported query leaves the primary navigation available and offers a way to edit the input.

The inspector shows what the application actually did. It exposes the expression and plan alongside the matched records, making identical inputs and engine outputs easy to compare.

## Editorial Spectrum

The visual system uses warm canvas, paper, and inset surfaces with a system serif for headings and a system sans-serif for controls and body copy. Rules and whitespace organize the screen. Monospace marks technology names and inspector data.

Semantic CSS tokens cover text, surfaces, borders, controls, hover and focus. Category and goal selectors assign a foreground and surface color where the label carries meaning. Project topic labels carry through to comparison rows and decision details. Goal accents distinguish project, experience, and decisions views. Correction states use rose alongside the existing written feedback.

Both themes use the same component structure and breakpoints. The native theme select keeps its keyboard behavior. Visible focus and written labels carry interaction state alongside color, and short color transitions apply only when reduced motion has not been requested. Comparison tables scroll within a labeled region on narrow screens.
