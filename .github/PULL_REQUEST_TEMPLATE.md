## What this changes

<!-- One or two sentences. Link the issue if there is one: Fixes #123 -->

## Why

## How to try it

<!-- Steps a reviewer can follow. A screenshot or short clip for anything visible. -->

## Checklist

- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes, or I explain why it was not run
- [ ] Tests added or updated for new behaviour
- [ ] No new runtime dependency in `js/` or the server; `npm run check:design` passes
- [ ] Engine changes are deterministic (no `Math.random()` or `Date.now()` inside the replay) and existing campaigns still replay sensibly
- [ ] New files the browser loads are added to `SHELL` in `sw.js` and to the server's file allowlist, and the cache name is bumped
- [ ] Docs updated (`README.md`, `docs/`, `.env.example`) and `CHANGELOG.md` has a line under Unreleased
- [ ] No secrets, personal data or `~/.homefront/` contents in the diff
