// A content page of the site (the countries, self-hosting, AI providers, how it works, FAQ, compare), drawn from its
// blocks (site/content/pages.mjs) with the design system only. Rendered to HTML at build time (prerender.jsx) and
// hydrated in the browser from the same object (doc.jsx), so it must render the same on both sides.
import { Breadcrumbs, Button, Card, CodeBlock, ListGroup, ListRowLink, Prose, ProseTable, SectionHeader, ToastProvider, TooltipProvider } from '@sam/design-system';
import { ArrowRightIcon } from 'lucide-react';
import { inline, resolve } from './content/inline.mjs';
import { Flag } from '../src/marks.jsx';
import { REPO, SiteFooter, SiteHeader, column, seedDemo } from './Chrome.jsx';

function Inline({ text, root }) {
  const walk = nodes => nodes.map((n, at) => {
    if (n.t === 'text') return n.text;
    if (n.t === 'code') return <code key={at}>{n.text}</code>;
    if (n.t === 'strong') return <strong key={at}>{walk(n.children)}</strong>;
    return <a key={at} href={resolve(n.href, { root })}>{walk(n.children)}</a>;
  });
  return <>{walk(inline(String(text)))}</>;
}

function Block({ b, root, first }) {
  const t = text => <Inline text={text} root={root} />;
  switch (b.t) {
    case 'h2': return <h2 id={b.id}>{t(b.text)}</h2>;
    case 'h3': return <h3 id={b.id}>{t(b.text)}</h3>;
    case 'p': return <p>{t(b.text)}</p>;
    case 'quote': return <blockquote><p>{t(b.text)}</p></blockquote>;
    case 'ul': return <ul>{b.items.map((i, at) => <li key={at}>{t(i)}</li>)}</ul>;
    case 'ol': return <ol>{b.items.map((i, at) => <li key={at}>{t(i)}</li>)}</ol>;
    case 'table': return <ProseTable label={b.label} head={b.head.map(h => t(h))} rows={b.rows.map(r => r.map(c => t(c)))} />;
    case 'code': return <CodeBlock label={b.label} lines={b.lines} />;
    case 'image': return (
      <Card as="figure" padding="none" radius="panel" className="my-6 overflow-hidden">
        <img src={root + b.src} width={b.w} height={b.h} alt={b.alt} loading={first ? 'eager' : 'lazy'} decoding="async" className="block h-auto w-full" />
      </Card>
    );
    case 'faq': return b.items.map(({ q, a }) => (
      <section key={q} aria-label={q}>
        <h3 id={q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}>{q}</h3>
        <p>{t(a)}</p>
      </section>
    ));
    default: return null;
  }
}

// view: { root, page: { name, h1, lead, blocks, crumbs, country, flag }, related: [{ href, label, line }] }
export function DocPage({ view }) {
  const { root, page, related } = view;
  const demo = root + 'demo/?demo=1';
  const crumbs = [{ label: 'Home', href: root }, ...page.crumbs.map(([label, path]) => ({ label, href: path ? root + path : undefined }))];
  const firstImage = page.blocks.findIndex(b => b.t === 'image');
  const actions = page.country ? (
    <>
      <Button size="lg" data-testid="play" render={<a href={demo} />} onClick={() => seedDemo(page.country)}>Play as {page.countryName}<ArrowRightIcon /></Button>
      <Button size="lg" variant="outline" render={<a href={root + 'self-hosting/'} />}>Self-host it</Button>
    </>
  ) : (
    <>
      <Button size="lg" data-testid="try-demo" render={<a href={demo} />}>Try the demo<ArrowRightIcon /></Button>
      {page.name === 'self-hosting'
        ? <Button size="lg" variant="outline" render={<a href={REPO} />}>Open the repository</Button>
        : <Button size="lg" variant="outline" render={<a href={root + 'self-hosting/'} />}>Self-host it</Button>}
    </>
  );
  return (
    <TooltipProvider>
      <ToastProvider position="top-center">
        <div className="flex min-h-dvh flex-col gap-16 pb-12 sm:gap-24">
          <div className="flex flex-col gap-8 sm:gap-12">
            <SiteHeader root={root} />
            <main className={`${column} flex flex-col gap-12 sm:gap-16`}>
              <div className="flex max-w-3xl flex-col gap-5">
                <Breadcrumbs items={crumbs} />
                <SectionHeader level="hero" as="h1" data-testid="page-title"
                  title={page.flag ? <span className="inline-flex items-center gap-3"><Flag flag={page.flag} className="size-9" />{page.h1}</span> : page.h1}
                  description={page.lead} action={actions} />
              </div>
              <Prose data-testid="prose">
                {page.blocks.map((b, at) => <Block key={at} b={b} root={root} first={at === firstImage} />)}
              </Prose>
              {related.length ? (
                <section aria-labelledby="next-title" className="flex max-w-prose flex-col gap-4">
                  <SectionHeader level="display" title={<span id="next-title">Read next</span>} />
                  <ListGroup>
                    {related.map(r => <ListRowLink key={r.href} href={root + r.href} title={r.label} description={r.line} />)}
                  </ListGroup>
                </section>
              ) : null}
            </main>
          </div>
          <SiteFooter root={root} />
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
