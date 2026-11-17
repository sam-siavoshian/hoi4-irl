# HTTP API

The server exposes two groups of endpoints:

1. **[The app API](#the-app-api)**: what the browser uses. Authenticated by the session cookie you get
   from logging in with the password.
2. **[The automation API](#the-automation-api)**: for Shortcuts, Siri, scripts and cron. Authenticated
   by a bearer token. *New; see the note at the top of that section.*

All responses carry `X-Robots-Tag: noindex, nofollow, noarchive`, `Cache-Control: no-store` (except
static files), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and
`Referrer-Policy: no-referrer`.

Errors are JSON with a single field:

```json
{ "error": "Not signed in" }
```

| Status | Meaning |
|---|---|
| `400` | Bad JSON or a malformed request |
| `401` | No valid session (or token) |
| `404` | Unknown path |
| `409` | Stale revision on `PUT /api/state` |
| `413` | Body larger than the endpoint's limit |
| `422` | The model declined the request |
| `429` | Too many login attempts, or the model provider is rate-limiting |
| `502` | The model provider failed or returned nothing usable |
| `503` | No API key is configured on the server |

---

## The app API

### Public paths (no login)

| Path | Returns |
|---|---|
| `GET /robots.txt` | `User-agent: *` / `Disallow: /` |
| `GET /manifest.webmanifest` | Web app manifest |
| `GET /icons/icon-192.png`, `/icons/icon-512.png`, `/icons/apple-touch-icon.png` | Install icons |
| `GET /` (not logged in) | The login page, with status `401` |

Everything else returns `401` until you log in.

### `POST /api/login`

```http
POST /api/login
Content-Type: application/json

{ "password": "..." }
```

- `200 {"ok": true}` and a `Set-Cookie: homefront_session=...; HttpOnly; SameSite=Lax; Max-Age=31536000`
  (plus `Secure` when the request arrived over HTTPS or with `X-Forwarded-Proto: https`).
- `401 {"error": "Wrong password"}` after a short delay.
- `429 {"error": "Too many attempts"}` after eight failures from one address within ten minutes.

Body limit: 4 KB.

```bash
curl -c jar.txt -H 'content-type: application/json' \
  -d '{"password":"your password"}' http://localhost:8080/api/login
```

The examples below reuse that cookie jar with `-b jar.txt`.

### `POST /api/logout`

Ends the current device's session and clears the cookie. `200 {"ok": true}`.

### `GET /api/config`

What the server can do. The app uses it to decide between the model judge and the offline judge, and
which dictation method to offer.

```json
{ "server": true, "judge": "gpt-6-luna", "transcribe": "gpt-transcribe", "login": true, "provider": "api.openai.com", "api": "responses" }
```

`judge` and `transcribe` are the model names in force, or `null` when there is none (no key, or the
offline judge was chosen). `provider` is the host the judge is called at, and `api` how. No key is ever
in this answer.

### `GET /api/state`

The stored campaign and its revision.

```json
{ "rev": 12, "saved": 1794787200000, "data": { "v": 2, "reports": [ ... ], "labels": {}, "notes": {}, "off": [] } }
```

A fresh server returns `{"rev": 0, "data": null}`.

`data` is the app's saved document:

| Field | Contents |
|---|---|
| `reports` | The list of reports. This is the campaign; everything else is derived from it. |
| `labels` | Your names for the fronts, by front id |
| `notes` | Your one-line description of each front, passed to the judge |
| `off` | Ids of paused fronts |
| `ops`, `seen`, `mode`, `onboarded`, `v` | Interface bookkeeping |

A report:

```json
{
  "id": "mb3k2x9f4a1",
  "ts": 1794787200000,
  "text": "Aced the chemistry midterm, skipped the gym.",
  "summary": "The eastern front advances; the south is quiet.",
  "items": [
    { "front": "afg", "outcome": "win", "severity": 3, "action": "breakthrough",
      "reason": "studied hard and it paid off", "headline": "Chemistry midterm aced" }
  ]
}
```

Front ids: `afg`, `cau`, `tks`, `irq`, `raj`, `tur`, `glf`. `outcome` is `win`, `loss` or `neutral`;
`severity` is 1 to 5; `action` is a battle type key from `ACTIONS` in `js/engine.js`.

### `PUT /api/state`

Saves the campaign, guarded by the revision.

```http
PUT /api/state
Content-Type: application/json

{ "rev": 12, "data": { "reports": [ ... ], "labels": {}, "notes": {}, "off": [] } }
```

- `200 {"rev": 13}` when `rev` matched the stored revision.
- `409` with the **current stored document** (`{rev, saved, data}`) when someone else saved first.
  Adopt it and retry.
- `400 {"error": "Bad state"}` when `data.reports` is not an array.

Body limit: 20 MB.

This replaces the whole document. To add one report from a script, use the automation API instead; it
does the read-judge-append-save cycle for you.

### `POST /api/llm`

One structured-output call to the provider chosen in Settings (or in `.env`). The caller supplies the
prompt and a JSON schema; the server adds the model and the key, and speaks that provider's API.

```http
POST /api/llm
Content-Type: application/json

{ "system": "...", "user": "...", "schema": { "type": "object", ... }, "name": "battle_orders" }
```

| Field | Type | Notes |
|---|---|---|
| `system` | string | Required |
| `user` | string | Required |
| `schema` | object | Required. A JSON schema; sent in strict mode |
| `name` | string | Optional label for the schema |

- `200 {"result": { ... }, "model": "gpt-6-luna"}`: `result` is the parsed JSON matching your schema.
- `422` the model refused; `502` empty, truncated, of the wrong shape, or the provider failed (a
  rejected key reads "The provider rejected the key."); `503` no model set up; `429` provider rate limit.

Body limit: 200 KB. Every answer is checked against the schema's types and required keys on the server,
whether or not the provider enforced it. Requests to OpenAI and Gemini are sent with `store: false`.
A provider's error text is summarised and anything key-shaped is cut out before it is passed on.

### `POST /api/transcribe`

Speech to text. Send the audio as the raw request body with its media type.

```bash
curl -b jar.txt -H 'content-type: audio/mp4' --data-binary @note.m4a \
  http://localhost:8080/api/transcribe
```

- `200 {"text": "...", "model": "gpt-transcribe"}`
- `400 {"error": "No audio"}` for bodies under 500 bytes.

Accepted types: `audio/mp4` (m4a, aac), `audio/webm`, `audio/ogg`, `audio/wav`, `audio/mpeg`.
Body limit: 25 MB.

### `GET /api/ai`

The general staff: which provider judges and which turns speech into text. Session only; the automation
token does not open it. **A key never appears in this answer**, only whether one exists.

```json
{
  "provider": "anthropic", "source": "app", "status": "ready", "model": "claude-haiku-5-5",
  "transcribe": { "mode": "device", "provider": null, "model": null, "status": "device" },
  "providers": [
    { "id": "anthropic", "name": "Anthropic", "keyUrl": "https://console.anthropic.com/settings/keys",
      "needsKey": true, "judges": true, "baseEditable": false, "local": false,
      "defaultModel": "claude-haiku-5-5", "defaultStt": null, "model": "claude-haiku-5-5", "base": "",
      "hasKey": true, "keySource": "app", "last4": "9f8e", "status": "ready" }
  ]
}
```

| Field | Meaning |
|---|---|
| `provider` | `openai`, `anthropic`, `gemini`, `groq`, `mistral`, `openrouter`, `ollama`, `lmstudio`, `custom` or `offline` |
| `source` | `app` (chosen in Settings), `env` (nothing chosen: `.env` is in force) or `none` |
| `status` | `ready`, `no_key`, `no_address`, `no_model`, `rejected` (the provider refused the key the last time it was tried) or `offline` |
| `transcribe.mode` | `same` (the judge's provider), `device`, or a provider id |
| `keySource` | `app` (saved here, `last4` shown), `server` (from `.env`: no `last4`, cannot be removed here) or `null` |

### `PUT /api/ai`

Change any of it. Send only what changes; the whole request is checked before any of it is saved.
Answers with the same body as `GET /api/ai`.

```http
PUT /api/ai
Content-Type: application/json

{ "provider": "anthropic", "keys": { "anthropic": "sk-ant-..." }, "models": { "anthropic": null },
  "bases": { "ollama": "http://localhost:11434/v1" }, "transcribe": { "mode": "groq" } }
```

| Field | Notes |
|---|---|
| `provider` | A provider id, or `null` to go back to what `.env` says |
| `keys` | `{ "<provider>": "<key>" }`. 8 to 512 characters, no spaces. Stored in `ai.json` (mode `0600`) in the data folder |
| `models` | `{ "<provider>": "<model>" }`; `null` for the provider's small default |
| `bases` | `{ "<provider>": "<address>" }`, for `ollama`, `lmstudio` and `custom` only. Must be `http://` or `https://`, with no user name or password in it; `null` for the default |
| `transcribe` | `{ "mode": "same" \| "device" \| "<provider>", "models": { "<provider>": "<model>" } }` |

- `400 {"error": "..."}` says what was wrong, without repeating what was sent.
- `403` the request did not come from the app's own pages (see below).

### `DELETE /api/ai/key/<provider>`

Removes the key saved in the app for that provider and answers with the `GET /api/ai` body. A key that
comes from `.env` is not touched and stays in force. `404` for an unknown provider.

### `POST /api/ai/test`

One tiny call that proves the key and the model work. `{"what": "judge"}` (the default) asks the model for
`{"ok": true}`; `{"what": "transcribe"}` sends half a second of silence to the speech model. Always `200`
with a plain result. Counts against the rate limit.

```json
{ "ok": true, "model": "claude-haiku-5-5", "ms": 412 }
{ "ok": false, "reason": "key_rejected", "message": "The provider rejected the key. Check it, or replace it." }
```

`reason` is one of `key_rejected`, `rate_limited`, `not_found` (the model or the address), `unreachable`,
`timeout`, `bad_answer`, `provider_down`, `refused` or `off` (nothing is set up).

**Writes must come from the app.** `PUT`, `DELETE` and `POST` under `/api/ai` are refused with `403` when
the browser says the request came from another site (`Sec-Fetch-Site` other than `same-origin`, or an
`Origin` that is not this server). The session cookie is `SameSite=Lax` as well, so another site's page
cannot send it with a write in the first place. A script that holds the session cookie sends neither
header and is let through.

### Static files (login required)

`/`, `/index.html`, `/sw.js`, `/css/*.css`, `/js/*.js`, `/data/scenarios.json`, `/data/maps/<id>.json`. Nothing else on disk is
reachable.

---

## Automation API

For iOS Shortcuts, Siri, scripts and cron. Set `HOMEFRONT_TOKEN` (16+ characters) in `.env`, then send
`Authorization: Bearer $HOMEFRONT_TOKEN`. The token works for `/api/report`, `/api/sitrep` and `/api/journal` only;
everything else needs a logged-in browser session. These endpoints share a per-address rate limit
(`HOMEFRONT_RATE_LIMIT`, default 60 per minute; `429` with `Retry-After` when exceeded).

### `POST /api/report`

File a report in plain words. It is judged on the server with the same prompt the app uses (or the offline judge if
no provider is configured or the provider fails), applied to the campaign, and journaled.

Body: `text/plain`, or JSON `{ "text": "...", "when"?: ISO time | ms | "YYYY-MM-DD", "front"?: id or label, "outcome"?: "win" | "loss" }`. Maximum 8 KB.

```bash
curl -X POST http://localhost:8080/api/report \
  -H "Authorization: Bearer $HOMEFRONT_TOKEN" -H "Content-Type: text/plain" \
  --data "Failed the calculus midterm, but hit a PR at the gym."
```

Success (`200`):

```json
{ "ok": true, "summary": "…", "source": "llm", "items": [
    { "front": "afg", "label": "School", "outcome": "loss", "severity": 4, "action": "enemy_breakthrough", "headline": "…", "days_ago": 0 } ],
  "speech": "One or two sentences suitable for Siri to read aloud.", "rev": 12, "reports": ["id…"] }
```

`source` is `llm`, `local` (offline judge; a `warning` explains why) or `manual`.

If the judge cannot tell what the text is about, nothing is saved and you get (`200`):

```json
{ "ok": false, "reason": "unclear", "fronts": [{ "id": "afg", "label": "School" }], "speech": "…" }
```

Retry with `{ "text": "...", "front": "School", "outcome": "win" }` to log it by hand.

Errors: `400` `{ok:false, reason:"empty"|"bad_request"|"bad_front"|"bad_outcome"|"no_fronts"}`, `401`, `413`, `429`.

### `GET /api/sitrep`

The situation report as `text/plain`, using your front names.

```bash
curl -H "Authorization: Bearer $HOMEFRONT_TOKEN" http://localhost:8080/api/sitrep
```

### `GET /api/journal?since=<ISO time>`

The append-only journal as a JSON array, oldest first (newest 5000 at most). Each line is one of
`{t, op:"add", id, report, src}`, `{t, op:"edit", id, before, after, src}`, `{t, op:"delete", id, report, src}`,
`{t, op:"settings", changes, src}`; `src` is `app` or `api`.

### `GET /healthz`

No authentication. Returns `200` with the plain text `ok`.

## Command line

`bin/homefront.mjs` wraps the automation API. It reads `HOMEFRONT_URL` and `HOMEFRONT_TOKEN` from the environment or from
`~/.config/homefront/config.json` (`{"url": "...", "token": "..."}`).

```bash
node bin/homefront.mjs report "Shipped the onboarding flow"
node bin/homefront.mjs sitrep
node bin/homefront.mjs journal --since 2026-11-01
node bin/homefront.mjs --help
```

Exit codes: `0` done, `1` error, `2` the judge found the report unclear.

## iOS Shortcut recipe

1. Add a "Dictate Text" action (or "Ask for Input").
2. Add "Get Contents of URL": URL `https://your-host/api/report`, method POST, header `Authorization: Bearer <token>`,
   request body "File" or "Text" with the dictated text.
3. Add "Get Dictionary Value" for `speech`, then "Speak Text".

Say "Hey Siri, report to the staff" and it files the report and reads the result back.

## A nightly situation report by cron

```cron
0 21 * * *  curl -s -H "Authorization: Bearer $HOMEFRONT_TOKEN" http://localhost:8080/api/sitrep
```
