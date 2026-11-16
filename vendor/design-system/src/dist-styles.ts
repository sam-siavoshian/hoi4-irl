// Only for `npm run build`'s dist/: pulls the stylesheet (design/index.css, compiled with the
// kit's own utilities) into dist/design.css for a project that does not run Tailwind itself.
// A project that runs Tailwind 4 imports "@sam/design-system/styles.css" instead (see README).
import "./design/index.css";
