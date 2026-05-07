import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vaultRoot = path.dirname(root);
const manifest = readJson('manifest.json');
const packageJson = readJson('package.json');
const versions = readJson('versions.json');

const livePluginDir = path.join(vaultRoot, '.obsidian', 'plugins', manifest.id);
const releaseDir = path.join(root, 'dist', `${manifest.id}-${manifest.version}`);
const pluginFiles = ['main.js', 'manifest.json', 'styles.css'];

assert(manifest.id === 'kanban-rpm', 'manifest.id must be kanban-rpm');
assert(manifest.name === 'KanbanRPM', 'manifest.name must be KanbanRPM');
assert(manifest.version === packageJson.version, 'manifest.version must match package.json version');
assert(versions[manifest.version] === manifest.minAppVersion, 'versions.json must map version to minAppVersion');

assertOnlyFiles(livePluginDir, pluginFiles, 'live plugin folder');
assertOnlyFiles(releaseDir, pluginFiles, 'release bundle');

const liveManifest = readJson(path.join(livePluginDir, 'manifest.json'), true);
const releaseManifest = readJson(path.join(releaseDir, 'manifest.json'), true);
assert(liveManifest.version === manifest.version, 'live plugin manifest version must match source manifest');
assert(releaseManifest.version === manifest.version, 'release bundle manifest version must match source manifest');

for (const rel of [
  'README.md',
  'docs/Install.md',
  'docs/Release Notes.md',
  'docs/Release QA.md',
  'docs/Attribution.md',
  'docs/KanbanRPM Manual.md',
  'docs/KanbanRPM Manual ko.md',
  'docs/Roadmap.md',
]) {
  assertFileContains(rel, ['KanbanRPM']);
}

assertFileContains('README.md', ['npm run package', 'docs/Install.md', 'docs/Release Notes.md']);
assertFileContains('docs/Install.md', [manifest.id, manifest.version, 'main.js', 'manifest.json', 'styles.css']);
assertFileContains('docs/Release Notes.md', [`v${manifest.version}`, 'Daily', 'Weekly review', 'Action index']);
assertFileContains('docs/KanbanRPM Manual.md', ['Project', 'Subproject', 'Pull Daily', 'Weekly review', 'Table', 'List']);
assertFileContains('docs/KanbanRPM Manual ko.md', ['Project', 'Subproject', 'Pull Daily', 'Weekly review', 'Table', 'List']);
assertFileContains('docs/Attribution.md', ['obsidian-community/obsidian-kanban', 'kanban-rpm']);

console.log('KanbanRPM smoke checks passed');

function readJson(relOrAbs, absolute = false) {
  const file = absolute ? relOrAbs : path.join(root, relOrAbs);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertOnlyFiles(dir, expected, label) {
  assert(fs.existsSync(dir), `Missing ${label}: ${dir}`);
  const actual = fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isFile()).sort();
  const sortedExpected = [...expected].sort();
  assert(
    JSON.stringify(actual) === JSON.stringify(sortedExpected),
    `${label} should contain only ${sortedExpected.join(', ')}; found ${actual.join(', ')}`
  );
}

function assertFileContains(rel, terms) {
  const file = path.join(root, rel);
  assert(fs.existsSync(file), `Missing file: ${rel}`);
  const content = fs.readFileSync(file, 'utf8');
  for (const term of terms) assert(content.includes(term), `${rel} should mention ${term}`);
}
