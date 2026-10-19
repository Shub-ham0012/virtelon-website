# Virtelon dark production candidate

Six-page company candidate governed by `brand/BRAND_SYSTEM.md` in the parent workspace. The October 19 pass replaces the earlier V8 cobalt/Bricolage direction with Ink, Warm Ivory, Signal Amber, Manrope, Instrument Serif and IBM Plex Mono. This folder is independent of the repository's original website. The existing Git integration can automatically build previews when a branch is pushed; no preview should be promoted to that project's production aliases.

## Stack and editing

Node 24 builds plain HTML pages with a shared header, footer, metadata and helpers in `build.mjs`. Homepage content lives in `src/home.html`; base layouts live in `public/styles.css` and `public/pages.css`, with the canonical brand and new editorial composition in `public/brand.css`. Small vanilla JavaScript enhances the mobile menu, real demo-image viewer, form and homepage opening. No browser framework, client routing, analytics or database is needed.

The opening uses `motion-timeline.js` (deterministic state model) and `intro.js` (small Canvas 2D renderer). Its 5.2-second arc is signal → scattered → connected → identity → moving → settled. Skip, Escape and keyboard entry reveal the content; a session marker prevents automatic repeats. Reduced motion stays static, and hidden/offscreen work pauses. No video, particle library or loading percentage is used. See `qa/MOTION-2026-10-19.md` for current evidence and remaining release checks; earlier QA records describe the previous design, not this pass.

```sh
cd company-site
npm ci
npm run build
npm test
npm run dev
```

Preview: `http://127.0.0.1:4182`. The preview server supports clean URLs, real 404 status and the same contact handler. It is not the production server.

## Routes

`/`, `/services`, `/products`, `/resort-crm`, `/about`, `/contact`. Vercel serves the custom `404.html` for missing routes. Privacy information lives at `/contact#privacy`.

## Delivery configuration — required before form launch

The production form intentionally has no delivery key configured. It returns a clear 503 error rather than pretending to send; the page explicitly directs visitors to `contact@virtelon.com`. No entered data is stored locally or logged by this application.

The existing live site's public Web3Forms key was discovered, but **not copied into the new project**. A direct server-side test returned an upstream browser challenge, not a delivery acknowledgment, and the test subject was absent from the connected mailbox. Current Web3Forms documentation requires a paid plan and allowlisted server IPs for server submissions: <https://docs.web3forms.com/getting-started/api-reference>.

To activate the implemented handler: confirm a Web3Forms account/key targeting `contact@virtelon.com`, paid server-side support, and a supported allowlisted egress arrangement for Vercel. Then set encrypted `WEB3FORMS_ACCESS_KEY` on **only** project `prj_g1SBj2JrwWRb4UwRxYHDcEZx8EdD`, production/preview as appropriate, and redeploy. Verify actual mailbox receipt. Do not simply paste the current free/browser key and assume server delivery will work. Alternatively implement a verified SMTP/transactional mail transport once its credentials are supplied. No purchase or paid-plan change was made.

`FORM_TEST_MODE=success` or `failure` affects only `dev.mjs`: a deliberately isolated local fixture exercises UI states without sending mail. These fixtures are not used by the deployed function. Production uses `api/contact.js` only; validation, consent, body limits, same-origin browser checks, honeypot, timeout and provider acceptance checks are tested. Provider anti-abuse controls remain required; origin and honeypot are not a distributed rate limiter.

## Deployment isolation

- Git remote: `https://github.com/Shub-ham0012/virtelon-website.git`
- Dedicated branch: `codex/virtelon-dark-production`
- New Vercel project: `virtelon-dark-production` / `prj_g1SBj2JrwWRb4UwRxYHDcEZx8EdD`
- Team: Virtelon / `team_sSDGSGGOjFFEZiLKVHwAs1xY`
- Project root: `company-site`; build `npm run build`; output `dist`; Node 24.

From the **repository root**, explicitly link and inspect this project, then deploy with this folder's configuration (the original root `vercel.json` belongs to the old site):

```sh
npx vercel@63.1.2 link --yes --project virtelon-dark-production --scope virtelon
npx vercel@63.1.2 project inspect --non-interactive
npx vercel@63.1.2 deploy --prod --yes --scope virtelon --project prj_g1SBj2JrwWRb4UwRxYHDcEZx8EdD --local-config company-site/vercel.json
```

The new public candidate is deliberately `noindex, follow` until an approved domain cutover, to avoid competing with the current site. Canonical, OG/Twitter and sitemap URLs use `SITE_URL` (default `https://virtelon-dark-production.vercel.app`). On approved cutover, set `SITE_URL=https://virtelon.com`, `INDEXABLE=true`, configure/verify mail delivery, then explicitly attach the domain and redeploy. Domain movement is a separate approval; it has **not** been performed.

## Assets and evidence

The original silver mark and authentic CRM captures are unchanged. Images are labelled demo branding / fictional sample data. Fonts are locally hosted with their retained licenses. Favicons are derived from the mark without changing the primary asset; the social card is a repo-native vector rendered to PNG. See `CREDIBILITY.md` and `qa/QA.md` for claim boundaries and tests.
