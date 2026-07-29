# Animation improvement plans

| Plan | Title | Severity | Status |
|---|---|---:|---|
| 001 | Use transform motion and preserve reduced-motion feedback | High | DONE |
| 002 | Animate session progress with transform | High | DONE |
| 003 | Gate hover motion and add press feedback | Medium | DONE |
| 004 | Choreograph topic and question changes | Low | DONE |
| 005 | Make content swaps responsive and interruptible | High | DONE |
| 006 | Remove collection-wide layout animation work | Medium | DONE |
| 007 | Keep repeated feedback on the compositor | Medium | DONE |

Executed previously in order: 001 → 002 → 003 → 004.

Plan 001 establishes the shared tokens and reduced-motion behavior required by every later plan. Plan 002 is independent after those tokens exist. Plan 003 depends on the same press and easing tokens. Plan 004 should be applied last so its choreography uses the final motion vocabulary.

Executed in order: 005 → 006 → 007. Plan 005 defines the responsive swap
timings used by result-state changes. Plans 006 and 007 remove repeated layout
and paint work while retaining accessible feedback.
