// A content page's entry: the design system's font and stylesheet, then the page, hydrated from the same object it
// was rendered from at build time (tools/build-site.mjs writes it into the page as JSON).
import '@sam/design-system/fonts';
import './site.css';
import { hydrateRoot } from 'react-dom/client';
import { startThemeSync } from '@sam/design-system/theme';
import { DocPage } from './DocPage.jsx';

startThemeSync(); // keeps light or dark and motion current after theme-boot.js has set them
const data = document.getElementById('page-data');
if (data) hydrateRoot(document.getElementById('root'), <DocPage view={JSON.parse(data.textContent)} />);
