# Third-party notices

ARTESH is released under the MIT licence (see [LICENSE](LICENSE)). It includes or is built from the
following third-party work. Thank you to everyone who made it.

## Shipped with the app

These are embedded in files the browser loads.

### Game-icons.net: unit and building silhouettes

- Authors: Lorc, Delapouite and contributors
- Source: <https://game-icons.net>
- Licence: [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/) (CC BY 3.0)
- Where: path data in `js/icons.js` (`UNIT_PATHS`, `FILLED_ICONS`), extracted from the
  `@iconify-json/game-icons` package by `tools/build-icons-js.mjs`. The paths are reused as they are;
  the app recolours and scales them when drawing.

### Lucide: interface icons

- Authors: Lucide contributors (portions derived from Feather by Cole Bemis)
- Source: <https://lucide.dev>
- Licence: [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
- Where: SVG bodies in `js/icons.js` (`UI_ICONS`), extracted from the `@iconify-json/lucide` package
  by `tools/build-icons-js.mjs`.

### Natural Earth: country borders and coastlines

- Source: <https://www.naturalearthdata.com>
- Licence: public domain
- Where: the geometry in `data/maps/*.json` is derived from Natural Earth 1:10m country polygons
  (through the `world-atlas` package), regrouped into 1936 political entities and cut into provinces
  by `tools/build-map.mjs`. Cities, terrain, rivers, lakes and railways are hand-authored in
  `tools/seeds.mjs`.

## Used at build time only

These packages run when a developer regenerates `data/maps/*.json` or `js/icons.js`. They are
`devDependencies`; none of their code is shipped to the browser or loaded by the server.

| Package | Used for | Licence |
|---|---|---|
| [world-atlas](https://github.com/topojson/world-atlas) | Natural Earth polygons as TopoJSON | ISC (data: public domain) |
| [topojson-client](https://github.com/topojson/topojson-client) | TopoJSON to GeoJSON, merging countries | ISC |
| [topojson-simplify](https://github.com/topojson/topojson-simplify) | Simplifying borders | ISC |
| [d3-delaunay](https://github.com/d3/d3-delaunay) | Voronoi cells for provinces | ISC |
| [polygon-clipping](https://github.com/mfogel/polygon-clipping) | Clipping provinces to borders | MIT |
| [@iconify-json/game-icons](https://github.com/iconify/icon-sets) | Game-icons.net set as JSON | CC BY 3.0 |
| [@iconify-json/lucide](https://github.com/iconify/icon-sets) | Lucide set as JSON | ISC |

## Used for testing only

- [Playwright](https://playwright.dev) (Apache-2.0) drives the end-to-end tests and renders the app
  icons. It is installed on demand and is not a dependency of the app.

## A note on the setting

The map, the 1936 borders, the place names and the Old Persian satrapy names are used as a historical
backdrop for a personal metaphor. ARTESH is not affiliated with, and does not use any assets from,
any commercial strategy game.
