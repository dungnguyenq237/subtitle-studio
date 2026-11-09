import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
mkdirSync('dist', { recursive: true });
for (const file of ['robots.txt', 'sitemap.xml', 'about.html', 'privacy.html', 'contact.html', 'guide.html']) copyFileSync(file, `dist/${file}`);
const config = JSON.parse(readFileSync('assets/ads-config.json', 'utf8'));
if (config.publisherId && !/^ca-pub-[0-9]{16}$/.test(config.publisherId)) throw new Error('Invalid publisher ID');
if (config.enabled) throw new Error('Ads activation requires a reviewed CMP integration; keep enabled=false until implemented.');
if (config.publisherId) {
  writeFileSync('dist/ads.txt', `google.com, ${config.publisherId.slice(3)}, DIRECT, f08c47fec0942fa0\n`);
} else if (existsSync('dist/ads.txt')) unlinkSync('dist/ads.txt');
