import {readFileSync} from 'node:fs';

let failed = false;
for (const mode of ['desktop', 'mobile']) {
  const report = JSON.parse(readFileSync(`performance-report/${mode}.json`, 'utf8'));
  if (report.runtimeError) throw new Error(`${mode}: ${report.runtimeError.message}`);
  const score = report.categories.performance.score;
  const cls = report.audits['cumulative-layout-shift'].numericValue;
  const lcp = report.audits['largest-contentful-paint'].numericValue;
  console.log(`${mode}: performance=${Math.round(score * 100)}, CLS=${cls.toFixed(4)}, LCP=${Math.round(lcp)}ms`);
  if (score < .95 || cls > .02 || !Number.isFinite(lcp)) failed = true;
}
if (failed) throw new Error('Performance budget exceeded: score >=95 and CLS <=0.02 required. See Lighthouse artifacts.');
