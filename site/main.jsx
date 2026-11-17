// The landing page's entry: the design system's font and stylesheet, then the page. The HTML is already there, written
// at build time, so this hydrates it. Under the dev server nothing was prerendered and the page is rendered here.
import '@sam/design-system/fonts';
import './site.css';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { startThemeSync } from '@sam/design-system/theme';
import { Page } from './Page.jsx';

startThemeSync(); // keeps light or dark and motion current after theme-boot.js has set them
const root = document.getElementById('root');
if (root.firstElementChild) hydrateRoot(root, <Page />);
else createRoot(root).render(<Page />);
