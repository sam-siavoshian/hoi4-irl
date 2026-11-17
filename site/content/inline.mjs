// The three inline marks a page's text may carry (site/content/pages.mjs): [words](address), `code` and **strong**.
// A backslash keeps the next character as it is. Shared by the HTML renderer (site/DocPage.jsx) and the Markdown one.
export function inline(text) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) out.push({ t: 'text', text: buf }); buf = ''; };
  for (let i = 0; i < text.length;) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) { buf += text[i + 1]; i += 2; continue; }
    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) { flush(); out.push({ t: 'code', text: text.slice(i + 1, end) }); i = end + 1; continue; }
    }
    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end > i) { flush(); out.push({ t: 'strong', children: inline(text.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if (ch === '[') {
      const m = /^\[((?:\\.|[^\]\\])*)\]\(([^)\s]+)\)/.exec(text.slice(i));
      if (m) { flush(); out.push({ t: 'link', href: m[2], children: inline(m[1]) }); i += m[0].length; continue; }
    }
    buf += ch; i++;
  }
  flush();
  return out;
}

// The words alone, for a title, a word count or structured data.
export function plain(text) {
  const walk = nodes => nodes.map(n => (n.children ? walk(n.children) : n.text)).join('');
  return walk(inline(text));
}

// An address in a page's text: ~/x/ is a page of this site.
export function resolve(href, { root = './', site = '' } = {}, absolute = false) {
  if (!href.startsWith('~/')) return href;
  return (absolute ? site : root) + href.slice(2);
}
