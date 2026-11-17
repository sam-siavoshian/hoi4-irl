# Going public: checklist

Everything in the repository is ready. These are the steps that can only be done by hand, in GitHub's settings
and in the search engines' tools, in the order that avoids a half-finished public page. The posts themselves, and
when to send each, are in [LAUNCH.md](LAUNCH.md).

## Before making it public

Already done in the repository: no data, keys or personal details in any file or commit; data is stored
outside the source folder; CI fails if a data or key file is committed; licence, notices, code of conduct,
security policy, contributing guide, issue templates, Dependabot and `CITATION.cff` are in place.

1. **Decide the design system's licence.** `vendor/design-system/` is a copy of a private package
   (`"private": true`, no licence file of its own). Once this repository is public, so is that source.
   Either add a licence file to that folder (MIT, to match the rest), or say in its README that it is
   included for building Home Front only and is not licensed for reuse.
2. **Merge the working branch into `main` as one squashed commit.** The branch's history carries links to
   the private sessions it was built in (they need your login to open, but there is no reason to publish
   them). A squash merge puts a single clean commit on `main`; delete the branch afterwards.
   GitHub shows the default branch's README, and the Pages workflow deploys from `main`.
3. **Check the first CI run is green** (Actions tab). The workflows have not run yet.
4. **Consider the name.** The repository is called `hoi4-irl`, which contains another company's
   trademark. `homefront` is safer and matches the product. GitHub redirects the old URL after a rename,
   but search engines and the Pages address (`<user>.github.io/<repo>/`) change with it, so rename **before**
   you submit the site to search engines or post anywhere. After a rename, replace `sam-siavoshian/hoi4-irl`
   across the repository (README, `package.json` `homepage` and `repository`, `site/Chrome.jsx`, `site/Landing.jsx`,
   `CITATION.cff`, `SKILL.md`, issue-template links); the site's canonical addresses, sitemap and llms.txt follow
   `package.json`'s `homepage` and the Pages address by themselves.

## The About panel (the gear beside "About", top right of the repository page)

**Description** (what search engines and GitHub search show; keep it under 350 characters):

> Self-hosted productivity app and daily journal that shows your life as a 1936 grand-strategy war map. Say what happened today and the front for that part of your life moves. 8 countries. Works with OpenAI, Anthropic, Gemini, Ollama or no AI at all. MIT.

**Website**: tick "Use your GitHub Pages website", or paste `https://sam-siavoshian.github.io/hoi4-irl/`.

**Topics** (20 at most). Each was checked on its GitHub topic page on 2026-11-17; the number is how many public
repositories use it then. Big topics bring browsing traffic, small exact ones make the project easy to find
among few:

```
self-hosted  productivity  habit-tracker  journal  journaling  diary  quantified-self
gamification  life-tracker  local-first  personal-dashboard  pwa  ollama  llm  openai
grand-strategy  hoi4  nodejs  react  alternate-history
```

| Topic | Repositories | Why |
|---|---|---|
| `self-hosted` | 58,512 | The self-hosting crowd browses it; the main audience. |
| `productivity` | 47,696 | The broadest fitting category. |
| `local-first` | 34,846 | True: the record is plain files on your machine. |
| `ollama` | 34,047 | Local models are a first-class option. |
| `pwa` | 33,222 | It installs to the home screen and works offline. |
| `gamification` | 3,488 | Honest: it borrows a game's pull without being a game. |
| `habit-tracker` | 2,299 | The tool people come from. |
| `journal` / `journaling` / `diary` | 2,196 / 1,037 / 1,070 | Three names for the same search. |
| `quantified-self` | 741 | The self-tracking audience. |
| `hoi4` | 259 | The people most likely to share the map. It is a trademark; the repository name has it already. |
| `personal-dashboard` | 252 | How some lists file this kind of tool. |
| `grand-strategy` | 81 | Small and exact. |
| `alternate-history` | 39 | Small and exact. |
| `life-tracker` | 37 | Small and exact; `life-tracking` (30) is the other spelling. |

`llm`, `openai`, `nodejs` and `react` were not counted; they are large and describe the stack.

**Include in the home page**: untick Releases only if there are none yet; untick Packages and Deployments.

