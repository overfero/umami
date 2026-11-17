# Slice 05 review corrections — candidate, rereview required

Recorded 2026-11-18 04:22 WIB. Addresses independent REJECT of `8d33f3e3e` (P1 request bodies; P2 qualifier; P2 packaging claim). No route/runtime/DB/widget/cleanup/CI implementation changed.

## P1: assistant contracts

Read installed Next16 route-handler guide and actual re-exported handlers/Interaction validation/stream response before edits. Added a curated contract for four existing public operations: optional create title, required rename title, turn message/context, and discriminated confirmation/question replies. Regenerated OpenAPI and client together; no generated-only patch. Turn success is `text/event-stream` string frames, not JSON; the existing client returns raw text (buffered), not a parsed streaming iterator. JSON error responses are separate. No fake JSON result or new streaming client abstraction.

Public transport regression first failed because all fields became query parameters/body undefined. After contract generation, create/rename/turn/both reply variants send JSON body, path-only chatId, no query fields; explicit SSE transport test preserves wire text. Contract test checks JSON requests and SSE-only success. Existing166 operation definitions and320 interface members from integration base remain exact; only these four newly added assistant operations change. Spec198/198 now183 explicit/15 inferred; client185.

## P2: strict qualification

Preserved preexisting dirty qualifier formatter changes after inspection. Replaced trust in `receipt.evidence` with `qualifyStrictReceipt`: exact ordered fourteen-command inventory, exit/timezone checks, API completion parser, every supplement/authority stdout assertion matched to its EVIDENCE payload across required timezones, retained evaluator/product/authority report-command-output-path associations, existing exact-source assertion parsers, and seven browser command/stdout/report pairs. Required assertion source fingerprints and immutable verifier hashes checked. Supplied coverage cannot prove anything.

Tests reject absent evaluator/product/authority reports, incomplete/arbitrary/failed commands, arbitrary coverage output, mismatched report stdout, swapped reports, wrong source, missing/changed source fingerprints, mismatched browser stdout and mutable image identity. Expected missing-module test-first red retained, final two adversarial tests pass. No silent acceptance skip.

Vitest stdout in original execution contains only the report path, not report bytes. Qualification binds exact command/path/report source/assertions; it cannot cryptographically authenticate operator-controlled report contents. This limitation remains explicit.

Historical evidence is qualified against **git objects at recorded source revision4a8d2e45f**, not current modified source. `review-qualification.json` is a separate supplement: original browser/E1/package/qualification receipts and their execution timestamps/revisions are untouched. Current changed fingerprints are listed. No claim of fresh current-source full E1. Qualifier re-executes pinned verifier byte equality and reconstructs all twelve historical groups.

## P2: packaging claim

Documentation/progress now says **dashboard application-shell HTML response**, not authenticated dashboard/user-content SSR. Actual authenticated API login, persisted analysis execution42 and package symlink closure remain independently proved by original package smoke. No stronger browser-content claim introduced.

## Fresh targeted validation

All use conda umami, pnpm12.3.4; bounded timeouts. Supplemental exact command/output/exits/source hashes in `evidence/slice05/review-supplement.json`.

- Client TDD red exit1; after generation workspace package tests exit0: APIclient25, MCP27.
- Qualifier TDD red exit1; final controls exit0: two tests with all adversarial mutations; existing browser/lifecycle controls also pass (combined5).
- Curated contract test exit0 (1).
- Actual assistant handlers plus MCP route tests exit0 (27).
- `build:openapi`, `build:packages`, `tsc --noEmit`, `openapi:check`, `check:api:client`, old-member comparison and diff hygiene exit0.
- Historical strengthened qualification exit0. No expensive real-engine/browser rebuild repeated: only build-time OpenAPI contract/client metadata, tests and evidence qualifier changed; runtime handlers/transport/DB/renderers/dependency graph are unchanged. Original full runs stay historical; targeted public-client transport supplements corrected contract behavior.

Independent rereview required before merge. No paid/model/provider/vision calls, credentials/env reads, production target actions, main edits or push. No later slice started.
