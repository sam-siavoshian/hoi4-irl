// Build time only (tools/build-site.mjs): the page as HTML, so it reads before any script has run.
import { renderToString } from 'react-dom/server';
import { Page } from './Page.jsx';

export const render = () => renderToString(<Page />);
