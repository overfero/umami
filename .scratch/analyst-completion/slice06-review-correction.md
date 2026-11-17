# Slice06 review correction: root build-input binding

**Fresh independent review mandatory before merge.** P1 from review artifact `22c578a4-dc2d-47de-acde-f59ce09f9156_reviewer_output.md` corrected in **5cd514d5a527b499b71d365a265547fb34094d41**. Original candidate `d8544e402` remains rejected/historical, not retroactively accepted. No production request, credential inspection, provider call, deployment, later-slice work or main/push action.

## Narrow fix / root audit

`analyst-contract.ts` now explicitly fingerprints the tracked root build/package/deployment inputs: existing Dockerfile/package/lock/workspace/Next/TypeScript plus `.dockerignore`, `postcss.config.js`, `prisma.config.ts`, `biome.json`, both Rollup configs, `tsup.config.js`, `package.components.json`, `netlify.toml`, `vercel.json`, `app.json`, `docker-compose.yml`.

PostCSS transforms application CSS; Prisma configuration selects migration/generation datasource. Rollup produces public tracker/recorder files; Biome formats build-generated tracker/API output; tsup/component package metadata govern component packaging. Docker ignore controls build context, and hosting/compose descriptors govern install/start/package deployment. Existing selected source/scripts/package directories remain unchanged. Test-only Vitest/Playwright/compose-test configuration, docs, licenses, ignore/editor/orchestration files are not release-build inputs. No broad root glob or `.env` reading/import added. Config files are fingerprinted as bytes, not executed. Final source file opens reject symlinks and nonregular inputs (including directories) before hashing.

The preexisting dirty contract delta was inspected and preserved: only Biome's equivalent character-class escape normalization in duplicate-key token scanning. No change to accepted approval/network/auth/ingest/ownership/vision contracts.

## Public-boundary TDD

New `release-analyst-smoke.source.test.ts` clones only tracked source into its own disposable checkout, uses dependencies read-only, and supplies a manifest qualified against that checkout. The unchanged manifest first reaches the local heartbeat (positive authority control), then each root input is changed independently with HEAD and approved old map unchanged. Each mutated input must yield **guard-rejected and zero target requests**. Explicit PostCSS and Prisma controls included. Directory and byte-identical final-symlink replacements are also rejected. Test writes only its disposable checkout; no existing root config or `.env` is copied/read.

- Initial red: exit **1**,9 passed/13 failed (12 child failures plus parent). PostCSS/Prisma and other omitted config cases wrongly reached runtime heartbeat, reproducing P1. This is expected behavioral red, not infrastructure failure. That first matrix preceded adding the app/compose descriptors to the audited list.
- Green before commit: exit **0**,24 passed,0 skipped (21 root inputs +2 unsafe-source controls + parent).
- Fresh committed-source combined run: exit **0**,66 passed,0 skipped (42 original CLI +24 source regression).

## Fresh supplement, not rewritten historical receipts

All fresh executions use **Node22.23.5** from conda `umami`, pinned pnpm12.3.4, at correction execution revision **5cd514d5a527b499b71d365a265547fb34094d41**. Existing dependencies/generated outputs reused without changes. No setup failure/recovery. Exact logs/exits/new map are in `.scratch/analyst-ci-debug/slice06-review/`; original `.scratch/analyst-ci-debug/slice06/` remains byte-identical to d8544e402 (`git diff --exit-code` exit0). Initial red log is retained losslessly gzip-compressed to avoid changing whitespace in assertion output; final logs retain exact bytes.

| Exact command (conda bin first on PATH) | Exit / result |
| --- | --- |
| `node --import tsx --test scripts/ai/release-smoke/release-analyst-smoke.source.test.ts` | 1 expected red, then0 green24 |
| `node --import tsx --test scripts/ai/release-smoke/release-analyst-smoke.test.ts scripts/ai/release-smoke/release-analyst-smoke.source.test.ts` | **0**,66 passed,0 skipped |
| `PG_BIN=/home/overfero/miniconda3/envs/umami/bin node --import tsx --test scripts/ai/release-smoke/release-analyst-smoke.app.test.ts` | **0**,1 passed,0 skipped;26.37s; real Next handlers +unique marker-owned PG namespace, ingest200/200 plus2 stored events,401/401, owned cleanup |
| `npx --yes pnpm@12.3.4 exec tsc --noEmit` | **0**,fresh I1 |
| `npx --yes pnpm@12.3.4 openapi:check` | **0**,198/198 operations183 explicit/15 inferred |
| `npx --yes pnpm@12.3.4 check:api:client` | **0**,185 operations up to date |
| `git diff --check d8544e402 HEAD` | **0**,correction hygiene |
| `git -c commit.gpgsign=false merge analyst-completion` | **0**,already up to date; ref verified23812fb0e70ae950d45c56e63976f28d9917af6d |

Fresh source map: **1940 files**, ordered map SHA256 `23cf83f320cdeb252dff68e7fa78e8f45f00bdca64b4aba165f2ce9ef3f900a4`.

- Contract source SHA256: `0a4b6ac8e8b9e98487ecc03fdb7e16f8ce7f1875fada5ab8da29263a79f7b748`
- `cli-source.log`: `24411a3555f3265725fa3675ae236307c48a470e766cfffd61f6c7ab290cc077`
- `app.log`: `b08e0efbb203fc087c0cc2aec093a5085ae1f3af6faaeded65c6718d2bacc2ca`
- `source.json`: `f71d773a88b2324b8125fabd7379c0dd8decd471e1e1b68e351eb8fea389f079`

Only source/config fingerprinting has changed. All image/build/verifier records used in local tests remain invented protocol-only facts, not actual deployed identity/verifier/provider qualification. Real-app test proves local ingestion/storage only. Explicit unsigned operator attestation remains the deployment trust boundary. Actual-target I3, qualified actual-provider vision,07 paid evaluation, hosted CI/full deployment/rollback and08 release remain pending. No approval for any production action is implied. Unsigned per-command commits, hooks intact; final index/worktree must be clean and fresh independent review accepted before integration merge.
