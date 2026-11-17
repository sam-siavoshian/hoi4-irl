# Launch kit

Everything to post, where, when, and what to say back. Written in the project's own voice: plain, specific,
no superlatives. Each section names the rule of that place that matters most and links to where it was read.
Rules change: open the linked page again the day you post.

## First, the honest part

Views can't be manufactured. Stars follow from people seeing something they want, at a moment they can try it,
and then telling others. Nothing in this file changes that, and none of it should be gamed: no asking friends to
upvote, no extra accounts, no posting the same text everywhere on one day. Every community below bans those, and
they are the fastest way to be ignored for good.

The 3 things that matter most, in order:

1. **The first 10 seconds of the repository.** A visitor decides from the README's top, the demo loop and the
   social card. Those are done (README, `docs/img/demo.gif`, `docs/img/social-preview.png`). The demo link must
   work on a phone. Check it on yours before every post.
2. **One good Show HN.** It is the single biggest source of first visitors for a self-hosted, open-source tool,
   and the readers are exactly the people who star repositories. You get roughly one real try.
3. **Being findable afterwards.** A release, topics, Search Console and the awesome lists (see
   [PUBLISHING.md](PUBLISHING.md)) keep bringing people long after a post has scrolled away.

Everything else here is useful, and smaller.

## Before you post anything

- [ ] Every step in [PUBLISHING.md](PUBLISHING.md) up to "Search engines" is done: public, CI green, Pages live,
      description, topics, social preview, Discussions on, a `v1.1.0` release.
- [ ] The demo opens on a phone and a laptop, in light and dark: `https://sam-siavoshian.github.io/hoi4-irl/`.
- [ ] The 10 good first issues below are open, labelled `good first issue`.
- [ ] You have 2 or 3 free hours after each post to answer comments. A post with the author replying does far
      better than one without, and replies are where people decide to try it.
- [ ] You have decided, honestly, how to answer "was this written with AI?" The commit history shows an AI coding
      assistant co-wrote much of it. Say so plainly if asked; r/selfhosted asks it outright.

## The two weeks

Spread out, so each post gets your full attention and a problem found in one is fixed before the next.

| Day | Where | Why then |
|---|---|---|
| Mon, week 1 | Show HN | The widest audience first, while everything is fresh. Weekday, US morning (see below). |
| Tue | Answer HN, fix what it finds | Comments there are the best bug report you will get. |
| Wed | r/selfhosted, in that week's New Project megathread | The second core audience, after HN's fixes. |
| Thu | X, Bluesky and Mastodon thread | Gives people from HN and Reddit something to share. |
| Fri | Nothing new. Answer issues and discussions | |
| Mon, week 2 | r/hoi4 (or r/paradoxplaza) | The map-lovers. Lead with pictures. |
| Wed | r/QuantifiedSelf | The self-tracking audience. |
| Thu | Product Hunt (scheduled the week before) | Launches at midnight Pacific time and runs for the day. |
| Fri | r/productivity | Last, because it is the strictest about promotion. |
| Any time | AlternativeTo listing | A listing, not a post. |
| 4 months after the first release | awesome-selfhosted pull request | Their rule. |
| When you have 70 days on Lobsters and a friend there | Lobsters | Their rule. |

When not to post at all: a day the demo is broken; a day you can't answer comments; right after another post
that went badly (fix the cause first); and never twice to the same place within a few months.

## Show HN

