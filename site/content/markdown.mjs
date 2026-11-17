// A page as Markdown, from the same blocks its HTML is rendered from: the copy served beside each page
// (<page>/index.md, linked from the page as rel="alternate" type="text/markdown"), and the pieces of
// llms.txt and llms-full.txt. Every address is absolute, so a copy read on its own still leads somewhere.
import { inline, plain, resolve } from './inline.mjs';

function md(text, site) {
  const walk = nodes => nodes.map(n => {
    if (n.t === 'text') return n.text.replace(/([*_`[\]])/g, '\\$1');
    if (n.t === 'code') return '`' + n.text + '`';
    if (n.t === 'strong') return '**' + walk(n.children) + '**';
    return `[${walk(n.children)}](${resolve(n.href, { site }, true)})`;
  }).join('');
  return walk(inline(text));
}
const cell = (text, site) => md(String(text), site).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function blocksToMarkdown(blocks, site, depth = 0) {
  const hx = n => '#'.repeat(Math.min(6, n + depth));
  const out = [];
  for (const b of blocks) {
    if (b.t === 'h2') out.push(`${hx(2)} ${plain(b.text)}`);
    else if (b.t === 'h3') out.push(`${hx(3)} ${plain(b.text)}`);
    else if (b.t === 'p') out.push(md(b.text, site));
    else if (b.t === 'quote') out.push('> ' + md(b.text, site));
    else if (b.t === 'ul') out.push(b.items.map(i => `- ${md(i, site)}`).join('\n'));
    else if (b.t === 'ol') out.push(b.items.map((i, k) => `${k + 1}. ${md(i, site)}`).join('\n'));
    else if (b.t === 'table') out.push([`| ${b.head.map(h => cell(h, site)).join(' | ')} |`, `| ${b.head.map(() => '---').join(' | ')} |`, ...b.rows.map(r => `| ${r.map(c => cell(c, site)).join(' | ')} |`)].join('\n'));
    else if (b.t === 'code') out.push('```' + (b.label === 'Terminal' ? 'bash' : 'text') + '\n' + b.lines.map(l => (typeof l === 'string' ? l : l.note)).join('\n') + '\n```');
    else if (b.t === 'image') out.push(`![${b.alt}](${site}${b.src})`);
    else if (b.t === 'faq') for (const { q, a } of b.items) out.push(`${hx(3)} ${q}`, md(a, site));
  }
  return out.join('\n\n');
}

// The whole page: its heading, the sentence under it, its body, and where it lives.
export function pageToMarkdown(page, site, { depth = 0, source = true } = {}) {
  const url = site + page.path;
  const head = [`${'#'.repeat(1 + depth)} ${page.h1 === 'Your life as a war map' ? 'Home Front: your life as a war map' : page.h1}`, '', `> ${page.lead}`];
  const tail = source ? ['', `Source: ${url}`] : [];
  return [...head, '', blocksToMarkdown(page.blocks, site, depth), ...tail].join('\n') + '\n';
}

// Words a person reads on the page, for the build's report and the checks.
export function wordCount(page) {
  const words = [page.h1, page.lead];
  const walk = b => {
    if (b.text) words.push(plain(b.text));
    if (b.items) for (const i of b.items) words.push(typeof i === 'string' ? plain(i) : `${i.q} ${plain(i.a)}`);
    if (b.rows) for (const r of b.rows) words.push(r.map(c => plain(String(c))).join(' '));
  };
  page.blocks.forEach(walk);
  return words.join(' ').split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}
