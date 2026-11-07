# Virtelon SEO — audit, implementation and plan (2026-11-07)

## 0. Hosting reality (verified)
- `virtelon.com` resolves to **145.79.211.228 (Hostinger)**. It is NOT served by Vercel.
- Vercel projects `virtelon-dark-production` and `virtelon-website` only have `*.vercel.app` domains. `virtelon-dark-production` holds an unlaunched redesign (`company-site/`). Shubham chose to optimise the **live Hostinger site** (repo root).
- Production deploy = upload `hostinger-dist/` contents to Hostinger `public_html`. Nothing was deployed by Claude.

## 1. Before → after (raw HTML, no JavaScript)
| Check | Before (live) | After (`hostinger-dist/`) |
|---|---|---|
| /solutions … /start raw HTML | same `index.html` shell for all 6 routes; title/description/canonical only set by JS | 6 separate files, each with its own title, description, canonical, OG/Twitter, JSON-LD |
| Canonical in raw HTML | empty `<link rel="canonical" id="canonicalLink" />` | absolute self-canonical on every page |
| H1 per URL (raw) | 7 H1s on every route (all hidden pages shipped) | exactly 1 |
| Duplicate content | every route contained every page's content | each route contains only its own content |
| Unknown URL | SPA fallback limited to 6 routes; other URLs depended on host default | real `404` with `ErrorDocument 404 /404.html` (noindex) |
| Tool pages | canonical `…/tools.html` etc., no site navigation | clean `/tools`, `/whatsapp-tool`, `/roi-calculator`; one-hop 301 from `.html`; crawlable site links in footer; BreadcrumbList |
| Sitemap | 3 `.html` URLs | 10 clean canonical URLs |
| HTTP→HTTPS + www | two separate rules (possible 2 hops) | single hop to `https://virtelon.com` |
| Logo | `<div>` with click handler (not crawlable) | `<a href="/">` |
| llms.txt | missing | factual summary |

Automated audit (`npm run seo:audit`, local build): **PASS** — all 10 sitemap URLs 200, unique titles/descriptions/canonicals, 1 H1 each, valid JSON-LD, all internal links/assets 200, no soft 404, legacy redirects single-hop, no console errors, no horizontal overflow at 1440 and 390.

Lighthouse 12.8.2 (mobile preset, local server — production numbers will differ; Hostinger adds network latency/compression):
| URL | Perf | A11y | Best pr. | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| / | 99 | 100 | 100 | 100 | 2.1 s | 0 |
| /solutions | 99 | 100 | 100 | 100 | 2.1 s | 0 |
| /industries | 99 | 100 | 100 | 100 | 2.1 s | 0 |
| /products | 99 | 100 | 100 | 100 | 2.1 s | 0 |
| /work | 98 | 100 | 100 | 100 | 2.3 s | 0 |
| /company | 98 | 100 | 100 | 100 | 2.3 s | 0 |
| /start | 99 | 100 | 100 | 100 | 2.1 s | 0 |
| /tools | 100 | 100 | 100 | 100 | 1.5 s | 0 |

## 2. Canonical route inventory
`/`, `/solutions`, `/industries`, `/products`, `/work`, `/company`, `/start`, `/tools`, `/whatsapp-tool`, `/roi-calculator`. Redirected: `/index.html`, `/*.html` for these routes, trailing-slash variants, `http://`, `www.`.

