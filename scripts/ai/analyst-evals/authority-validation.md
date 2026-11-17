# Slice02 authority defect — bounded red/green

Observed 17 November 2026, 19:32 WIB (Asia/Jakarta). Base f8d89cd3f.
`evidence/authority-revocation-red-green.json` retains exact shell exits/output and
post-fix source hashes. Fixture setup first exited1 (required Board.description);
corrected evaluator fixture, not a product defect. Actual pre-fix PG regression
then exited1: capture denied **true**, release denied **false**, capability denied
**false**, authority denied **false** after website ownership transfer. Only booleans
are logged; no pixels or capabilities are serialized. Post-fix same regression exit0.

Approved minimal fix: `deps.ts:verifierAuthority` now normalizes each referenced
saved definition and rechecks current `canViewWebsite` after analysis access.
Existing catch returns false for malformed definitions. Capture preparation had
already denied via `executeAnalysis`; this closes capability/artifact release which
need not execute. For authenticated users `canViewWebsiteSection` delegates to
`canViewWebsite`; verifier auth never accepts a share token. No invented section
permission or new task enum. Focused authority/port regression: 2 files/14 tests pass.
Their simulated launcher is protocol/security evidence, **not browser execution**.

Disposable engines were initially stopped (PG marker read exit2, connection refused).
Supervisor authorized starting only existing owned `umami-analyst-pg` postgres16-alpine
and `umami-analyst-ch` ClickHouse24.8 containers, verified loopback25432/28123 bindings
and PG marker `umami-ai-synthetic-r3`. No container/volume replacement. Prisma generated
worktree-local; dependencies symlinked read-only by convention. Each evaluator schema
`analyst_authority_<epoch>_<pid>` is dropped in finally, including failures. No mutation
to public/analyst_fixture/default-role settings. NY timezone is process-local.

Full scenario6–9 acceptance still pending additional assertions/execution. E1 strict
remains NOT PASS. No live model, browser, image inspection, deployment or spend claim.
