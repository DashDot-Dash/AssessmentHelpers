import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const USER_SCRIPT_SUFFIX = '.user.js';
const RAW_BASE =
  'https://github.com/DashDot-Dash/AssessmentHelpers/raw/refs/heads/main/';

const rootFilenames = await readdir(ROOT);
const devDuplicates = rootFilenames.filter(
  (filename) =>
    filename.endsWith(USER_SCRIPT_SUFFIX) &&
    filename.toLowerCase().startsWith('dev-')
);

if (devDuplicates.length) {
  fail(
    `Full DEV userscripts must not live in the repository root: ${devDuplicates.join(
      ', '
    )}`
  );
}

const filenames = rootFilenames
  .filter((filename) => filename.endsWith(USER_SCRIPT_SUFFIX))
  .sort();

if (!filenames.length) fail('No production userscripts were found.');

const names = new Map();

for (const filename of filenames) {
  const filePath = join(ROOT, filename);
  const source = await readFile(filePath, 'utf8');
  const metadata = extractMetadata(source, filename);
  const name = getSingleValue(metadata, 'name', filename);
  const version = getSingleValue(metadata, 'version', filename);
  const updateUrl = getSingleValue(metadata, 'updateURL', filename);
  const downloadUrl = getSingleValue(metadata, 'downloadURL', filename);
  const expectedUrl = `${RAW_BASE}${filename}`;

  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    fail(`${filename} has a non-semantic @version: ${version}`);
  }
  if (updateUrl !== expectedUrl) {
    fail(`${filename} @updateURL must be ${expectedUrl}`);
  }
  if (downloadUrl !== expectedUrl) {
    fail(`${filename} @downloadURL must be ${expectedUrl}`);
  }
  if (!metadata.some((line) => /^\/\/ @(?:match|include)\s+/.test(line))) {
    fail(`${filename} must declare at least one @match or @include.`);
  }
  if (!metadata.some((line) => /^\/\/ @grant\s+/.test(line))) {
    fail(`${filename} must declare @grant explicitly.`);
  }
  if (metadata.some((line) => /^\/\/ @require\s+file:/i.test(line))) {
    fail(`${filename} contains a machine-specific file:// @require.`);
  }
  if (names.has(name)) {
    fail(`${filename} duplicates @name "${name}" from ${names.get(name)}.`);
  }

  names.set(name, filename);

  const syntax = spawnSync(process.execPath, ['--check', filePath], {
    encoding: 'utf8'
  });
  if (syntax.status !== 0) {
    fail(
      `${filename} failed syntax validation:\n${
        syntax.stderr || syntax.stdout
      }`
    );
  }
}

process.stdout.write(
  `Validated ${filenames.length} production userscripts.\n`
);

function extractMetadata(source, filename) {
  const match = source.match(
    /^\/\/ ==UserScript==\r?\n([\s\S]*?)^\/\/ ==\/UserScript==\s*$/m
  );
  if (!match) fail(`${filename} does not contain a valid userscript header.`);
  return match[1].split(/\r?\n/);
}

function getSingleValue(metadata, key, filename) {
  const pattern = new RegExp(`^// @${key}\\s+(.+)$`);
  const values = metadata
    .map((line) => line.match(pattern)?.[1]?.trim())
    .filter(Boolean);

  if (values.length !== 1) {
    fail(`${filename} must declare exactly one @${key}.`);
  }

  return values[0];
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
