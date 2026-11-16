// Builds the test scenario (testland.mjs) into testland.json with the real map builder, and hands back the map.
// The file is rebuilt whenever it is missing or older than the scenario or the builder, so it can never go stale.
//   node tests/fixtures/build.mjs      build now and print the builder's report
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const at = f => fileURLToPath(new URL(f, import.meta.url));
const OUT = at('./testland.json'), SOURCES = [at('./testland.mjs'), at('../../tools/build-map.mjs')];
export const FIXTURES = at('./');

export async function testland({ force = false, quiet = true } = {}) {
  const fresh = !force && fs.existsSync(OUT) && SOURCES.every(s => fs.statSync(s).mtimeMs <= fs.statSync(OUT).mtimeMs);
  if (!fresh) {
    const [{ build }, S] = await Promise.all([import('../../tools/build-map.mjs'), import('./testland.mjs')]);
    const r = await build(S, { quiet });
    if (r.problems.length) throw new Error(`testland does not build cleanly:\n  ${r.problems.join('\n  ')}`);
    fs.writeFileSync(OUT, r.json);
  }
  return JSON.parse(fs.readFileSync(OUT, 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const m = await testland({ force: true, quiet: false });
  console.log(`tests/fixtures/testland.json: ${m.provinces.length} provinces, ${m.fronts.length} fronts`);
}
