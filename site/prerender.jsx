// Build time only (tools/build-site.mjs): each page as HTML, so it reads before any script has run.
import { renderToString } from 'react-dom/server';
import { Page } from './Page.jsx';
import { DocPage } from './DocPage.jsx';

export const render = () => renderToString(<Page />);
export const renderDoc = view => renderToString(<DocPage view={view} />);