## Social preview

Settings → General → Social preview → Edit → Upload an image → `docs/img/social-preview.png` (1280×640).
This is the picture shown when the repository's address is pasted into X, Bluesky, Mastodon, Discord, Slack,
iMessage or Hacker News readers. Without it GitHub makes a plain card with the name and the counts. (The website has
its own cards, set in each page's head, so nothing is needed for it.)

## GitHub Pages

Settings → Pages → Build and deployment → Source: **GitHub Actions**. The `pages.yml` workflow then builds
the site on every push to `main`: the landing page, the content pages, the demo, `sitemap.xml`, `robots.txt`,
`llms.txt`, `llms-full.txt` and `/skill.md`. Open the site after the first run and check the demo loads.

A custom domain later: Settings → Pages → Custom domain. Then the address in `package.json` `homepage` should
match, so the canonical addresses agree with the domain (the workflow passes the Pages address as `SITE_URL`
either way).

## Discussions

Settings → General → Features → tick **Discussions**, then "Set up discussions". Keep the default categories
(Announcements, General, Ideas, Q&A, Show and tell) and pin a first post in Announcements: what Home Front is,
the demo link, and where to ask for a country. Discussions give people who aren't filing a bug somewhere to
talk, and an active Discussions tab is part of what makes a repository look alive.

## Issues to start with

Open the "good first issue" drafts in [LAUNCH.md](LAUNCH.md#good-first-issues) before the first post, with the
labels `good first issue` and `help wanted`. GitHub lists them on
`https://github.com/sam-siavoshian/hoi4-irl/contribute`, and some newcomers search for exactly those labels.

## First release

1. Make sure `CHANGELOG.md`'s top section describes `1.0.0`, and `package.json` and `CITATION.cff` say `1.0.0`.
2. Releases (right-hand column) → **Draft a new release** → Choose a tag → type `v1.0.0` → Create new tag on
   publish, target `main`.
3. Title `v1.0.0`; paste the changelog's top section as the notes; attach nothing (people clone or use Docker).
4. Tick **Set as the latest release** → **Publish release**.

A release starts the clock for lists that require one (awesome-selfhosted asks for a first release more than
4 months old), shows a version on the repository page and lets people watch for releases only.

## Pin it

On your own profile page: **Customize your pins** → tick this repository → Save. If it lives in an
organisation, pin it on the organisation's page too (Organisation → Repositories → the pin icon, for owners).

## Search engines

Nothing tells a search engine about a new site faster than its own tools. Do these once the site is live.

**Google Search Console**

1. Open `https://search.google.com/search-console` and **Add property** → **URL prefix** →
   `https://sam-siavoshian.github.io/hoi4-irl/` (a Domain property isn't possible on `github.io`).
2. Verify with **HTML file**: download the `google….html` file it offers, put it in `site/root/` in the
   repository (create the folder; the build copies everything in it to the site's root as it is), push, wait for
   the Pages workflow, then press **Verify**.
3. **Sitemaps** → add `sitemap.xml` → Submit.
4. **URL inspection** → paste the landing page's address → **Request indexing**. Do the same for `/faq/` and
   `/countries/`.

**Bing Webmaster Tools** (Bing also feeds Copilot and DuckDuckGo's results)

1. Open `https://www.bing.com/webmasters` and sign in.
2. Easiest: **Import from Google Search Console** once Google is verified. Otherwise add the site address and
   verify with the `BingSiteAuth.xml` file, in `site/root/` as above.
3. **Sitemaps** → submit `https://sam-siavoshian.github.io/hoi4-irl/sitemap.xml`.

**AI assistants** read the same pages: `robots.txt` lets their crawlers in by name, `llms.txt` and
`llms-full.txt` summarise the product, and every page has a Markdown copy (`<page>/index.md`). There is nothing to
submit; they find it through search and links.

## After launch

- Answer every issue and discussion in the first weeks; that is what turns a visit into a star.
- Add a short "What's new" to each release; people who watch releases see it.
- When the project has a release older than 4 months, open the awesome-selfhosted pull request (the entry is in
  [LAUNCH.md](LAUNCH.md#awesome-lists)).
