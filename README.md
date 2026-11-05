# Subtitle Studio

Fix subtitle timing and convert SRT and VTT files privately in your browser.

## Run

Requires Node 20+ for tests and Python 3 for the preview server. No install or build step.

```sh
npm test
npm run serve
```

Open http://localhost:8000. Source uses native ES modules and platform browser APIs.

## GitHub Pages

Publish `main` from `/ (root)` in repository Settings → Pages. All paths are relative and work under a project subpath. `.nojekyll` disables Jekyll processing.

## Privacy and monetization

Files and input stay in the browser. No accounts, trackers, ads, external fonts, paid APIs or analytics are included. Free review release; rewarded ads require a separately approved publisher account, consent flow and real ad lifecycle verification. Do not simulate rewarded views.

## Review checklist

Run tests; try sample content, invalid input, mobile layout and keyboard navigation. Check the exported file or print preview before distribution.
