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

Pending deployment verification; this section is updated only after the public URL is tested.
