// The landing page inside the design system's providers (its one toast is loaded when first needed: toasts.jsx). The build renders this to HTML (prerender.jsx) and the
// browser hydrates the same tree (main.jsx), so the two always match.
import { TooltipProvider } from '@sam/design-system';
import { Landing } from './Landing.jsx';

export function Page() {
  return (
    <TooltipProvider>
      <Landing />
    </TooltipProvider>
  );
}