**Rules that matter** ([Show HN guidelines](https://news.ycombinator.com/showhn.html),
[HN guidelines](https://news.ycombinator.com/newsguidelines.html), read 2026-11-17):

- It must be something you made that people can try, ideally with no sign-up. (The demo needs none.)
- The title starts with `Show HN:`. No capitals for emphasis, no exclamation marks, no superlatives.
- Don't ask friends to upvote or comment, and don't solicit votes anywhere. Don't delete and repost.
- Landing pages, sign-up pages and fundraisers are off topic, which is why the link is the repository and the demo
  goes in the first comment.

**When**: HN has no official best time. The common practice is a weekday morning, US Eastern time, when the
most readers are on and the "show" page moves slowest. Treat that as a convention, not a rule.

**URL**: `https://github.com/sam-siavoshian/hoi4-irl`

**Title** (75 characters):

```
Show HN: Home Front – a self-hosted journal that draws your life as a war map
```

**First comment** (post it right after submitting):

```
Hi HN. Home Front is a daily journal for people who gave up on habit trackers.

You say one or two sentences about your day ("Aced the calculus retake. Skipped the gym
again."). A model, or a built-in keyword judge if you have no key, splits it into events
and files each one: which part of your life, win or loss, a size from 1 to 5, and the
reason. Then it draws the result on a 1936 map of a country, where each of 7 borders is
one part of your life. School going well pushes that front outward. Health neglected for
two weeks lets the enemy mass on it.

Demo, no sign-up, runs in your browser with the offline judge:
https://sam-siavoshian.github.io/hoi4-irl/

Some details that might interest people here:

- The engine is a pure function: state = simulate(map, reports, now). Every view is a
  replay of your list of entries, so editing an old entry rewinds history correctly and
  two devices with the same entries always agree.
- The judge has to state the reason before it picks a battle type, and each of the ~29
  types is tied to a real-life meaning (illness is "harsh conditions", self-sabotage is
  "sabotage", help from a friend is "close air support").
- Self-hosted, one user, one password. Node 20, no runtime dependencies on the server.
  Your key stays on the server. Data is a folder of plain files.
- Any provider on your own key (OpenAI, Anthropic, Gemini, Groq, Mistral, OpenRouter),
  local models through Ollama or LM Studio, or no model at all.
- 8 countries (Iran, Turkey, Greece, France, Ethiopia, Siam, Peru, Mexico), each with
  its own fronts, army, navy and empire to restore. A country is one scenario file.

It isn't a game: nothing moves unless you report something real. Happy to answer
questions, and I'd like to hear where the judging gets things wrong.
```

**Media**: none (HN is text). The README's demo loop does the work once they click.

## Reddit

Reddit's own pages could not be read from here (they refuse automated readers), so each subreddit's current
rules below come from search results and secondary sources and are marked **unverified**. Read the sidebar and
the pinned posts of each subreddit on the day, and follow them over anything written here.

Site-wide, Reddit's self-promotion guidance asks that your own content be a small part of what you post. Comment
in a subreddit for a while before posting your own project there.

### r/selfhosted

**Rule that matters** (unverified, from a moderator update reported in search results for 2026): new projects go
in a **weekly "New Project" megathread** opened each Friday; standalone project posts are removed and pointed
there. You don't have to wait for Friday to comment in the current one. The suggested comment template has a
project name and an **AI involvement** field. Answer it honestly.

**Where**: a top-level comment in the current New Project megathread.

**Body**:

```
Project name: Home Front
Repo: https://github.com/sam-siavoshian/hoi4-irl
Demo (static, offline judge, no sign-up): https://sam-siavoshian.github.io/hoi4-irl/
License: MIT
AI involvement: [say it plainly: written with an AI coding assistant, reviewed and tested by me; the app
itself can use your own model, a local one through Ollama or LM Studio, or none]

What it is: a self-hosted daily journal and life tracker. You say a sentence about your
day, it files a dated entry, and the front for that part of your life moves on a 1936 map.

Self-hosting details:
- One Node 20 server, no runtime dependencies, or the Docker image (node:22-alpine,
  non-root, health check, data in a named volume, port bound to loopback by default).
- One user, one password. API key stays on the server and never reaches the browser.
  Every response is noindex and its robots.txt disallows everything.
- Data is a folder of plain JSON files: state, an append-only journal, daily backups.
- Works fully offline with no key (keyword judge), or with Ollama / LM Studio so nothing
  leaves the machine. Hosted providers on your own key if you prefer.
- Runs fine on a Raspberry Pi 4 or 5 (use a networked model, not one on the Pi).
- Installs to the phone's home screen over HTTPS; the docs show Tailscale serve for that.
- There's a SKILL.md your coding agent can follow to set it up end to end.

What I'd like feedback on: the Docker setup, and whether the judge files your kind of day well.
```

**Media**: none in a comment. The links carry the pictures.

### r/hoi4 (or r/paradoxplaza)

**Rules that matter** (unverified): both are about the games themselves. Expect a self-promotion limit and,
on r/hoi4, a rule that image posts need an explanation from the poster ("R5"). A project that isn't a mod may be
removed as off topic, so read the rules and, if in doubt, message the moderators first and ask. Choose one of the
two, not both.

**Title**:

```
I made a journal that shows my life as a 1936 map: each border is a part of my life, and it moves when I report my day
```

**Body** (posted as an image post with this as the explanation, or as a text post with the GIF linked):

```
Not a mod. It's a separate, free, open-source app, inspired by Hearts of Iron IV and not
affiliated with Paradox.

Each of the 7 borders of your country stands for one part of your life (school, work,
family, health...). You say what happened today and it becomes a battle: a big win at
work is an armoured breakthrough, a week of flu is harsh conditions, staying up all night
before an exam is sabotage. Fronts move province by province, divisions earn honours,
and taking every objective restores the country's old empire.

8 countries: Iran (Achaemenid), Turkey (Ottoman), Greece (Byzantine), France (Napoleon's
empire), Ethiopia (Aksum), Siam, Peru (Tawantinsuyu) and Mexico (the 1821 empire). The
aggressors of the period are left out on purpose.

Demo in the browser, no sign-up: https://sam-siavoshian.github.io/hoi4-irl/
Code: https://github.com/sam-siavoshian/hoi4-irl

Which country should be next?
```

**Media**: `docs/img/countries.png` (all 8 maps) as the image, or `docs/img/demo.gif`.

### r/QuantifiedSelf

**Rule that matters** (unverified): app posts appear there, but the community is about tracking itself.
Lead with the method and what you learned, not the product.

**Title**:

```
Tracking 7 areas of life from one sentence a day: what I learned building a "front line" view instead of charts
```

**Body**:

```
I wanted one picture of how every part of my life was going, without forms or tags. The
input is one or two sentences a day. Each event is classified into one of 7 areas, win or
loss, and a size from 1 to 5 (most days are 1-3; 5 is rare: a breakup, funding closed, a
death). The output is a position per area that moves with each event and drifts when you
stop reporting on it.

Things that worked better than I expected:
- Free text catches the unplanned things a checklist misses (an argument, a good evening).
- Neglect becomes visible: an area you haven't mentioned in 10 days gets a warning.
- The balance between areas is the useful signal, not any single number.

Things it doesn't do: no device data, no exact measurements, no export to other tools
yet (JSON export only).

It's open source and self-hosted, and it draws the result as a 1936 war map, which is
either the point or a reason to skip it:
https://github.com/sam-siavoshian/hoi4-irl (demo: https://sam-siavoshian.github.io/hoi4-irl/)

How do you track the areas no device measures?
```

**Media**: `docs/img/history.png` (the calendar and entries) or `docs/img/map.png`.

### r/productivity

**Rule that matters** (unverified): among the strictest about promotion; app links may only be allowed in a
designated thread, or not at all. Check the sidebar and the pinned posts. If links aren't allowed, post the idea
without a link and answer a direct request for it in a reply, or skip this subreddit.

**Title**:

```
I stopped using a habit tracker and started writing one sentence a day. Here's the system that stuck.
```

**Body**:

```
Habit trackers failed me the same way every time: the boxes didn't match what actually
happened, and one missed day broke the chain and the motivation with it.

What stuck instead:
1. One or two sentences at the end of the day, about anything that happened.
2. Each thing is filed under one of 7 areas (school, family, partner, work, health,
   friends, self), as a win or a loss, sized 1 to 5.
3. Once a week, look at which area is gaining and which is losing ground, and which one
   you haven't mentioned at all. That last one is usually the problem.

The weekly look is the part that changes behaviour. The daily sentence just makes it
possible.

I built a free, open-source tool that does the filing and draws it as a map, but the
method works on paper too. [link only if the rules allow it]
```

**Media**: none, or `docs/img/report.png` if images are allowed.

## Lobsters

**Rules that matter** ([about](https://lobste.rs/about), read 2026-11-17): invitation only. New users can't submit
self-promotion in their first 70 days, and self-promotion should be under a quarter of your stories and comments.
The `show` tag isn't available to new users. If you aren't already a member in good standing, skip Lobsters; if
someone else posts it, thank them.

**Title**: `Home Front: a self-hosted journal drawn as a 1936 war map, with a replay engine`
**Tags**: `show`, `javascript`, `selfhosted` (pick from the tags offered that day).

## X, Bluesky and Mastodon

One thread, the same on all three. Post the GIF as a native video (`docs/img/demo.mp4`) on the first post, not a link.

```
1/ I made a daily journal that draws your life as a 1936 war map. Each border is a part of
your life. Say what happened today and that front moves. Open source, self-hosted.
[demo.mp4]

2/ "Aced the calculus retake. Skipped the gym again." becomes two events: a counter-attack
on the School front and a small loss on Health. The judge has to give the reason before
it picks the battle type.

3/ It runs on your own machine: one Node server, one password, your data in plain files.
Use your own key for OpenAI, Anthropic, Gemini and others, a local model in Ollama, or no
AI at all.

4/ 8 countries, each with 7 fronts and an empire to restore: Iran, Turkey, Greece, France,
Ethiopia, Siam, Peru, Mexico. [countries.png]

5/ Try it in the browser, no sign-up: https://sam-siavoshian.github.io/hoi4-irl/
Code (MIT): https://github.com/sam-siavoshian/hoi4-irl
```

On Mastodon, add `#SelfHosted #OpenSource #QuantifiedSelf` to the last post (hashtags are how posts are found
there); on Bluesky and X, no hashtags.

## Product Hunt

**Rules that matter** ([build your product page](https://help.producthunt.com/en/articles/17834537-4-build-your-product-page),
[promotion and what to avoid](https://help.producthunt.com/en/articles/17734384-5-how-to-promote-your-launch-and-what-to-avoid),
read 2026-11-17): name up to 40 characters, tagline up to 60 with no "the best" or "#1", description up to 500,
gallery images 1270×760 recommended, up to 3 launch tags, a 240×240 logo. Never ask for upvotes; no giveaways tied
to upvotes; no extra accounts. Launches go live at midnight Pacific time; schedule up to 30 days ahead, complete.

**Name**: `Home Front`

**Tagline** (51 characters): `A self-hosted daily journal drawn as a 1936 war map`

**Description** (248 characters):

```
Say what happened today in a sentence. Home Front files it under one of 7 parts of your life, and that border of
your country moves on a 1936 map. Open source, self-hosted, 8 countries. Use any AI provider, a local model or none.
```

**Launch tags**: Productivity, Open Source, Journaling (or the closest offered).
**Pricing**: Free.
**Links**: the repository; the demo as the product link.
**Gallery** (make 1270×760 crops): the demo loop (video), `docs/img/hero.png`, `docs/img/countries.png`,
`docs/img/report.png`, `docs/img/providers.png`.

**Maker comment**:

```
Hi Product Hunt. I made Home Front because every habit tracker I tried failed the same
way: the boxes never matched my actual day.

Here the whole input is a sentence or two. It files each event (which part of your life,
win or loss, how big, why) and draws the result on a 1936 map, where each of 7 borders is
one part of your life. One look shows which part is advancing and which you've neglected.

Who it's for: people juggling school, work, family and health who want to see the balance;
people who like strategy maps; people who want their journal on their own machine.

What's different: it's self-hosted and open source (MIT), your record is plain files, and
it works with your own AI key, a local model, or no AI at all.

The demo runs in your browser with no sign-up. I'd like to know: does the map make the
balance of your week clearer than a chart would?
```

## A 30-second demo video

For Product Hunt, X and a README link. Screen recording of the real app, dark theme, no music needed; captions
burned in, since most people watch muted.

| Time | Picture | Caption |
|---|---|---|
| 0–3 s | The map of France, still | Your life as a 1936 war map. |
| 3–8 s | Tap the microphone, type: "Aced the retake. Skipped the gym again." Send | Say what happened today. |
| 8–14 s | The map turns to the School front; the line advances; a counter-attack plays | It files each event and the front moves. |
| 14–18 s | Health front: a small loss | Wins push out. Neglect lets the enemy in. |
| 18–23 s | The country picker: Mexico, Siam, Peru | 8 countries, 7 fronts each. |
| 23–27 s | Settings, General staff: provider tiles, "Offline judge" | Your own AI key, a local model, or none. |
| 27–30 s | The repository page | Open source and self-hosted. Link below. |

## Awesome lists

### awesome-selfhosted

**Rules that matter** ([CONTRIBUTING](https://github.com/awesome-selfhosted/awesome-selfhosted-data/blob/master/CONTRIBUTING.md),
[addition template](https://github.com/awesome-selfhosted/awesome-selfhosted-data/blob/master/.github/ISSUE_TEMPLATE/addition.md),
read 2026-11-17): the software must have **tagged releases, the first one more than 4 months old**; it must be
free and open source; one YAML file per project in `software/`, opened as a pull request against
`awesome-selfhosted/awesome-selfhosted-data` (not the generated list); description under 250 characters, sentence
case, without "open-source", "free" or "self-hosted". Software unmaintained for 6–12 months may be removed.

**File**: `software/home-front.yml`. Copy the tag names exactly from the files in `tags/` (`personal-dashboards.yml`
and `health-and-fitness.yml` are the closest; the first tag decides where it appears).

```yaml
name: "Home Front"
website_url: "https://sam-siavoshian.github.io/hoi4-irl/"
source_code_url: "https://github.com/sam-siavoshian/hoi4-irl"
description: "Daily journal and life tracker that files each entry into one of 7 areas of your life and shows them as the fronts of a 1936 war map. Works with your own AI provider, a local model or a built-in offline judge."
licenses:
  - MIT
platforms:
  - Nodejs
  - Docker
tags:
  - Personal Dashboards
  - Health and Fitness
demo_url: "https://sam-siavoshian.github.io/hoi4-irl/demo/?demo=1"
```

`depends_3rdparty` is left out (false): no third-party service is needed, since the offline judge and local
models work without one.

### awesome-quantified-self

**Rules that matter** ([README](https://github.com/woop/awesome-quantified-self), read 2026-11-17): additions by
pull request, or an issue to discuss first. Entries are `- [Name](URL) - Description (platforms).` The closest
section is **Applications and Platforms → Habits** (journaling apps sit under Mood).

```markdown
- [Home Front](https://github.com/sam-siavoshian/hoi4-irl) - Self-hosted daily journal that files each entry into one of 7 life areas and shows their balance as a map (Web, self-hosted).
```

## Directories

### AlternativeTo

**Rules that matter** ([FAQ](https://alternativeto.net/faq/), read 2026-11-17): anyone with a verified email can
suggest an app; it must be released, in English and available across Europe or the USA; one entry per product; no
links, emails or addresses in the description; a square icon at least 280×280 with a transparent background.
Review is slow unless you pay for priority, which does not guarantee approval. Developers may ask for developer
access to their app's page. List it as an alternative only to apps whose main task matches: habit trackers and
journal apps where you honestly think it fits.

**Description**:

```
Home Front is a self-hosted daily journal and life tracker. You say what happened today in a sentence or two, and
each event is filed under one of 7 parts of your life as a win or a loss. The result is drawn as a 1936 war map,
where each border is one part of your life. Open source (MIT). Works with your own AI provider key, a local model,
or a built-in offline judge.
```

**Tags**: journal, habit-tracker, self-hosted, productivity, life-tracker. **Platforms**: Self-Hosted, Web,
iPhone and Android (as a home-screen web app), Docker.

### OpenSourceAlternative.to

**Rules that matter** ([submit](https://www.opensourcealternative.to/submit), read 2026-11-17): open source, an
alternative to a proprietary product, actively maintained, self-hosted. The form asks you to name the proprietary
product it replaces. Free submissions wait in a long queue (6 months or more, by their page); a paid fast review
exists. Name a product only if the comparison is fair, and use the AlternativeTo description above.

## Good first issues

Open these before the first post. Each is real, scoped and points to the file to start from. Labels:
`good first issue`, `help wanted`.

1. **Add a persona preset for caregivers**
   Personas set the names of the 7 fronts on first run (`js/presets.js`, see `P('parent', …)`). A caregiver's week
   is split between the person they look after, work, their own health and little else. Add a `caregiver` preset
   with 7 front names and a one-line description in the same voice. Done when it shows on first run and in
   Settings, and `npm test` passes.

2. **Offline judge: keywords for one more language**
   With no AI key, `js/classify.js` routes text to fronts by keyword lists (see the `personal:` list near line 128).
   Add lists for one language you speak (Spanish, French, Persian, Turkish, Greek…), behind a language check, with
   a test in `tests/classify.test.mjs` for 5 example sentences.

3. **List the interface's strings in one place, as a first step to translations**
   Translations are on the roadmap. Before any language is added, the strings in `src/` need to live in one module.
   Move the strings of one sheet (History is a good start) into `src/strings.js` and use them from there. No
   behaviour changes.

4. **Docs: running Home Front on a Synology or Unraid NAS**
   `docs/SELF_HOSTING.md` covers Docker in general. Write a short section for one NAS: where the compose file goes,
   how to map the data volume, and how to reach it over HTTPS. Test it on your own NAS.

5. **Docs: filing an entry from Android with Tasker or HTTP Shortcuts**
   `docs/API.md` has an iOS Shortcuts recipe for `POST /api/report`. Add the Android equivalent, tested.

6. **Provider marks: check whether OpenAI's or Groq's logo may be shown**
   OpenAI and Groq wear a plain icon on the provider tiles because neither mark is in Simple Icons and Groq's policy
   doesn't allow it without a licence (README, Configuration). Find each company's current brand guidelines and
   report, with links, whether an app that lets users pick the provider may show the mark. No logo changes in this
   issue.

7. **A text summary of the map for screen readers**
   The map is a canvas. Add a visually hidden live summary to the map view ("School: 3 provinces past the border,
   advancing. Health: 2 provinces lost.") from the engine's state (`js/engine.js` → `st.fronts`). Done when VoiceOver
   or NVDA reads it.

8. **Import a plain-text journal**
   On the roadmap: import from plain-text journals. Start small: a script in `tools/` that reads a file of
   `YYYY-MM-DD: text` lines and posts each to `/api/report` with its date (see `docs/API.md`). Document it.

9. **A country: research notes for Brazil in 1936**
   A country is one file in `tools/scenarios/` (`docs/SCENARIOS.md`). Before code, write up a proposal in the issue:
   the 7 fronts (neighbour or sea), each front's objectives, the empire to restore, and the honest approximations
   modern borders force. The scenario can follow in another pull request.

10. **Make the weekly recap card readable at 390 px wide**
    Check the weekly recap share image on a narrow phone and fix anything cut or crowded, using the design system's
    components only (`npx sam-design-check src`). Attach before and after pictures.

## Reply bank

Short, true answers to the comments that will come. Adjust to the person; never paste one unchanged into a thread.

**"Is this a mod?"**
No. It's a separate app with its own engine, map and art, and it doesn't touch any game. It's inspired by
grand-strategy games and not affiliated with Paradox.

**"Doesn't this glorify war?"**
It's a metaphor for a life, and the judge is told exactly that. The setting is historical, the opponents are 1936
states, no real conflict is simulated, and the aggressor states of the period are left out on purpose. If the
framing isn't for you, that's a fair reason to pass on it.

**"Why not just use a habit tracker?"**
If you want one unbroken chain for one habit, a habit tracker is better. This is for the stuff that doesn't fit
boxes: one sentence about your day, filed into 7 areas, so you see the balance between them and the one you've
been ignoring.

**"What about privacy? You're sending my diary to OpenAI?"**
Only if you choose OpenAI. It runs on your machine; the key stays on your server; there's no telemetry. With a
local model in Ollama or LM Studio, or the offline judge, nothing leaves the machine at all.

**"Was this written by AI?"**
Answer as it is. The commit history shows an AI coding assistant co-wrote much of the code, with tests and
review. Say which parts you checked yourself.

**"How much does it cost?"**
Nothing to run with a local model or the offline judge. With a hosted provider, one short request per entry on
its small model: cents a month for one person.

**"Why these countries? Why not Germany / Britain / Japan?"**
Each country needs 7 distinct borders and a historical empire as the far goal, and the aggressors of the period
are left out on purpose. A country is one scenario file; issue #9 shows how to propose one.

**"Does it work offline / on my phone?"**
Yes. It installs to the home screen over HTTPS and takes entries offline; they sync when you're back. The offline
judge works with no network at all.

**"Can my partner and I share it?"**
One server is one campaign behind one password. Run one instance each; Docker makes that two lines.

**"The name has a trademark in it."**
The repository's name, yes; the product is called Home Front and the site doesn't use the game's name. [Rename the
repository before launch if you can; see PUBLISHING.md.]

**"It judged my day wrong."**
Thanks: what did you write, and what did you expect? Undo is one tap, and a one-line description per front in
Settings makes the judge much better. Wrong judgements with the text are the most useful bug reports.

## What was checked, and what wasn't

Read on 2026-11-17 at the source:

- Show HN guidelines: https://news.ycombinator.com/showhn.html
- HN guidelines: https://news.ycombinator.com/newsguidelines.html
- Lobsters: https://lobste.rs/about
- Product Hunt: https://help.producthunt.com/en/articles/17834537-4-build-your-product-page and
  https://help.producthunt.com/en/articles/17734384-5-how-to-promote-your-launch-and-what-to-avoid
- awesome-selfhosted: https://github.com/awesome-selfhosted/awesome-selfhosted-data/blob/master/CONTRIBUTING.md and the
  addition template; tag and platform file names from the repository's `tags/` and `platforms/` folders
- awesome-quantified-self: https://github.com/woop/awesome-quantified-self
- AlternativeTo: https://alternativeto.net/faq/
- OpenSourceAlternative.to: https://www.opensourcealternative.to/submit

Not verified (Reddit refuses automated readers): the current rules of r/selfhosted (the weekly New Project
megathread and its AI-involvement field come from search results describing a 2026 moderator update), r/hoi4,
r/paradoxplaza, r/productivity and r/QuantifiedSelf. HN's best posting time has no official source.
