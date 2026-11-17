// The header and the foot every page of the site shares, from the design system only. `root` is the way back to the
// site's root from the page (./ on the landing page, ../ one level down), so every link is relative and the site
// works under any sub-path. Rendered at build time and hydrated, so nothing here reads the window outside a handler.
import { Button, IconButton, toastManager } from '@sam/design-system';
import { cycleAppearance } from '@sam/design-system/theme';
import { SunMoonIcon } from 'lucide-react';

export const REPO = 'https://github.com/sam-siavoshian/hoi4-irl';
export const column = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const SAVE = 'homefront.v1'; // the app's own key (js/store.js): the demo is on this origin, so it finds what is put here

// The demo opens on the country picked, with a campaign already in progress (the app fills an empty one when it is
// opened with ?demo=1). A visitor who already has a campaign in this browser keeps it.
export function seedDemo(id) {
  try { if (!localStorage.getItem(SAVE)) localStorage.setItem(SAVE, JSON.stringify({ v: 3, scenario: id, reports: [], labels: {}, notes: {}, off: [], campaigns: {} })); } catch { /* private mode: the demo starts on its own picker */ }
}

function appearance() {
  cycleAppearance();
  const now = document.documentElement.dataset.appearance;
  toastManager.add({ title: `Appearance: ${now === 'light' ? 'Light' : now === 'dark' ? 'Dark' : 'Auto'}`, timeout: 1500 });
}

const NAV = [['how-it-works/', 'How it works'], ['countries/', 'Countries'], ['self-hosting/', 'Self-hosting'], ['faq/', 'FAQ']];

export function SiteHeader({ root }) {
  return (
    <header className={`${column} flex items-center justify-between gap-3 pt-4`}>
      <Button variant="ghost" size="sm" className="-ms-2 font-semibold" render={<a href={root} />}>Home Front</Button>
      <nav aria-label="Sections" className="flex items-center gap-1">
        {NAV.map(([href, label]) => <Button key={href} variant="ghost" size="sm" className="hidden md:inline-flex" render={<a href={root + href} />}>{label}</Button>)}
        <IconButton label="Change appearance" size="md" data-testid="appearance" onClick={appearance}><SunMoonIcon /></IconButton>
        <Button variant="outline" size="sm" render={<a href={REPO} />}>GitHub</Button>
      </nav>
    </header>
  );
}

const FOOT = [
  ['Product', [['how-it-works/', 'How it works'], ['countries/', 'Countries'], ['compare/', 'Compare'], ['faq/', 'FAQ']]],
  ['Run it', [['self-hosting/', 'Self-hosting'], ['ai-providers/', 'AI providers'], ['demo/?demo=1', 'Try the demo']]],
  ['Project', [[REPO, 'Source on GitHub'], [`${REPO}/blob/main/LICENSE`, 'MIT licence'], ['skill.md', 'Setup guide for agents'], ['llms.txt', 'llms.txt']]],
];

export function SiteFooter({ root }) {
  return (
    <footer className={`${column} flex flex-col gap-8 text-xs text-muted-foreground`}>
      <nav aria-label="Site" className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {FOOT.map(([label, links]) => (
          <div key={label} className="flex flex-col items-start gap-1">
            <p className="pb-1 font-medium text-foreground">{label}</p>
            {links.map(([href, text]) => (
              <Button key={href} variant="link" size="xs" className="-mx-2" render={<a href={/^https?:/.test(href) ? href : root + href} />}>{text}</Button>
            ))}
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-1.5 border-t border-border/50 pt-5 sm:flex-row sm:justify-between sm:gap-8">
        <p className="font-medium text-foreground">Home Front</p>
        <div className="max-w-2xl space-y-1.5 sm:text-end">
          <p>Home Front is not affiliated with Paradox Interactive.</p>
          <p>Unit silhouettes from Game-icons.net, CC BY 3.0. Icons by Lucide. Borders from Natural Earth.</p>
        </div>
      </div>
    </footer>
  );
}
