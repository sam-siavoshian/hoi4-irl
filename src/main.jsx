// Entry: the design system's font and stylesheet, its providers, then the app.
import '@sam/design-system/fonts';
import './index.css';
import '../css/fx.css'; // the celebration layer's own few rules (js/fx.js)
import { createRoot } from 'react-dom/client';
import { ToastProvider, TooltipProvider } from '@sam/design-system';
import { startThemeSync } from '@sam/design-system/theme';
import { App } from './App.jsx';

startThemeSync(); // keeps light or dark and motion current after theme-boot.js has set them
createRoot(document.getElementById('root')).render(
  <TooltipProvider>
    <ToastProvider position="top-center">
      <App />
    </ToastProvider>
  </TooltipProvider>,
);
