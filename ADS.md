# Advertising activation runbook

Status: preparation only. Ads are OFF. No publisher IDs or ad units have been invented.
The homepage includes one hidden slot after the workspace. `assets/ads.js` is a tested provider adapter, intentionally not imported by the application.

## Required before activation

1. Obtain the owner's AdSense publisher ID and one display ad-unit ID per site. Keep Auto ads off in the AdSense dashboard so placement stays under our control.
2. Set the real publisher ID in `assets/ads-config.json`. The existing build emits `dist/ads.txt` for verification; do not publish placeholder IDs. Google must report this site Ready before real ad serving.
3. Configure a Google-certified CMP for applicable visitors and implement its supported API adapter. `mountAd` defaults to no consent and must not be invoked with a hardcoded true. Implement withdrawal/privacy-choice handling, including stopping future requests and removing the ad; test all applicable regions. A homemade banner or localStorage flag is not a substitute for a CMP.
4. Update Privacy to reflect the actual provider, cookies and consent choices. Set siteApproved only after approval. Remove the deliberate build activation guard only as part of this reviewed integration and import the loader on the homepage after an affirmative consent signal. Reserve the slot before requesting inventory. Do not load ads on generated print sheets or pass input text to the provider.
5. Test with provider-supported test methods: consent absent/denied/granted/withdrawn, no fill, blocked script, timeout, mobile layout, keyboard access and print/PDF. Never click live ads for testing.
6. Enable after those checks; leave the ability to disable through configuration. The tool must continue to work when ads fail. No automatic refresh, forced clicks or rewarded gating is implemented.

## Deployment

Render currently runs npm test (including posttest) then copies the app and assets to dist. prepare-seo.js copies the informational pages and sitemap, and generates ads.txt only when a valid publisher ID exists. GitHub Pages serves tracked root files, so an ads.txt file for that host requires a separate deliberate publication if that host is monetized. Monetization targets the canonical Render host.

## Measurement

No analytics are installed. Use AdSense reporting after activation; choose a privacy-reviewed analytics implementation separately if funnel measurement is needed. Ad revenue and approval are not guaranteed.
