// The landing page inside the design system's providers. The build renders this to HTML (prerender.jsx) and the
// browser hydrates the same tree (main.jsx), so the two always match.
import { ToastProvider, TooltipProvider } from '@sam/design-system';
import { Landing } from './Landing.jsx';

export function Page() {
  return (
    <TooltipProvider>
      <ToastProvider position="top-center">
        <Landing />
      </ToastProvider>
    </TooltipProvider>
  );
}