## 3. Keyword-to-page map (intent-based; volumes NOT measured — no Ahrefs/GSC access)
| URL | Primary | Secondary | Intent | Buyer | Title | Cannibalisation |
|---|---|---|---|---|---|---|
| / | Virtelon; custom software company India | Virtelon Private Limited; CRM & AI automation company | brand + navigational | all | Custom Software, CRM & AI Automation Company \| Virtelon | low |
| /solutions | custom CRM development | AI automation for business; business dashboards; workflow automation | commercial | SMB owners, ops heads | AI Automation, CRM & Business Software \| Virtelon | medium with /products — keep /solutions = services, /products = packaged systems |
| /industries | industry CRM India | hospitality CRM; salon CRM; manufacturing operations software | commercial | vertical owners | Industry Software & CRM Solutions in India \| Virtelon | low |
| /products | ready-made CRM for business | venue CRM; hostel management CRM; resort CRM | commercial | owners comparing tools | Ready-to-Build CRM & Business Software \| Virtelon | see /solutions |
| /work | CRM portfolio; custom software examples | hospitality software demos | trust | evaluators | Custom Software & CRM Portfolio \| Virtelon | low |
| /company | about Virtelon | Virtelon founders; Shubham Raj Virtelon | brand | evaluators, hires | About Virtelon \| Software & AI Company in India | low |
| /start | hire software developer for CRM | get a quote custom software | transactional | ready buyers | Start a Software Project with Virtelon | low |
| /tools | free business tools | — | informational | SMB owners | Free Business Tools for Growing Companies \| Virtelon | low |
| /whatsapp-tool | WhatsApp link generator; WhatsApp QR code generator | click to chat link | informational/tool | SMB owners | Free WhatsApp Link & QR Code Generator \| Virtelon | low |
| /roi-calculator | missed lead cost calculator | cost of missed calls | informational/tool | SMB owners | Missed-Lead Cost Calculator for Businesses \| Virtelon | low |

SERP observations (web search, 2026-11-07): "wedding venue / banquet CRM India" results are mostly directories (Capterra, Techjockey) and a few niche SaaS sites — a winnable niche for a dedicated, genuinely detailed page. "Custom CRM development company India" is dominated by large agencies' guides (custom vs ready-made, CRM cost in India) — compete with specific, proof-based guides rather than a generic service page.

Not created on purpose: city pages, separate industry pages without real content (thin/doorway risk). Recommended next real pages (only with real screenshots/proof): `/products/venueos`, `/products/hostel-growth-os`, `/products/resort-crm`.

## 4. Structured data
Organization (legal name, CIN-consistent name, logo, founders, contact, Instagram), WebSite, per-page WebPage + BreadcrumbList, ItemList of product demos on /work, CollectionPage on /tools, WebApplication on tool pages. No ratings, reviews, awards, LocalBusiness or address claims. Validate after upload: https://search.google.com/test/rich-results and https://validator.schema.org.

**Public team (confirmed by Shubham, 2026-11-07):** Shubham Raj — Founder; Vijayant Priyadershi — Co-founder; Navneet Jha — Co-founder (initials avatar, no profile link until an approved photo/URL exists). Sanskar Mishra removed from the team section and all structured data; no employees or interns listed. Add the LinkedIn company page to `sameAs` once it exists.

## 5. Search Console checklist (manual — needs Shubham's Google login)
1. Search Console → Add property → **Domain** `virtelon.com` (DNS TXT at Hostinger) or URL-prefix `https://virtelon.com/`.
2. Sitemaps → submit `https://virtelon.com/sitemap.xml`.
3. URL Inspection → Request indexing, in order: `/`, `/solutions`, `/products`, `/industries`, `/work`, `/company`, `/start`, `/tools`, `/whatsapp-tool`, `/roi-calculator`.
4. After 7–14 days: Pages report → check "Duplicate without user-selected canonical" and "Crawled – currently not indexed" are falling; old `.html` URLs should show "Page with redirect".
5. Weekly: Performance → query "virtelon", CTR of brand query, impressions per page. Core Web Vitals report once field data exists.
6. Optional: Bing Webmaster Tools → import from Search Console.
7. GA4: no tag on the site. Add only after deciding on a cookie/consent approach.

