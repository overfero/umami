# Independent review corrections — fresh qualification, re-review required

Prior reviews: security ACCEPT with startup-cleanupP2; evidence REJECT twoP1.
All addressed in de1033b04 plus retained execution evidence commit. Prior all12
receipt is an observed historical exit, NOT retroactively promoted to qualified proof.
Current complete report: `evidence/slice03-review2-e1.json`; paired fresh browser
report: `evidence/slice03-review2-browser.json`; concise validation/hashes:
`evidence/slice03-review2-validation.json`.

## P1 executing verifier identity

Executed immutable imageID:
`sha256:cc36eef3f9bc243ac472c47a3e10cc77a308ee398d423c5f5fc75b19bbefb30f`.
Qualification runs thatID with networknone/nonroot/read-only/capdrop/no-new-privileges,
reads image-local bytes and compares SHA256 with accepted checkout:

| File | Equal SHA256 |
| --- | --- |
| src/lib/analyst-verifier/worker.mjs | b56520dc10f87ec9998585ec757084aa51ddafd93fde01bd3a81c41f61e9bfc1 |
| src/lib/analyst-verifier/images.mjs | a3628a5ae3641464823b588f0121a3e058b9cdea964083cd76796dc03f070935 |
| scripts/ai/verifier/container-worker.mjs | 65f7e35cb3d274a8cc16642bd1464f8746fbee4bf41264743d9b400d33ba96ec |

Current Dockerfile.verifier + build-image.sh fingerprints are retained. **Original
Dockerfile/base build correspondence is unknown**, not inferred from tag/history.
Equality succeeded so no image rebuild was necessary or claimed. Image-source
qualification is operator-controlled evidence, not independently signed provenance.
Launcher accepts host-only immutableSHA injection; no request/model image selection,
mount, network, env or privilege relaxation. Server bootstrap passes trusted setting;
fixture/B3 and Docker negative test use the qualifiedID, never the mutable tag after
inspection. Tests reject foreign mutableimage and source mismatch. All browser
commands retain their pinnedID; Docker source files/build definitions enter fingerprints.

## P1 command/report pairing

Exactly seven commandIDs required: browser-prisma, browser-build, browser-on,
browser-off, browser-compat, browser-b3, browser-notice. Each expected executable and
argument vector validated, unique IDs, successful exit and no timeout. Exactly five
browser report IDs pair with their command; retained stdout parsed and deep-equal to
retained report. Success derived from paired command, never separate commandPassed.

Controls reject removedB3command, arbitraryexit0command, duplicate commands/reports,
wrong executable/args, failed command, mismatched pair/stdout/report, wrong source,
skip and failedretry. Exact-source hashes unchanged/required. Structural consistency
is not cryptographic authenticity against an operator rewriting all evidence.

## P2 fixture cleanup

All primary/flags-off ports (including range/duplicates) validate before provisioning.
`withOwnedFixtureStartup` owns post-provision build/start/wait under finally; failed
build, missing child/start errors, or child exit reach ownership-checked cleanup.
Signal handlers stop all registered children with bounded shutdown; database cleanup
still verifies nonce/root/URL receipt plus owner marker and never legacy/public.
Tests inject build/missing-child/start failures and assert cleanup exactlyonce; failed
provision/collision doesn't drop anything. Existing real namespace collision/nonowned
cleanup canary remains passing in strict suite; fresh browser namespace cleaned.

## Executed commands / exits

All use conda umami and pinned `npx --yes pnpm@12.3.4` (Node22/Python3.12).

- Image qualification test-first missing-module **exit1** retained; new Docker+image
  test **exit0**. Original image bytes match above.
- Pairing acceptance regression **exit1**, controls after correction **exit0**.
- Startup test-first missing-module **exit1**, ownership cleanup controls **exit0**.
- Focused controls4tests and launcher7tests **exit0**; fixture app Node7tests **exit0**.
- `tsx scripts/ai/analyst-evals/browser-proof.ts /tmp/analyst-slice03/review2-browser.json`
  **exit0**, fresh build + pinnedID D2on5, D2off1, native/snapshot1, B3 1, notice1.
  All seven expected commands0, five paired browser reports exact stdout equality.
- `tsx scripts/ai/eval-analyst.ts --offline --strict --browser-receipt /tmp/analyst-slice03/review2-browser.json --output /tmp/analyst-slice03/review2-e1.json`
  **exit0**, proven1–12/pendingnone. Fresh API-PG114/API-CH114; six timezone supplements,
  three authority; evaluator35passed, product102passed/1skipped, reusable14passed.
  Skipped native Pi Vitest supplies no required evidence; D2 native Pi passed separately.
- `tsc --noEmit` **exit2**, same3unrelated baseline diagnostics EventsTable46/54 flexWrap,
  admin2fa route.test61 deep instantiation. No new changed-path diagnostic.

Full raw reports include failures/outputs/source fingerprints; post-execution hashes
rechecked.25Next+2styled-jsx excluded external traces/shared dependencies remain explicit
nonhermetic limitation for05, not hidden by startup pass. No paid/live/provider vision,
key/.env reads, deployment or production data. Fresh independent re-review before merge.
