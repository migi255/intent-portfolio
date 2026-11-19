---
name: symbolic-intent-engine
description: Extend or debug the controlled query vocabulary, Boolean parser, typed AST, deterministic evaluator, or ambiguity handling.
---

# Symbolic intent engine

- Add aliases to the controlled vocabulary and test them alongside the canonical terms.
- Preserve precedence and reject incomplete syntax, unknown terms, and ambiguous goals explicitly. Keep ranking language unsupported until a ranking policy exists.
- Keep evaluation independent of tokenization and rendering. Use three-valued evaluation for absent attributes so exclusion does not imply an unrecorded fact.
- Exercise precedence, grouping, malformed queries, empty matches, and repeatability using fixed data.
