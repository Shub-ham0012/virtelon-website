# Verification record — 12 October 2026

## Local verification

Six routes checked in the real in-app browser at every required viewport: 320×568, 360×800, 390×844, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900 and 1920×1080. All 60 route/viewport combinations: one H1, Bricolage heading font, no horizontal document overflow and no observed broken images.

Desktop/home, services and products, mobile/contact and About screenshots reviewed. Mobile footer placement corrected after visual review. Additional public-deployment inspection follows below.

Keyboard/interaction checks: mobile menu opens and Escape closes with focus restored; illustrative AI brief updates heading/status; product viewer opens, next screen changes count, Tab and Shift+Tab loop within the dialog, actual-size zoom works, Escape closes and restores opener focus. Screens are only manually cycled. Navigation is usable without JavaScript; product images remain direct links. No autoplay, animated counters or external connections exist in the illustrative engagement.

Form: native required-field validation focuses name on empty submit. Isolated local success fixture verifies loading/disabled button, accepted response, cleared fields and status focus. Failure fixture verifies error state, re-enabled button and retained fields. These are **fixtures, not evidence of email delivery**.

14 Node tests pass: validation/consent/honeypot, method/origin/content-type/body limits, missing config, provider rejection/timeout/acknowledgment, no-JS confirmation, all internal links/assets/fragments and page metadata. Runtime/browser checks remain necessary in addition to these tests.

Reduced motion: the default experience is already static, with no timed animation or automatic scrolling. `prefers-reduced-motion: reduce` explicitly disables transitions/animations. The browser control exposes no motion-preference emulator; an OS preference toggle was not performed.

## Delivery limitation

No key is configured on the new project. Old website project has no environment variables. The existing browser Web3Forms key cannot be assumed to support a server handler: official docs require paid server usage/IP allowlisting. Direct server test was challenged (not accepted); exact test-subject search in `contact@virtelon.com` INBOX returned zero messages. No successful delivery is claimed. The form visibly explains configuration is pending; email link is available.

## Public deployment

Public URL: <https://virtelon-dark-production.vercel.app>. Deployment is in the new `virtelon-dark-production` project, not the original website project. The first verified deployment is `dpl_4m2C5o32crXooBd6mfKJLUBer57q`, associated with branch `codex/virtelon-dark-production` and implementation commit `7f0f6f741fb80ab7b50da15c573b7275975a2ca4`. Subsequent verification/configuration changes are committed separately; deployment metadata identifies the final source SHA.

All six routes passed the same ten-size matrix on the public URL: 60/60 combinations, actual viewport width confirmed, no overflow, no observed broken images, one H1 each. No console errors/warnings during normal page browsing. Public header navigation and a Services refresh worked; product detail's Bookings selector, 1470px image load, dialog and Escape worked. The first oversized batch timed out in the browser harness; it was not counted and all 60 checks were rerun in bounded batches.

`node test/verify-live.mjs` confirmed HTTP 200 on all six routes and 21 distinct linked resources including local fonts, JS/CSS, favicons, social card, robots and sitemap; canonical/OG/Twitter metadata and security headers present; missing route returns 404 with custom page, API GET returns 405, valid form with absent provider config returns 503, cross-origin POST returns 403. Synthetic public browser form test showed the explicit unconfigured error, retained fields, status focus and re-enabled send button. No delivery attempt is presented as a success. Expected 503 during that test is not a normal-page console defect.

Real local network failure was additionally tested by stopping the isolated 4183 test server after loading its form. Submission then showed the network-error message, retained fields and re-enabled button. No email was sent. The isolated success/failure fixtures are not in production execution paths.

Accessibility checks are manual/structural, not a certification: labelled inputs, required fields, consent, status announcements, skip link, visible focus, menu Escape, native dialog focus loop/restore and descriptive image alt text. Main palette contrast ratios: muted text 6.36–7.56:1, cobalt 5.35–6.35:1 and primary text 14.37–17.06:1 across the three dark surfaces. No automated axe audit or OS reduced-motion emulation was run.

Performance evidence: static output approximately 576 KiB including all page HTML, fonts, CRM captures and social card; combined browser JavaScript 10,941 bytes raw, CSS 28,358 bytes raw. No client framework, third-party trackers, hydration or hero bitmap. CRM captures are lazy-loaded and dimensions are declared. No Lighthouse/Core Web Vitals score is claimed; real-user metrics require real traffic.

Isolation: original root files have no Git diff; only `company-site/` is committed. Branch push triggered an automatic **preview** in the pre-existing Git-connected project, but its production alias was explicitly inspected and still points to original deployment `dpl_9VvTjFxVssmMzFEN3pzbh8hH1479` from 21 August 2026. Existing project settings timestamps/domains are unchanged. No custom domain, DNS or old production deployment was modified. Candidate remains `noindex, follow` until separately approved cutover and delivery setup.

Screenshots retained locally in this folder: `public-home-desktop.jpg`, `public-contact-unconfigured.jpg`, `local-services-desktop.jpg`. Screenshot binaries are ignored by Git.
