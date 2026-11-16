/*
 * Before the first paint: light or dark, the sky, motion, and the operating
 * system. A plain script file, not inline, because the CSP allows no inline
 * script (server/web_static.py). Loaded blocking from index.html's <head>.
 *
 * Mirrors src/design/theme.ts (appearance, the sky and the theme it gives,
 * motion) and src/design/morrow/scenes.ts (sceneForHour);
 * src/design/theme-boot.test.ts runs this file against both, so a change to
 * one that misses the other fails.
 *
 *   data-theme       "light" | "dark"        Zephium's switch (tokens.css); on Auto, the sky's
 *   data-appearance  "system" | "light" | "dark"   the saved choice
 *   data-sky         "dawn" | "day" | "night"     a pinned sky, or the clock's kept to a chosen theme
 *   data-motion      "full" | "reduce"       opencode/Morrow; data-reduce-motion for Zephium
 *   data-platform    "web" (the desktop app, which said "desktop", is gone)
 *   data-os          "macos" | "windows" | "linux"
 */
(function () {
  var root = document.documentElement;

  function read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function sceneForHour(hour) {
    var h = ((Math.floor(hour) % 24) + 24) % 24;
    if (h >= 20) return "night";
    if (h >= 17) return "dawn";
    if (h >= 8) return "day";
    if (h >= 5) return "dawn";
    return "night";
  }

  var still = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  var appearance = read("lanes:appearance");
  if (appearance !== "light" && appearance !== "dark") appearance = "system";
  root.setAttribute("data-appearance", appearance);

  // A pinned sky as it is; the clock's kept to a chosen theme (dark is night, light is never night).
  var sky = read("lanes:sky");
  if (sky !== "dawn" && sky !== "day" && sky !== "night") {
    sky = sceneForHour(new Date().getHours());
    if (appearance === "dark") sky = "night";
    else if (appearance === "light" && sky === "night") sky = "day";
  }
  root.setAttribute("data-sky", sky);
  // On Auto the sky decides: night is a dark page, dawn and day light ones.
  root.setAttribute("data-theme", appearance === "system" ? (sky === "night" ? "dark" : "light") : appearance);

  var reduce = (still && still.matches) || read("lanes:motion") === "reduce";
  root.setAttribute("data-motion", reduce ? "reduce" : "full");
  if (reduce) root.setAttribute("data-reduce-motion", "true");

  var agent = navigator.userAgent || "";
  var os = agent.indexOf("Windows") >= 0 ? "windows" : agent.indexOf("Mac") >= 0 ? "macos" : "linux";
  root.setAttribute("data-os", os);
  root.setAttribute("data-platform", "web");
})();
