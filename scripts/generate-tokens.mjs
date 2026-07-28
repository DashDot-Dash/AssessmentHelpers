import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const TOKENS_JSON_PATH = join(ROOT, 'design/tokens/tokens.json');
const DOCK_TOKENS_CSS_PATH = join(ROOT, 'design/tokens/dock.tokens.css');
const DOCK_SELECTOR = '#assessment-helper-dock';

const checkOnly = process.argv.includes('--check');

const tokens = JSON.parse(await readFile(TOKENS_JSON_PATH, 'utf8'));
const version = tokens.version;
if (!version) fail('tokens.json is missing a top-level "version".');

const entries = collectTokens(tokens);
if (!entries.length) fail('tokens.json produced no --ah-* custom properties.');

const expected = renderCss(version, DOCK_SELECTOR, entries);

if (checkOnly) {
  const actual = await readFile(DOCK_TOKENS_CSS_PATH, 'utf8');
  if (actual !== expected) {
    fail(
      `design/tokens/dock.tokens.css is out of date with design/tokens/tokens.json.\n` +
        `Run "node scripts/generate-tokens.mjs" to regenerate it, then commit the result.`
    );
  }
  process.stdout.write('design/tokens/dock.tokens.css matches tokens.json.\n');
} else {
  await writeFile(DOCK_TOKENS_CSS_PATH, expected);
  process.stdout.write(`Wrote ${entries.length} tokens to design/tokens/dock.tokens.css.\n`);
}

function collectTokens(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('--ah-') && value && typeof value === 'object' && 'value' in value) {
      out.push([key, value.value]);
    } else if (value && typeof value === 'object') {
      collectTokens(value, out);
    }
  }
  return out;
}

function renderCss(v, selector, list) {
  const lines = list.map(([key, value]) => `  ${key}: ${value};`).join('\n');
  return `/* AH-TOKENS v${v} — generated from design/tokens/tokens.json — do not edit by hand
   Scope: replace the selector with THIS script's own root element id.
   Never declare these on :root — that leaks into Canvas and collides with
   the other helper scripts. */

${selector} {
${lines}
}
/* /AH-TOKENS */
`;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
