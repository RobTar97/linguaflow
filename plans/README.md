# Animation improvement plans

| Plan | Title | Severity | Status |
|---|---|---:|---|
| 001 | Use transform motion and preserve reduced-motion feedback | High | DONE |
| 002 | Animate session progress with transform | High | DONE |
| 003 | Gate hover motion and add press feedback | Medium | DONE |
| 004 | Choreograph topic and question changes | Low | DONE |

Executed in order: 001 → 002 → 003 → 004.

Plan 001 establishes the shared tokens and reduced-motion behavior required by every later plan. Plan 002 is independent after those tokens exist. Plan 003 depends on the same press and easing tokens. Plan 004 should be applied last so its choreography uses the final motion vocabulary.
