# Notes for coding agents

- **Setting this up for someone** (install, self-host, service, HTTPS, backups, updates): follow
  `SKILL.md` at the repository root (the same file is at `.claude/skills/setup-home-front/SKILL.md`). It is
  self-contained and written for any agent.
- **Changing the code**: read `CONTRIBUTING.md` and `docs/ARCHITECTURE.md` first. The interface in `src/`
  uses only the components in `vendor/design-system`; `npm run check:design` enforces it.
- **Never** commit `.env`, a data folder (`~/.homefront`, `./private`), or anything that looks like a key.
  Never print a secret. CI fails on both.
- **Tests**: `npm test`, then `npm run test:e2e` for anything that touches the interface or the server.
