import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vaultRoot = path.dirname(root);
const outDir = path.join(vaultRoot, '.obsidian', 'plugins', 'kanban-rpm');

fs.mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'src-kanbanrpm', 'main.ts')],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/*'],
  format: 'cjs',
  target: 'es2018',
  platform: 'browser',
  outfile: path.join(outDir, 'main.js'),
  sourcemap: false,
  minify: false,
  logLevel: 'info',
});

fs.copyFileSync(path.join(root, 'src-kanbanrpm', 'styles.css'), path.join(outDir, 'styles.css'));
fs.copyFileSync(path.join(root, 'manifest.json'), path.join(outDir, 'manifest.json'));

console.log(`KanbanRPM built to ${outDir}`);
