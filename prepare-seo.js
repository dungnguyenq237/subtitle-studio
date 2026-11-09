import { mkdirSync, copyFileSync } from 'node:fs';
mkdirSync('dist', { recursive: true });
for (const file of ['robots.txt', 'sitemap.xml']) copyFileSync(file, `dist/${file}`);
