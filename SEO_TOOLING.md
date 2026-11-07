# SEO tooling — Virtelon website (2026-11-07)

## What this repository uses
| Tool | Version | Why | How it is installed | Remove |
|---|---|---|---|---|
| Node.js (built-in `fs`, `vm`, `http`) | 20+ | `scripts/build-hostinger.mjs` pre-renders every route; `scripts/serve-dist.mjs` mirrors the Hostinger `.htaccess` locally | none (runtime) | — |
| Playwright + Chromium | already on the build machine | `npm run seo:audit` browser pass: console errors, horizontal overflow at 1440×900 and 390×844, canonical after JS | not added to package.json; uses a globally available `playwright` | nothing to remove |
| Lighthouse | 12.8.2, pinned | performance / accessibility / best-practices / SEO scores | run ad hoc: `npx lighthouse@12.8.2 <url>` (not a project dependency) | nothing to remove |

No new runtime dependency was added to the site. No paid service, subscription or account was created.

## Commands
- `npm run build` → writes `hostinger-dist/` (upload its CONTENTS, including the hidden `.htaccess`, into Hostinger `public_html`)
- `npm run preview` → build + local server on http://127.0.0.1:4310 with the same clean-URL / 301 / 404 rules
- `npm run seo:audit` → build, serve, crawl every sitemap URL, exit 1 on any critical defect
- `SEO_LASTMOD=YYYY-MM-DD npm run build` → pin sitemap lastmod (default: build date)

## Connectors discovered in the Claude environment
| Connector | Status | Used for |
|---|---|---|
| Vercel MCP | connected | found that **neither** Vercel project serves virtelon.com |
| GitHub (session repo attach) | push access request was blocked in this session | commits must be pushed from Shubham's Mac |
| Google Search Console | not connected | manual steps in SEO_AUDIT_AND_PLAN.md |
| GA4 | not connected; no GA4/GTM tag on the site | — |
| Ahrefs / Windsor.ai | not available | keyword volumes NOT measured; map is intent-based |
| Hostinger | no API/FTP access | upload is a manual step |
