#!/usr/bin/env node
// homefront — file a report or read the situation from a terminal or a script. No dependencies; Node 20+.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HELP = `homefront — command line for a Home Front server

Usage
  homefront report "what happened"            judge the text and log it
  homefront report "text" --front <id|label> --outcome win|loss
                                           log it by hand (no judging)
  echo "what happened" | homefront report     read the report from stdin
  homefront sitrep                            print the situation report
  homefront journal [--since <ISO time>]      print the change journal, one JSON line per change

Options
  --when <ISO date or time>   file the report as of that moment (report)
  --json                      print the server's raw JSON answer (report)
  --url <url>, --token <t>    override the configuration
  -h, --help                  this text

Configuration
  HOMEFRONT_URL    address of your server, e.g. https://mac.tailnet.ts.net
  HOMEFRONT_TOKEN  the HOMEFRONT_TOKEN set in the server's .env
  or ${path.join('~', '.config', 'homefront', 'config.json')}:  {"url": "...", "token": "..."}
  Environment variables win over the file.

Exit status: 0 done, 1 error, 2 the judge could not place the report (nothing was logged).`;

const die = (msg, code = 1) => { process.stderr.write(`homefront: ${msg}\n`); process.exit(code); };

function parse(argv) {
  const o = { _: [] }; const takes = new Set(['since', 'when', 'front', 'outcome', 'url', 'token']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') o.help = true;
    else if (a === '--json') o.json = true;
    else if (a === '--') { o._.push(...argv.slice(i + 1)); break; }
    else if (a.startsWith('--')) {
      const [k, inline] = a.slice(2).split(/=(.*)/s);
      if (!takes.has(k)) die(`unknown option --${k} (see homefront --help)`);
      const v = inline !== undefined ? inline : argv[++i];
      if (v === undefined) die(`--${k} needs a value`);
      o[k] = v;
    } else o._.push(a);
  }
  return o;
}

function config(o) {
  const file = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'homefront', 'config.json');
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') die(`cannot read ${file}: ${e instanceof SyntaxError ? 'it is not valid JSON' : e.message}`); }
  const url = String(o.url || process.env.HOMEFRONT_URL || process.env.ARTESH_URL || saved.url || '').trim().replace(/\/+$/, '');
  const token = String(o.token || process.env.HOMEFRONT_TOKEN || process.env.ARTESH_TOKEN || saved.token || '').trim();
  if (!url) die(`no server address. Set HOMEFRONT_URL (or "url" in ${file}).`);
  if (!/^https?:\/\//i.test(url)) die(`HOMEFRONT_URL must start with http:// or https:// (got "${url}").`);
  if (!token) die(`no token. Set HOMEFRONT_TOKEN (or "token" in ${file}) to the HOMEFRONT_TOKEN from the server's .env.`);
  return { url, token };
}

async function call({ url, token }, pathname, init = {}) {
  let r;
  try { r = await fetch(url + pathname, { ...init, headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) }, signal: AbortSignal.timeout(90000) }); }
  catch (e) { die(e.name === 'TimeoutError' ? `${url} did not answer in time.` : `cannot reach ${url} (${e.cause?.code || e.message}).`); }
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* plain text */ }
  if (r.status === 401) die('the server refused the token. Check HOMEFRONT_TOKEN here and in the server\'s .env (the server must be restarted after changing it).');
  if (r.status === 429) die(`too many requests; try again in ${r.headers.get('retry-after') || 'a few'} seconds.`);
  if (!r.ok && !(json && json.ok === false)) die(json?.error || `the server answered ${r.status}.`);
  return { status: r.status, text, json };
}

const stdin = async () => { const chunks = []; for await (const c of process.stdin) chunks.push(c); return Buffer.concat(chunks).toString('utf8'); };

async function main() {
  const o = parse(process.argv.slice(2)); const cmd = o._.shift();
  if (o.help || !cmd || cmd === 'help') { process.stdout.write(HELP + '\n'); process.exit(o.help || cmd === 'help' ? 0 : 1); }

  if (cmd === 'report') {
    let text = o._.join(' ').trim();
    if (!text && !process.stdin.isTTY) text = (await stdin()).trim();
    if (!text && !o.front) die('nothing to report. Usage: homefront report "what happened"');
    if ((o.front === undefined) !== (o.outcome === undefined)) die('--front and --outcome go together.');
    const cfg = config(o);
    const body = { text, ...(o.when ? { when: o.when } : {}), ...(o.front ? { front: o.front, outcome: o.outcome } : {}) };
    const { json } = await call(cfg, '/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!json) die('the server did not answer with JSON. Is HOMEFRONT_URL the address of a Home Front server?');
    if (o.json) { process.stdout.write(JSON.stringify(json, null, 2) + '\n'); process.exit(json.ok ? 0 : json.reason === 'unclear' ? 2 : 1); }
    if (json.ok) {
      if (json.summary) console.log(json.summary);
      for (const i of json.items) console.log(`  ${i.outcome === 'win' ? '+' : i.outcome === 'loss' ? '-' : '·'} ${i.label} · ${i.outcome} ${i.severity} · ${i.headline}`);
      if (json.warning) process.stderr.write(`note: ${json.warning}\n`);
      return;
    }
    if (json.reason === 'unclear') {
      process.stderr.write('The staff could not tell where that belongs; nothing was logged.\nLog it by hand with --front <id> --outcome win|loss. Fronts:\n');
      for (const f of json.fronts || []) process.stderr.write(`  ${f.id}  ${f.label}\n`);
      process.exit(2);
    }
    if (json.fronts) { process.stderr.write(`homefront: ${json.error}\n`); for (const f of json.fronts) process.stderr.write(`  ${f.id}  ${f.label}\n`); process.exit(1); }
    die(json.error || 'the report was refused.');
  }

  if (cmd === 'sitrep') { const { text } = await call(config(o), '/api/sitrep'); process.stdout.write(text.endsWith('\n') ? text : text + '\n'); return; }

  if (cmd === 'journal') {
    if (o.since && !Number.isFinite(Date.parse(o.since))) die('--since needs an ISO time, e.g. 2026-01-31 or 2026-01-31T08:00:00Z.');
    const { json } = await call(config(o), '/api/journal' + (o.since ? `?since=${encodeURIComponent(o.since)}` : ''));
    if (!Array.isArray(json)) die('the server did not answer with a journal. Is HOMEFRONT_URL the address of a Home Front server?');
    for (const line of json) console.log(JSON.stringify(line));
    return;
  }

  die(`unknown command "${cmd}" (see homefront --help)`);
}
main().catch(e => die(e.message));
