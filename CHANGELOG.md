# Changelog — VSMEKit

All notable changes to this project will be documented in this file.

## [0.5.0] - 2026-11-25 — Public MIT Open-Source Release (`v0.5.0`)
### Added
- Public MIT open-source release (`LICENSE`, `.github/workflows/ci.yml`, `README.md` gallery with 6 Chrome desktop/mobile screenshots in `docs/screenshots/`).
- `/api/health` and `/api/readyz` aliases alongside `/health` and `/readyz` (exempt from API rate limiting) for systemd, Caddy, Tailscale Funnel, and Portal health polling.

## [0.4.0] - 2026-11-25
### Added
- `Playwright` Chrome headless E2E verification suite (`playwright.config.ts`, `tests/e2e/vsmekit.spec.ts`) covering desktop (`1280×800`) and mobile (`390×844`) responsive viewports, `EN LTR / Limestone Parchment` & `AR RTL / Carbon Slate` persistence, Pre-2027 conditional & Buyer Over-Reach remediation workflows, atomic `VSME-YYYY-0001` sealing, UTF-8 BOM CSV downloads, and `/r/:code` public report views.
- Zero-cost `$0` deployment & open-source packaging (`wrangler.jsonc` Cloudflare Workers Static Assets, multi-stage `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `deploy/Caddyfile`, `deploy/.env.example`, `deploy/vsmekit.service`, `deploy/backup-sqlite.sh`, , `deploy/export-public-github.sh`, `README.md`, and `launch/DEPLOY-AND-SHARE.md`).

## [0.3.0] - 2026-11-25
### Added
- Bilingual (`EN LTR / AR RTL`) React + Vite + Tailwind CSS v4 studio UI (`index.html`, `src/main.tsx`, `src/index.css`, `src/lib/*`, `src/components/*`, `src/App.tsx`) with Limestone Parchment (light) and Carbon Slate (dark) themes and automatic `window.__VSMEKIT_BASE__` subpath support (`/vsmekit`).
- Custom inline SVG visualization (`VsmeShieldAndDisclosureSvg.tsx`) contrasting EU Omnibus I CSRD cutoffs (`> 1,000` FTE & `> EUR 450M`), `2027-01-01` Value-Chain Cap shield status, and Basic (`B1–B11`) vs Comprehensive (`C1–C9`) completion bars.
- Interactive `B1–B11` / `C1–C9` disclosure checklist, energy (`MWh`) & Scope 1/2/3 (`tCO2e`) intensity calculator, six VSME governance controls, drag-and-drop CWE-1236 buyer-request CSV triage panel, dual-mode persistence (`SQLite WAL` or `$0 localStorage`), atomic `VSME-YYYY-0001` sealing with `/r/:slugOrCode` share view, and A4 PDF print layout.

## [0.2.0] - 2026-11-25
### Added
- Bilingual Markdown readiness packet generator (`src/core/briefBuilder.ts` — `buildVsmeBriefMarkdown`) with full `B1–B11 / C1–C9` disclosure summary, 2027 Value-Chain Cap & Omnibus I metrics, controls matrix, buyer CSV audit table, and `SHA-256` canonical digest.
- Zero-dependency Node 22 `node:http` + `node:sqlite` (WAL) persistence backend (`server/db.mjs`, `server/app.mjs`, `server/app.d.mts`, `server/index.mjs`) with atomic `VSME-YYYY-0001` dossier numbering, reverse-proxy `BASE_PATH=/vsmekit` + `window.__VSMEKIT_BASE__` injection, rate limiting (`429`), and payload caps (`413`).
- Full HTTP API (`/health`, `/readyz`, `/api/presets`, `/api/shield`, `/api/audit-csv`, `/api/assess`, `/api/profiles`, `/api/assessments`, `/api/dossiers`, `/duplicate`, `/finalize|lock`, `brief.md`, CWE-1236 UTF-8 BOM `export.csv`, `/summary`, `/api/public/reports/:slugOrCode`) and Vitest integration suite (`tests/unit/vsmeServer.test.ts`).

## [0.1.0] - 2026-11-25
### Added
- Zero-dependency EU Voluntary Sustainability Reporting Standard (`Delegated Regulation (EU) 2026/1560` / `EFRAG VSME` & `Omnibus I Directive (EU) 2026/470`) core readiness auditor (`src/core/*`):
  - Scope & 2027 Value-Chain Cap Shield analyzer evaluating CSRD large-undertaking cutoff (`> 1,000` employees AND `> EUR 450,000,000` net turnover), statutory VSME eligibility (`<= 1,000` employees), `2027-01-01` value-chain cap activation, and buyer/bank over-reach detection (`Art. / Value-Chain Shield`).
  - Basic (`B1–B11`) and Comprehensive (`C1–C9`) disclosure coverage evaluator tracking Energy & Scope 1/2 GHG metrics (`MWh` & `tCO2e`), GHG intensity, workforce/safety/governance readiness, green-finance Comprehensive trigger, and 6 VSME governance controls.
  - Multi-customer/buyer sustainability request & supplier portfolio CSV auditor with CWE-1236 spreadsheet formula-prefix neutralization and `UTF-8 BOM` export, canonical `SHA-256` digest, and three realistic EU scenarios with explicit non-regulator / non-assurance disclaimer.
