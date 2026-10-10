# AgentFence Development Rules

1. Read docs/product-spec.md before coding.
2. Build one milestone at a time.
3. v0.1 has no backend.
4. Keep all user data local.
5. Never send page text, clipboard text or browsing history to an external server.
6. Never store raw clipboard contents in history.
7. Use deterministic policy evaluation.
8. Use minimum Chrome permissions.
9. Prefer optional host permissions.
10. Do not request <all_urls> as an install-time permission unless technically unavoidable.
11. Do not use remote executable code.
12. Do not require an LLM.
13. Never claim AgentFence observes actions it cannot technically observe.
14. If a block cannot be guaranteed, show a warning rather than claiming success.
15. Every core feature requires automated tests.
16. Security-sensitive changes must update docs/threat-model.md when appropriate.
17. The demo must use only synthetic information.
18. Do not add unrelated architecture.
19. Keep main runnable.
20. At the end of each task, report files changed, commands run, tests, limitations and manual verification.
