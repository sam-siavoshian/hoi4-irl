# Going public: checklist

Everything in the repository is ready. These are the steps that can only be done in GitHub's settings,
in the order that avoids a half-finished public page.

## Before making it public

1. **Decide the design system's licence.** `vendor/design-system/` is a copy of a private package
   (`"private": true`, no licence file of its own). Once this repository is public, so is that source.
   Either add a licence file to that folder (MIT, to match the rest), or say in its README that it is
   included for building Home Front only and is not licensed for reuse.
2. **Merge the working branch into `main`.** GitHub shows the default branch's README, and the Pages
   workflow deploys from `main`.
3. **Check the first CI run is green** (Actions tab). The workflows have not run yet.
4. **Consider the name.** The repository is called `hoi4-irl`, which contains another company's
   trademark. `homefront` is safer and matches the product. GitHub redirects the old URL after a rename;
   then replace `sam-siavoshian/hoi4-irl` across the repository (README, `package.json`, `site/`,
   issue-template links).

## Repository settings (About panel, top right of the repository page)

**Description**

> Your life as a 1936 grand-strategy war map. A self-hosted life tracker and journal: say what happened today, an AI general staff judges it, and the fronts move. Works with OpenAI, Ollama or fully offline.

**Website**: `https://sam-siavoshian.github.io/hoi4-irl/`

**Topics** (GitHub allows 20; these are the ones people browse and search):

```
self-hosted  productivity  habit-tracker  life-tracker  journal  journaling
gamification  quantified-self  personal-dashboard  pwa  local-first
grand-strategy  hoi4  alternate-history  llm  openai  ollama  ai
react  nodejs
```

The first six put it in the self-hosted and productivity listings (and make it eligible for
awesome-selfhosted, under "Personal Dashboards" or "Note-taking and Editors"). `grand-strategy`, `hoi4`
and `alternate-history` reach the people most likely to share it.

**Social preview**: Settings → General → Social preview → upload `docs/img/social-preview.png`
(1280×640). This is the image shown when the link is pasted into X, Discord, Slack or iMessage.

**Features**: turn on Issues and Discussions; turn off Wiki and Projects unless you will use them.

**Pages**: Settings → Pages → Source: GitHub Actions. The `pages.yml` workflow publishes the landing
page and the offline demo.

**Security**: Settings → Code security → enable private vulnerability reporting (SECURITY.md points
people to it), Dependabot alerts and secret scanning.

## First release

Tag `v1.0.0` on `main` and publish a release whose notes are the top section of `CHANGELOG.md`. A
repository with a release, a description, topics and a social image ranks and reads far better than one
without.

## Where to post it

- Hacker News, as "Show HN: Home Front – my life as a 1936 war map (self-hosted)". Link the repository; put
  the demo link in the first comment.
- r/selfhosted (flair: Release), r/hoi4 and r/paradoxplaza (lead with the map image; say plainly that it
  is a tracker and not a mod), r/productivity, r/QuantifiedSelf.
- Open a pull request to `awesome-selfhosted` once the project is a few months old and has a release
  (their rule), and to `awesome-quantified-self`.

Lead every post with `docs/img/hero.png` or a short screen recording of one report moving a front. The
demo link matters more than any description.
