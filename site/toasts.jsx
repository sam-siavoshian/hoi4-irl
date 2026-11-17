// The site's one toast ("Appearance: Dark"), loaded on the first press that needs it. The kit's toasts (Base UI's
// toast, the morphing icons) are a good part of the page's script and nothing on a first visit uses them, so the
// provider is mounted in a root of its own, outside the hydrated page, the first time a toast is shown.
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ToastProvider, toastManager } from '@sam/design-system';

let mounted = false;
export function say(toast) {
  if (!mounted) {
    const host = document.createElement('div');
    host.dataset.slot = 'site-toasts';
    document.body.append(host);
    flushSync(() => createRoot(host).render(<ToastProvider position="top-center" />));
    mounted = true;
  }
  toastManager.add(toast);
}