## 6. 30/60/90-day content plan (only with real proof)
| Days | Piece | Primary keyword | Intent / funnel | Links to | Proof needed |
|---|---|---|---|---|---|
| 0–30 | VenueOS product page | wedding venue CRM / banquet hall booking software | commercial / BOFU | /products, /start | real demo screenshots, feature list that exists |
| 0–30 | Custom CRM vs ready-made CRM for Indian SMBs | custom CRM vs ready-made CRM | informational / MOFU | /solutions | honest cost/time ranges Virtelon actually quotes |
| 0–30 | Google Business Profile + Instagram link-in-bio to /start | brand | — | / | — |
| 31–60 | Hostel management CRM page | hostel management software India | commercial | /products | Hostel GrowthOS demo |
| 31–60 | Resort/hotel operations CRM page | resort CRM / hotel CRM India | commercial | /products | Resort & Spa CRM demo |
| 31–60 | How much does a custom CRM cost in India | CRM development cost India | informational | /start | real pricing bands |
| 61–90 | Missed follow-ups: the real cost for venues/hotels | missed enquiry follow-up | informational / TOFU | /roi-calculator | calculator method |
| 61–90 | WhatsApp automation for local businesses (what is allowed, what it costs) | WhatsApp automation for business | informational | /solutions, /whatsapp-tool | Meta policy citations |
| 61–90 | First real case study (with client approval) | <client vertical> CRM case study | trust / BOFU | /work | client consent + real before/after |

## 7. Blockers / manual steps
1. **Upload**: Hostinger hPanel → File Manager → `public_html` → back up current files → upload everything inside `hostinger-dist/` (enable "show hidden files" for `.htaccess`). Remove old `index.html` content is replaced; keep `/api` only if used elsewhere.
2. **Git push**: push from the Mac (commands in the handover message). Pushing `main` also triggers the Vercel `virtelon-website` project (vercel.app only — harmless, not the domain).
3. **Domain expiry**: hPanel showed virtelon.com expiring **2026-11-25**. Renew before anything else.
4. **Search Console / GA4 / Bing**: user login required (section 5).
5. Facts to confirm: LinkedIn company URL; approved photo/LinkedIn for Navneet Jha.

## 8. Production deployment record — 2026-11-07
- Host: Hostinger, `domains/virtelon.com/public_html` (File Browser).
- Backup before deploy: `~/backups/public_html_2026-11-07_pre-seo/` (full copy of the previous public_html, outside the web root). Restore = copy its contents back into public_html.
- Deployed from commit `c1afb51` (`hostinger-dist/`): `.htaccess`, `404.html`, `index.html`, `solutions.html`, `industries.html`, `products.html`, `work.html`, `company.html`, `start.html`, `tools.html`, `whatsapp-tool.html`, `roi-calculator.html`, `sitemap.xml`, `robots.txt`, `llms.txt`. `assets/`, `team/shubham.jpg`, `team/vijayant.jpg`, `logo.png`, `site.webmanifest` were already identical on the server.
- Removed after deploy (on Shubham's instruction; copies remain in the backup): `team/sanskar.jpg`, `vercel.json`, `virtelon-hostinger-final.zip`.
- Live verification (https://virtelon.com, raw HTML): 10/10 sitemap URLs 200 with self-canonical, unique title/description, one H1, valid JSON-LD; 25 internal links/assets 200; `/index.html`, `/tools.html`, `/solutions.html`, `/solutions/`, `/whatsapp-tool.html` 301 to clean URLs; unknown URLs 404; team section shows Shubham Raj, Vijayant Priyadershi, Navneet Jha, no Sanskar anywhere; no console errors; no horizontal overflow at 1440 and 390 px; contact form markup, Web3Forms endpoint and honeypot present (no live test submission sent).
- PageSpeed Insights (live, mobile): `/` 100/100/100/100 (LCP 1.1 s, TBT 0 ms, CLS 0); `/company` 99/100/100/100.

## 9. Google Search Console — done 2026-11-07
- Property: URL-prefix `https://virtelon.com/`, verified by HTML file `google4fbb1a80e54bfb19.html` (kept in public_html and generated by the build — do not delete).
- Sitemap `https://virtelon.com/sitemap.xml` submitted successfully.
- Indexing requested for all 10 canonical URLs. Before the request, `/` and `/industries` were already on Google; `/solutions` was not.
- Next: check Pages report and the "virtelon" query in Performance after 7–14 days. A Domain property (DNS TXT) can be added later if www/subdomain data is wanted.
