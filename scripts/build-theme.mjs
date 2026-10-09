import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const css = [
  await readFile(join(root, 'shared/ah-theme.css'), 'utf8'),
  await readFile(join(root, 'shared/ah-panels.css'), 'utf8')
].join('\n');
const runtimePath = join(root, 'shared/ah-theme-runtime.js');
const compatibility = await readFile(join(root, 'shared/legacy-storage.js'), 'utf8');
let runtime = await readFile(runtimePath, 'utf8');
const compile = () => compatibility.trimEnd() + '\n\n' + runtime.replace("/* BUILD_THEME_CSS */ ''", () => JSON.stringify(css));
let compiled = compile();
// New theme code must replace an older bundle even when users update one helper
// before the others. Advance the theme version as well as userscript versions.
let previous;
try { previous = await readFile(join(root, 'shared/ah-theme.js'), 'utf8'); } catch {}
const banner = '// Generated preview bundle. Edit the CSS/runtime sources.\n';
if (!check && previous && previous !== banner + compiled) {
  const oldVersion = previous.match(/const VERSION = '(\d+)\.(\d+)\.(\d+)'/);
  const newVersion = runtime.match(/const VERSION = '(\d+)\.(\d+)\.(\d+)'/);
  if (oldVersion && newVersion && oldVersion[0] === newVersion[0]) {
    runtime = runtime.replace(newVersion[0], `const VERSION = '${oldVersion[1]}.${oldVersion[2]}.${Number(oldVersion[3]) + 1}'`);
    await writeFile(runtimePath, runtime);
    compiled = compile();
  }
}
const hash = createHash('sha256').update(compiled).digest('hex').slice(0, 16);
const start = '// BEGIN GENERATED AH THEME';
const end = '// END GENERATED AH THEME';
const block = `${start} (${hash})\n// Edit the shared CSS/runtime/legacy-storage sources, then run npm run build:theme.\n${compiled.trimEnd()}\n${end}`;
const blockPattern = /\/\/ BEGIN GENERATED AH THEME[^\n]*\n[\s\S]*?\/\/ END GENERATED AH THEME/;
const files = (await readdir(root)).filter(name => name.endsWith('.user.js')).sort();
let stale = false;

async function output(path, expected) {
  let actual;
  try { actual = await readFile(path, 'utf8'); } catch {}
  if (actual === expected) return;
  if (check) {
    console.error(`Theme bundle is stale: ${path.slice(root.length + 1)}`);
    stale = true;
  } else {
    await writeFile(path, expected);
  }
}

await output(join(root, 'shared/ah-theme.js'), banner + compiled);
for (const name of files) {
  const path = join(root, name);
  const source = await readFile(path, 'utf8');
  const existing = source.match(blockPattern)?.[0];
  if (existing === block) continue;
  if (check) {
    console.error(`Theme bundle is stale: ${name}`);
    stale = true;
    continue;
  }
  // Updating an installed script must advertise a newer version to Tampermonkey.
  let result = existing ? source.replace(blockPattern, () => block)
    : source.replace('// ==/UserScript==', () => `// ==/UserScript==\n\n${block}`);
  result = result.replace(/(\/\/ @version\s+)(\d+)\.(\d+)\.(\d+)/,
    (_, prefix, major, minor, patch) => `${prefix}${major}.${minor}.${Number(patch) + 1}`);
  await writeFile(path, result);
  console.log(`Bundled theme into ${name}`);
}
if (stale) {
  console.error('Run npm run build:theme and include the updated userscripts.');
  process.exitCode = 1;
}
