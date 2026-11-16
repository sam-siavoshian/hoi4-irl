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

- `200 {"ok": true}` and a `Set-Cookie: artesh_session=...; HttpOnly; SameSite=Lax; Max-Age=31536000`
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
{ "server": true, "judge": "gpt-6-luna", "transcribe": "gpt-transcribe", "login": true }
```

`judge` and `transcribe` are `null` when no API key is set.

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

One structured-output call to the configured model. The caller supplies the prompt and a JSON schema;
the server adds the model and the key.

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
- `422` the model refused; `502` empty, truncated or failed; `503` no key; `429` provider rate limit.

Body limit: 200 KB. Output is capped at 2,000 tokens. Requests to the provider are sent with
`store: false`.

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

### Static files (login required)

`/`, `/index.html`, `/sw.js`, `/css/*.css`, `/js/*.js`, `/data/map.json`. Nothing else on disk is
reachable.

---

## The automation API

> **Status: new.** These endpoints are being added alongside this document. The shapes below are the
> intended contract; if the server you are running behaves differently, the server is right and this
> page needs fixing. Please open an issue.

For filing reports without opening the app.

### Authentication

Set a token in `.env` and restart:

```bash
echo "ARTESH_TOKEN=$(openssl rand -hex 32)" >> .env
```

Send it on every request:

```http
Authorization: Bearer <your token>
```

The token is separate from the password. It can file reports and read the situation report; it cannot
open the app or read the API key. While `ARTESH_TOKEN` is empty these endpoints are disabled. A missing
or wrong token gets `401`.

### `POST /api/report`

File a report in plain words. The server judges it (with the configured model, or the offline judge if
there is no key), appends it to the campaign and saves. Your other devices see it the next time they
sync.

Plain text:

```bash
curl -X POST http://localhost:8080/api/report \
  -H "Authorization: Bearer $ARTESH_TOKEN" \
  -H "Content-Type: text/plain" \
  --data "Aced the chemistry midterm. Skipped the gym again."
```

Or JSON:

```bash
curl -X POST http://localhost:8080/api/report \
  -H "Authorization: Bearer $ARTESH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Aced the chemistry midterm. Skipped the gym again."}'
```

Response:

```json
{
  "summary": "A breakthrough on the Afghan Front; the Baluchistan line gives a little ground.",
  "items": [
    { "front": "afg", "outcome": "win",  "severity": 3, "action": "breakthrough",
      "reason": "studied hard and it paid off", "headline": "Chemistry midterm aced" },
    { "front": "raj", "outcome": "loss", "severity": 1, "action": "attrition",
      "reason": "skipped again, slow neglect", "headline": "Gym skipped again" }
  ]
}
```

- `summary`: the staff's communiqué, one to three sentences. Good for Siri to read back.
- `items`: one entry per event the judge found. An empty list means nothing in the text could be
  classified; nothing is added to the campaign in that case.

Errors: `400` empty text, `401` bad token, `413` text too long, `502` the model failed.

### `GET /api/sitrep`

The current situation, as text you can read or speak and as data.

```bash
curl -H "Authorization: Bearer $ARTESH_TOKEN" http://localhost:8080/api/sitrep
```

```json
{
  "summary": "Advancing in the east, holding in the west. The enemy is massing on the Caucasus Front.",
  "items": [
    { "front": "afg", "name": "Afghan Front", "label": "School", "position": -34, "status": "Advancing" },
    { "front": "cau", "name": "Caucasus Front", "label": "Family", "position": 8, "status": "Under pressure" }
  ]
}
```

`position` runs from −100 (every objective taken) through 0 (the border) to +100 (Tehran falls).

### `GET /healthz`

Liveness check for monitors and container health checks. No authentication, no private information.

```bash
curl http://localhost:8080/healthz
```

```json
{ "ok": true }
```

### Command line

`bin/artesh.mjs` wraps these endpoints. It reads the address and token from the environment.

```bash
export ARTESH_URL=https://artesh.example.ts.net
export ARTESH_TOKEN=...

node bin/artesh.mjs report "Shipped the release. Slept four hours."
node bin/artesh.mjs sitrep
echo "Ran 5k before work" | node bin/artesh.mjs report
```

Run `node bin/artesh.mjs --help` for the exact options. To have `artesh` on your `PATH`, run `npm link`
in the repository.

### iOS Shortcuts and Siri

1. Open the Shortcuts app and create a shortcut named, say, **Report to staff**.
2. Add **Dictate Text** (or **Ask for Input** if you prefer to type).
3. Add **Get Contents of URL**:
   - URL: `https://<your address>/api/report`
   - Method: `POST`
   - Headers: `Authorization` = `Bearer <your token>`, `Content-Type` = `text/plain`
   - Request Body: *File*, set to the dictated text. (Or choose *JSON* with one field, `text`.)
4. Add **Get Dictionary Value**: key `summary`.
5. Add **Speak Text** (or **Show Notification**) with that value.

Now "Hey Siri, report to staff" takes your update and reads the communiqué back. The same shortcut
works from the Action Button, a Home Screen icon, or an automation ("when I leave the gym").

The phone must be able to reach the server: on your tailnet, or at your public HTTPS address.

### Other recipes

A daily nudge from cron that files nothing but tells you where things stand:

```cron
0 21 * * *  curl -s -H "Authorization: Bearer $ARTESH_TOKEN" http://localhost:8080/api/sitrep | jq -r .summary
```

A git hook that reports each commit to your work front:

```bash
#!/bin/sh
# .git/hooks/post-commit
curl -s -X POST "$ARTESH_URL/api/report" -H "Authorization: Bearer $ARTESH_TOKEN" \
  -H "Content-Type: text/plain" --data "Committed to work project: $(git log -1 --pretty=%s)" >/dev/null &
```

Go easy with automated reports. The map is only worth reading if it reflects things that mattered.
