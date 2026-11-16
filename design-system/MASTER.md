# Interface design system

Cinematic editorial workspace: charcoal/coral in dark mode, warm ivory/rust in light mode. Perspective console with a sage caption frame, architectural grid, and restrained reveal motion.

Derived from UI UX Pro Max product/style, contrast and reduced-motion searches. Existing brand fonts are self-hosted; no extra font, animation or analytics services were introduced. The video-editor search recommended dark OLED styling; the required light mode is an independently designed brand extension. The stationery design uses the verified Vibrant & Block-based style rather than the generic Swiss suggestion.

## Source of truth
- `assets/interface.css`: semantic surface, text, field, action, focus, error and success tokens for both modes; responsive component rules.
- `assets/theme.js`: synchronous preference bootstrap, system/light/dark controls, persistence, cross-tab updates, localized accessible labels. No flash of the opposite saved theme.
- `assets/experience.js`: one-shot viewport reveals, cancelled when reduced motion is requested. Content is visible even when this optional enhancement fails.

## Rules
- 44px theme controls with pressed state and visible focus. Theme changes preserve input and generated results.
- Default to the OS, persist explicit selection, provide a system reset, tolerate blocked storage.
- Body and secondary text must contrast at least 4.5:1 against all three interface surfaces. Paper preview uses its own fixed light ink palette.
- Disable decorative motion for reduced-motion users. Keep core processing feedback readable.
- On narrow screens the header wraps and stops sticking; no horizontal overflow in RTL.
- Print output remains white and excludes theme controls.

## Validation
Existing core/i18n/ad unit suite plus Chromium E2E: all locales, mobile, core flows, download/PDF, system preference changes, explicit persistence across guide navigation, denied storage, keyboard controls, theme token contrast, 320px RTL and theme screenshots. Local browser launch is restricted by the runtime; authoritative full E2E runs on GitHub Actions. Visual review uses the supported preview browser.
