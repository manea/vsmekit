import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  assessVsmeReadiness,
  auditBuyerRequestsCsv,
  buildVsmeBriefMarkdown,
  evaluateValueChainShield,
  exportBuyerRequestsAuditCsv,
  LEGAL_DISCLAIMER_AR,
  LEGAL_DISCLAIMER_EN,
  sanitizeCsvCell,
  VSME_PRESETS,
  VSME_TOOL_VERSION,
} from '../src/core/index.ts';
import {
  allocateDossierCodeTx,
  closeDb,
  createDb,
  generatePublicSlug,
  getDbStats,
  withImmediateTransaction,
} from './db.mjs';

const DEFAULT_MAX_BODY_BYTES = 512 * 1024;
const DEFAULT_RATE_LIMIT_MAX = 300;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

const VALID_ENTITY_KINDS = new Set([
  'micro_undertaking',
  'sme_unlisted',
  'mid_market_up_to_1000',
  'large_above_1000_csrd',
]);

const VALID_TIERS = new Set(['basic_b1_b11', 'comprehensive_c1_c9']);

const VALID_BUYER_REQUESTS = new Set([
  'none',
  'vsme_basic',
  'vsme_comprehensive',
  'full_esrs_or_custom_excess',
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function normalizeBasePath(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  if (!cleaned || cleaned === '/') return '';
  if (!cleaned.startsWith('/')) cleaned = `/${cleaned}`;
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

function stripBasePath(pathname, basePath) {
  if (!basePath) return pathname || '/';
  if (pathname === basePath) return '/';
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || '/';
  }
  return pathname || '/';
}

function getSecurityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'",
    ...extra,
  };
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...getSecurityHeaders(extraHeaders),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendText(res, status, contentType, body, extraHeaders = {}, method = 'GET') {
  res.writeHead(status, {
    ...getSecurityHeaders(extraHeaders),
    'Content-Type': contentType,
  });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

function injectBaseTagHtml(html, basePath) {
  let updated = html;
  if (basePath) {
    updated = updated.replace(/(href|src)="\/(?!\/)/g, `$1="${basePath}/`);
  }
  const safeBase = JSON.stringify(basePath).replace(/</g, '\\u003c');
  const snippet = `<script>window.__VSMEKIT_BASE__=${safeBase};</script>`;
  if (updated.includes('</head>')) {
    return updated.replace('</head>', `${snippet}\n</head>`);
  }
  if (updated.includes('<body')) {
    return updated.replace('<body', `${snippet}\n<body`);
  }
  return `${snippet}\n${updated}`;
}

function buildFallbackShellHtml(basePath) {
  const apiPrefix = `${basePath}/api`;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VSMEKit v${VSME_TOOL_VERSION} — بوابة الجاهزية ودرع سلسلة القيمة الأوروبي</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:760px;margin:2.5rem auto;padding:0 1.25rem;line-height:1.6;background:#0b1220;color:#e5edf9">
  <h1>VSMEKit v${VSME_TOOL_VERSION}</h1>
  <p>EU Voluntary Sustainability Reporting Standard ((EU) 2026/1560 / EFRAG VSME) &amp; 2027 &le;1,000-Employee Value-Chain Cap Engine.</p>
  <p><strong>HTTP/SQLite WAL Backend Active</strong> — Base Path: <code>${basePath || '/'}</code> | API Root: <code>${apiPrefix}</code></p>
  <p style="font-size:.9rem;color:#9db2ce">${LEGAL_DISCLAIMER_AR}</p>
</body>
</html>`;
}

async function readJsonBody(req, maxBodyBytes) {
  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    req.resume();
    throw new HttpError(
      413,
      'PAYLOAD_TOO_LARGE',
      `Request body exceeds limit of ${maxBodyBytes} bytes.`,
    );
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk) => {
      if (settled) return;
      totalBytes += chunk.length;
      if (totalBytes > maxBodyBytes) {
        settled = true;
        req.resume();
        reject(
          new HttpError(413, 'PAYLOAD_TOO_LARGE', `Request body exceeds limit of ${maxBodyBytes} bytes.`),
        );
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new HttpError(400, 'INVALID_JSON', 'Request body must be a JSON object.'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new HttpError(400, 'INVALID_JSON', 'Malformed JSON request body.'));
      }
    });

    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(new HttpError(400, 'READ_ERROR', err.message));
    });
  });
}

function asNonNegativeNumber(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Numeric metrics must be finite and >= 0.');
  }
  return n;
}

function normalizeStringArray(val, fallback) {
  if (val === undefined) return [...fallback];
  if (!Array.isArray(val)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Disclosure/control arrays must be arrays of strings.');
  }
  return val.map((item) => String(item).trim()).filter(Boolean);
}

function resolveAssessmentInput(body, baseInput = null) {
  let presetBase = baseInput;
  if (body.presetId !== undefined) {
    const found = VSME_PRESETS.find((p) => p.id === String(body.presetId));
    if (!found) {
      throw new HttpError(404, 'PRESET_NOT_FOUND', `Unknown presetId: ${body.presetId}`);
    }
    presetBase = found.input;
  }

  const defaults = presetBase || VSME_PRESETS[0].input;
  const rawInput =
    body.input && typeof body.input === 'object' && !Array.isArray(body.input)
      ? { ...body, ...body.input }
      : body;

  const organizationName =
    rawInput.organizationName !== undefined
      ? String(rawInput.organizationName).trim()
      : defaults.organizationName;
  if (!organizationName) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'organizationName is required.');
  }

  const reportingPeriodStart =
    rawInput.reportingPeriodStart !== undefined
      ? String(rawInput.reportingPeriodStart).trim()
      : defaults.reportingPeriodStart;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportingPeriodStart)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'reportingPeriodStart must use ISO YYYY-MM-DD format.',
    );
  }

  const entityKind =
    rawInput.entityKind !== undefined ? String(rawInput.entityKind).trim() : defaults.entityKind;
  if (!VALID_ENTITY_KINDS.has(entityKind)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `Unsupported entityKind: ${entityKind}`);
  }

  const targetTier =
    rawInput.targetTier !== undefined ? String(rawInput.targetTier).trim() : defaults.targetTier;
  if (!VALID_TIERS.has(targetTier)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `Unsupported targetTier: ${targetTier}`);
  }

  const incomingBuyerRequest =
    rawInput.incomingBuyerRequest !== undefined
      ? String(rawInput.incomingBuyerRequest).trim()
      : defaults.incomingBuyerRequest;
  if (!VALID_BUYER_REQUESTS.has(incomingBuyerRequest)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `Unsupported incomingBuyerRequest: ${incomingBuyerRequest}`,
    );
  }

  const seeksGreenFinancingOrScope3Buyer =
    rawInput.seeksGreenFinancingOrScope3Buyer !== undefined
      ? Boolean(rawInput.seeksGreenFinancingOrScope3Buyer)
      : defaults.seeksGreenFinancingOrScope3Buyer;

  return {
    organizationName,
    reportingPeriodStart,
    employeeHeadcount: Math.round(
      asNonNegativeNumber(rawInput.employeeHeadcount, defaults.employeeHeadcount),
    ),
    annualNetTurnoverEur: asNonNegativeNumber(
      rawInput.annualNetTurnoverEur,
      defaults.annualNetTurnoverEur,
    ),
    entityKind,
    targetTier,
    incomingBuyerRequest,
    seeksGreenFinancingOrScope3Buyer,
    completedBasicDisclosures: normalizeStringArray(
      rawInput.completedBasicDisclosures,
      defaults.completedBasicDisclosures,
    ),
    completedComprehensiveDisclosures: normalizeStringArray(
      rawInput.completedComprehensiveDisclosures,
      defaults.completedComprehensiveDisclosures,
    ),
    energyMwh: asNonNegativeNumber(rawInput.energyMwh, defaults.energyMwh),
    scope1Tco2e: asNonNegativeNumber(rawInput.scope1Tco2e, defaults.scope1Tco2e),
    scope2Tco2e: asNonNegativeNumber(rawInput.scope2Tco2e, defaults.scope2Tco2e),
    scope3Tco2e: asNonNegativeNumber(rawInput.scope3Tco2e, defaults.scope3Tco2e),
    antiCorruptionConvictionsCount: Math.round(
      asNonNegativeNumber(
        rawInput.antiCorruptionConvictionsCount,
        defaults.antiCorruptionConvictionsCount,
      ),
    ),
    buyerRequestsCsv:
      rawInput.buyerRequestsCsv !== undefined
        ? rawInput.buyerRequestsCsv === null || rawInput.buyerRequestsCsv === ''
          ? undefined
          : String(rawInput.buyerRequestsCsv)
        : defaults.buyerRequestsCsv,
    implementedControls: normalizeStringArray(
      rawInput.implementedControls,
      defaults.implementedControls,
    ),
    notes:
      rawInput.notes !== undefined
        ? String(rawInput.notes).trim() || undefined
        : defaults.notes,
  };
}

function mapProfileRow(row) {
  return {
    id: row.id,
    organizationName: row.organization_name,
    entityKind: row.entity_kind,
    reportingPeriodStart: row.reporting_period_start,
    employeeHeadcount: row.employee_headcount,
    annualNetTurnoverEur: row.annual_net_turnover_eur,
    defaultTier: row.default_tier,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAssessmentRow(row) {
  return {
    id: row.id,
    profileId: row.profile_id ?? null,
    dossierCode: row.dossier_code,
    title: row.title,
    organizationName: row.organization_name,
    reportingPeriodStart: row.reporting_period_start,
    employeeHeadcount: row.employee_headcount,
    annualNetTurnoverEur: row.annual_net_turnover_eur,
    entityKind: row.entity_kind,
    targetTier: row.target_tier,
    status: row.status,
    readinessScore: row.readiness_score,
    hoursSavedByCap: row.hours_saved_by_cap,
    canonicalText: row.canonical_text,
    dossierSha256: row.dossier_sha256,
    publicSlug: row.public_slug ?? null,
    lockedAt: row.locked_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    input: JSON.parse(row.input_json),
    result: JSON.parse(row.result_json),
  };
}

function findAssessmentRow(db, idOrCode) {
  const decoded = decodeURIComponent(String(idOrCode || '')).trim();
  if (!decoded) return null;
  if (/^\d+$/.test(decoded)) {
    return db.prepare('SELECT * FROM assessments WHERE id = ?').get(Number(decoded)) ?? null;
  }
  return db.prepare('SELECT * FROM assessments WHERE dossier_code = ?').get(decoded) ?? null;
}

function buildFallbackSummaryCsv(item) {
  const header = [
    'dossier_code',
    'organization_name',
    'reporting_period_start',
    'employee_headcount',
    'entity_kind',
    'target_tier',
    'status',
    'readiness_score',
    'hours_saved_by_cap',
    'dossier_sha256',
  ].join(',');
  const row = [
    sanitizeCsvCell(item.dossierCode),
    sanitizeCsvCell(item.organizationName),
    sanitizeCsvCell(item.reportingPeriodStart),
    sanitizeCsvCell(item.employeeHeadcount),
    sanitizeCsvCell(item.entityKind),
    sanitizeCsvCell(item.targetTier),
    sanitizeCsvCell(item.status),
    sanitizeCsvCell(item.readinessScore),
    sanitizeCsvCell(item.hoursSavedByCap),
    sanitizeCsvCell(item.dossierSha256),
  ].join(',');
  return `\uFEFF${header}\n${row}\n`;
}

export function createApp(options = {}) {
  const startedAtMs = Date.now();
  const basePath = normalizeBasePath(
    options.basePath !== undefined ? options.basePath : process.env.BASE_PATH || '',
  );
  const maxBodyBytes = Number(options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES);
  const rateLimitMax = Number(options.rateLimitMax ?? DEFAULT_RATE_LIMIT_MAX);
  const rateLimitWindowMs = Number(options.rateLimitWindowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS);
  const staticDir = path.resolve(
    options.staticDir || path.resolve(import.meta.dirname, '..', 'dist'),
  );
  const db = createDb({ dbPath: options.dbPath, dataDir: options.dataDir });

  const rateBuckets = new Map();

  function checkRateLimit(req) {
    if (rateLimitMax <= 0) return;
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '')).split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const now = Date.now();
    const bucket = rateBuckets.get(clientIp);
    if (!bucket || now - bucket.windowStart >= rateLimitWindowMs) {
      rateBuckets.set(clientIp, { windowStart: now, count: 1 });
      return;
    }
    bucket.count += 1;
    if (bucket.count > rateLimitMax) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many API requests; please wait and retry.');
    }
  }

  function tryServeStatic(res, routePath, method = 'GET') {
    const indexPath = path.join(staticDir, 'index.html');
    const cleanRel = routePath.replace(/^\/+/, '');
    if (cleanRel && !cleanRel.startsWith('api/')) {
      const candidate = path.resolve(staticDir, cleanRel);
      if (
        candidate.startsWith(`${staticDir}${path.sep}`) &&
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile()
      ) {
        const ext = path.extname(candidate).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        if (ext === '.html') {
          const html = injectBaseTagHtml(fs.readFileSync(candidate, 'utf8'), basePath);
          sendText(res, 200, mime, html, { 'Cache-Control': 'no-cache' }, method);
          return true;
        }
        const buf = fs.readFileSync(candidate);
        res.writeHead(200, {
          ...getSecurityHeaders(),
          'Content-Type': mime,
          'Content-Length': buf.byteLength,
          'Cache-Control': cleanRel.startsWith('assets/')
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=300',
        });
        if (method === 'HEAD') {
          res.end();
          return true;
        }
        res.end(buf);
        return true;
      }
    }

    if (fs.existsSync(indexPath)) {
      const html = injectBaseTagHtml(fs.readFileSync(indexPath, 'utf8'), basePath);
      sendText(res, 200, 'text/html; charset=utf-8', html, { 'Cache-Control': 'no-cache' }, method);
      return true;
    }

    const fallbackHtml = injectBaseTagHtml(buildFallbackShellHtml(basePath), basePath);
    sendText(
      res,
      200,
      'text/html; charset=utf-8',
      fallbackHtml,
      { 'Cache-Control': 'no-cache' },
      method,
    );
    return true;
  }

  async function handleRequest(req, res) {
    const method = (req.method || 'GET').toUpperCase();
    const urlObj = new URL(req.url || '/', 'http://127.0.0.1');
    const routePath = stripBasePath(urlObj.pathname, basePath);

    if (method === 'GET' && (routePath === '/health' || routePath === '/api/health')) {
      return sendJson(res, 200, {
        ok: true,
        service: 'vsmekit',
        version: VSME_TOOL_VERSION,
        basePath,
        uptimeSec: Math.round((Date.now() - startedAtMs) / 1000),
        db: getDbStats(db),
      });
    }

    if (method === 'GET' && (routePath === '/readyz' || routePath === '/api/readyz')) {
      try {
        const check = db.prepare('SELECT 1 AS ready').get();
        const stats = getDbStats(db);
        if (Number(check?.ready) !== 1) {
          throw new Error('SQLite readiness probe failed.');
        }
        return sendJson(res, 200, {
          ok: true,
          ready: true,
          service: 'vsmekit',
          version: VSME_TOOL_VERSION,
          journalMode: stats.journalMode,
        });
      } catch (err) {
        return sendJson(res, 503, {
          ok: false,
          ready: false,
          error: 'DB_UNAVAILABLE',
          message: err instanceof Error ? err.message : 'Database unavailable',
        });
      }
    }

    if (routePath.startsWith('/api/')) {
      checkRateLimit(req);
    }

    if (method === 'GET' && routePath === '/api/presets') {
      return sendJson(res, 200, {
        ok: true,
        toolName: 'VSMEKit',
        version: VSME_TOOL_VERSION,
        legalDisclaimerEn: LEGAL_DISCLAIMER_EN,
        legalDisclaimerAr: LEGAL_DISCLAIMER_AR,
        presets: VSME_PRESETS,
      });
    }

    if (method === 'POST' && routePath === '/api/shield') {
      const body = await readJsonBody(req, maxBodyBytes);
      const input = resolveAssessmentInput(body);
      const { shield, findings } = evaluateValueChainShield(input);
      return sendJson(res, 200, {
        ok: true,
        toolName: 'VSMEKit',
        version: VSME_TOOL_VERSION,
        legalDisclaimerEn: LEGAL_DISCLAIMER_EN,
        legalDisclaimerAr: LEGAL_DISCLAIMER_AR,
        shield,
        findings,
      });
    }

    if (method === 'POST' && routePath === '/api/audit-csv') {
      const body = await readJsonBody(req, maxBodyBytes);
      const csv = typeof body.csv === 'string' ? body.csv : '';
      if (!csv.trim()) {
        throw new HttpError(400, 'EMPTY_CSV', 'Field "csv" must contain a non-empty CSV string.');
      }
      const audit = auditBuyerRequestsCsv(csv);
      const exportCsv = exportBuyerRequestsAuditCsv(audit);
      return sendJson(res, 200, {
        ok: true,
        toolName: 'VSMEKit',
        version: VSME_TOOL_VERSION,
        legalDisclaimerEn: LEGAL_DISCLAIMER_EN,
        legalDisclaimerAr: LEGAL_DISCLAIMER_AR,
        audit,
        exportCsv,
      });
    }

    if (method === 'POST' && routePath === '/api/assess') {
      const body = await readJsonBody(req, maxBodyBytes);
      const input = resolveAssessmentInput(body);
      const assessment = await assessVsmeReadiness(input);
      return sendJson(res, 200, {
        ok: true,
        input,
        assessment,
      });
    }

    // Profiles CRUD
    if (routePath === '/api/profiles' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM profiles ORDER BY updated_at DESC, id DESC').all();
      return sendJson(res, 200, {
        ok: true,
        items: rows.map(mapProfileRow),
        total: rows.length,
      });
    }

    if (routePath === '/api/profiles' && method === 'POST') {
      const body = await readJsonBody(req, maxBodyBytes);
      const organizationName = String(body.organizationName || '').trim();
      if (!organizationName) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'organizationName is required.');
      }
      const entityKind = body.entityKind ? String(body.entityKind).trim() : 'sme_unlisted';
      if (!VALID_ENTITY_KINDS.has(entityKind)) {
        throw new HttpError(400, 'VALIDATION_ERROR', `Unsupported entityKind: ${entityKind}`);
      }
      const defaultTier = body.defaultTier ? String(body.defaultTier).trim() : 'basic_b1_b11';
      if (!VALID_TIERS.has(defaultTier)) {
        throw new HttpError(400, 'VALIDATION_ERROR', `Unsupported defaultTier: ${defaultTier}`);
      }
      const reportingPeriodStart = body.reportingPeriodStart
        ? String(body.reportingPeriodStart).trim()
        : '2027-01-01';
      const employeeHeadcount = Math.round(asNonNegativeNumber(body.employeeHeadcount, 50));
      const annualNetTurnoverEur = asNonNegativeNumber(body.annualNetTurnoverEur, 5_000_000);
      const notes = body.notes ? String(body.notes).trim() : '';
      const now = new Date().toISOString();

      const inserted = db
        .prepare(
          `INSERT INTO profiles (
             organization_name, entity_kind, reporting_period_start,
             employee_headcount, annual_net_turnover_eur, default_tier, notes,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING *`,
        )
        .get(
          organizationName,
          entityKind,
          reportingPeriodStart,
          employeeHeadcount,
          annualNetTurnoverEur,
          defaultTier,
          notes,
          now,
          now,
        );
      return sendJson(res, 201, { ok: true, profile: mapProfileRow(inserted) });
    }

    const profileMatch = routePath.match(/^\/api\/profiles\/(\d+)$/);
    if (profileMatch) {
      const profileId = Number(profileMatch[1]);
      const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId);
      if (!existing) {
        throw new HttpError(404, 'PROFILE_NOT_FOUND', `Profile ${profileId} not found.`);
      }
      if (method === 'GET') {
        return sendJson(res, 200, { ok: true, profile: mapProfileRow(existing) });
      }
      if (method === 'PATCH') {
        const body = await readJsonBody(req, maxBodyBytes);
        const organizationName =
          body.organizationName !== undefined
            ? String(body.organizationName).trim()
            : existing.organization_name;
        if (!organizationName) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'organizationName cannot be empty.');
        }
        const entityKind =
          body.entityKind !== undefined ? String(body.entityKind).trim() : existing.entity_kind;
        if (!VALID_ENTITY_KINDS.has(entityKind)) {
          throw new HttpError(400, 'VALIDATION_ERROR', `Unsupported entityKind: ${entityKind}`);
        }
        const defaultTier =
          body.defaultTier !== undefined ? String(body.defaultTier).trim() : existing.default_tier;
        if (!VALID_TIERS.has(defaultTier)) {
          throw new HttpError(400, 'VALIDATION_ERROR', `Unsupported defaultTier: ${defaultTier}`);
        }
        const reportingPeriodStart =
          body.reportingPeriodStart !== undefined
            ? String(body.reportingPeriodStart).trim()
            : existing.reporting_period_start;
        const employeeHeadcount = Math.round(
          asNonNegativeNumber(body.employeeHeadcount, existing.employee_headcount),
        );
        const annualNetTurnoverEur = asNonNegativeNumber(
          body.annual_net_turnover_eur !== undefined
            ? body.annual_net_turnover_eur
            : body.annualNetTurnoverEur,
          existing.annual_net_turnover_eur,
        );
        const notes = body.notes !== undefined ? String(body.notes).trim() : existing.notes;
        const now = new Date().toISOString();

        const updated = db
          .prepare(
            `UPDATE profiles
             SET organization_name = ?, entity_kind = ?, reporting_period_start = ?,
                 employee_headcount = ?, annual_net_turnover_eur = ?, default_tier = ?,
                 notes = ?, updated_at = ?
             WHERE id = ?
             RETURNING *`,
          )
          .get(
            organizationName,
            entityKind,
            reportingPeriodStart,
            employeeHeadcount,
            annualNetTurnoverEur,
            defaultTier,
            notes,
            now,
            profileId,
          );
        return sendJson(res, 200, { ok: true, profile: mapProfileRow(updated) });
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM profiles WHERE id = ?').run(profileId);
        return sendJson(res, 200, { ok: true, deletedId: profileId });
      }
    }

    // Assessments & Dossiers aliases
    const isCollection =
      routePath === '/api/assessments' || routePath === '/api/dossiers';
    if (isCollection && method === 'GET') {
      const statusFilter = (urlObj.searchParams.get('status') || '').trim().toLowerCase();
      const searchQ = (urlObj.searchParams.get('q') || '').trim().toLowerCase();
      let rows = db.prepare('SELECT * FROM assessments ORDER BY updated_at DESC, id DESC').all();
      if (statusFilter) {
        rows = rows.filter((r) => r.status.toLowerCase() === statusFilter);
      }
      if (searchQ) {
        rows = rows.filter(
          (r) =>
            r.dossier_code.toLowerCase().includes(searchQ) ||
            r.organization_name.toLowerCase().includes(searchQ) ||
            r.title.toLowerCase().includes(searchQ),
        );
      }
      return sendJson(res, 200, {
        ok: true,
        items: rows.map(mapAssessmentRow),
        total: rows.length,
      });
    }

    if (isCollection && method === 'POST') {
      const body = await readJsonBody(req, maxBodyBytes);
      let profileId = null;
      let profileBase = null;
      if (body.profileId !== undefined && body.profileId !== null) {
        const pid = Number(body.profileId);
        const prof = db.prepare('SELECT * FROM profiles WHERE id = ?').get(pid);
        if (!prof) {
          throw new HttpError(404, 'PROFILE_NOT_FOUND', `Profile ${pid} not found.`);
        }
        profileId = pid;
        profileBase = {
          ...VSME_PRESETS[0].input,
          organizationName: prof.organization_name,
          entityKind: prof.entity_kind,
          reportingPeriodStart: prof.reporting_period_start,
          employeeHeadcount: prof.employee_headcount,
          annualNetTurnoverEur: prof.annual_net_turnover_eur,
          targetTier: prof.default_tier,
        };
      }

      const input = resolveAssessmentInput(body, profileBase);
      const result = await assessVsmeReadiness(input);
      const title =
        body.title !== undefined && String(body.title).trim()
          ? String(body.title).trim()
          : `${input.organizationName} (${input.reportingPeriodStart})`;
      const now = new Date().toISOString();
      const currentYear = new Date().getUTCFullYear();

      const inserted = withImmediateTransaction(db, () => {
        const dossierCode = allocateDossierCodeTx(db, currentYear);
        return db
          .prepare(
            `INSERT INTO assessments (
               profile_id, dossier_code, title, organization_name, reporting_period_start,
               employee_headcount, annual_net_turnover_eur, entity_kind, target_tier,
               status, readiness_score, hours_saved_by_cap, input_json, result_json,
               canonical_text, dossier_sha256, public_slug, locked_at, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
             RETURNING *`,
          )
          .get(
            profileId,
            dossierCode,
            title,
            input.organizationName,
            input.reportingPeriodStart,
            input.employeeHeadcount,
            input.annualNetTurnoverEur,
            input.entityKind,
            input.targetTier,
            result.status,
            result.readinessScore,
            result.shield.estimatedHoursSavedByCap,
            JSON.stringify(input),
            JSON.stringify(result),
            result.canonicalDossierText,
            result.dossierSha256,
            now,
            now,
          );
      });

      return sendJson(res, 201, {
        ok: true,
        item: mapAssessmentRow(inserted),
      });
    }

    const dossierActionMatch = routePath.match(
      /^\/api\/(?:assessments|dossiers)\/([^/]+)(?:\/(duplicate|finalize|lock|brief\.md|export\.csv|summary))?$/,
    );
    if (dossierActionMatch) {
      const idOrCode = dossierActionMatch[1];
      const action = dossierActionMatch[2] || '';
      const row = findAssessmentRow(db, idOrCode);
      if (!row) {
        throw new HttpError(404, 'DOSSIER_NOT_FOUND', `Dossier "${idOrCode}" not found.`);
      }

      if (!action && method === 'GET') {
        return sendJson(res, 200, { ok: true, item: mapAssessmentRow(row) });
      }

      if (!action && method === 'PATCH') {
        if (row.locked_at) {
          throw new HttpError(
            409,
            'DOSSIER_LOCKED',
            'Sealed dossier cannot be modified. Duplicate it to edit a new draft.',
            { dossierCode: row.dossier_code, lockedAt: row.locked_at },
          );
        }
        const body = await readJsonBody(req, maxBodyBytes);
        const prevInput = JSON.parse(row.input_json);
        const nextInput = resolveAssessmentInput(body, prevInput);
        const result = await assessVsmeReadiness(nextInput);
        const title =
          body.title !== undefined && String(body.title).trim()
            ? String(body.title).trim()
            : row.title;
        const now = new Date().toISOString();

        const updated = db
          .prepare(
            `UPDATE assessments
             SET title = ?, organization_name = ?, reporting_period_start = ?,
                 employee_headcount = ?, annual_net_turnover_eur = ?, entity_kind = ?,
                 target_tier = ?, status = ?, readiness_score = ?, hours_saved_by_cap = ?,
                 input_json = ?, result_json = ?, canonical_text = ?, dossier_sha256 = ?,
                 updated_at = ?
             WHERE id = ?
             RETURNING *`,
          )
          .get(
            title,
            nextInput.organizationName,
            nextInput.reportingPeriodStart,
            nextInput.employeeHeadcount,
            nextInput.annualNetTurnoverEur,
            nextInput.entityKind,
            nextInput.targetTier,
            result.status,
            result.readinessScore,
            result.shield.estimatedHoursSavedByCap,
            JSON.stringify(nextInput),
            JSON.stringify(result),
            result.canonicalDossierText,
            result.dossierSha256,
            now,
            row.id,
          );
        return sendJson(res, 200, { ok: true, item: mapAssessmentRow(updated) });
      }

      if (!action && method === 'DELETE') {
        if (row.locked_at) {
          throw new HttpError(409, 'DOSSIER_LOCKED', 'Sealed dossier cannot be deleted.', {
            dossierCode: row.dossier_code,
            lockedAt: row.locked_at,
          });
        }
        db.prepare('DELETE FROM assessments WHERE id = ?').run(row.id);
        return sendJson(res, 200, {
          ok: true,
          deletedId: row.id,
          dossierCode: row.dossier_code,
        });
      }

      if (action === 'duplicate' && method === 'POST') {
        let body = {};
        try {
          body = await readJsonBody(req, maxBodyBytes);
        } catch (err) {
          if (err instanceof HttpError) throw err;
        }
        const sourceInput = JSON.parse(row.input_json);
        const result = await assessVsmeReadiness(sourceInput);
        const copyTitle =
          body.title && String(body.title).trim()
            ? String(body.title).trim()
            : `${row.title} (Copy)`;
        const now = new Date().toISOString();
        const currentYear = new Date().getUTCFullYear();

        const cloned = withImmediateTransaction(db, () => {
          const dossierCode = allocateDossierCodeTx(db, currentYear);
          return db
            .prepare(
              `INSERT INTO assessments (
                 profile_id, dossier_code, title, organization_name, reporting_period_start,
                 employee_headcount, annual_net_turnover_eur, entity_kind, target_tier,
                 status, readiness_score, hours_saved_by_cap, input_json, result_json,
                 canonical_text, dossier_sha256, public_slug, locked_at, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
               RETURNING *`,
            )
            .get(
              row.profile_id,
              dossierCode,
              copyTitle,
              row.organization_name,
              row.reporting_period_start,
              row.employee_headcount,
              row.annual_net_turnover_eur,
              row.entity_kind,
              row.target_tier,
              result.status,
              result.readinessScore,
              result.shield.estimatedHoursSavedByCap,
              row.input_json,
              JSON.stringify(result),
              result.canonicalDossierText,
              result.dossierSha256,
              now,
              now,
            );
        });
        return sendJson(res, 201, { ok: true, item: mapAssessmentRow(cloned) });
      }

      if ((action === 'finalize' || action === 'lock') && method === 'POST') {
        if (row.locked_at) {
          throw new HttpError(
            409,
            'ALREADY_LOCKED',
            'Dossier is already finalized and cryptographically sealed.',
            {
              dossierCode: row.dossier_code,
              lockedAt: row.locked_at,
              dossierSha256: row.dossier_sha256,
              publicSlug: row.public_slug,
            },
          );
        }
        const sourceInput = JSON.parse(row.input_json);
        const result = await assessVsmeReadiness(sourceInput);
        const publicSlug = row.public_slug || generatePublicSlug();
        const now = new Date().toISOString();
        const sealed = db
          .prepare(
            `UPDATE assessments
             SET status = ?, readiness_score = ?, hours_saved_by_cap = ?,
                 result_json = ?, canonical_text = ?, dossier_sha256 = ?,
                 public_slug = ?, locked_at = ?, updated_at = ?
             WHERE id = ?
             RETURNING *`,
          )
          .get(
            result.status,
            result.readinessScore,
            result.shield.estimatedHoursSavedByCap,
            JSON.stringify(result),
            result.canonicalDossierText,
            result.dossierSha256,
            publicSlug,
            now,
            now,
            row.id,
          );
        return sendJson(res, 200, { ok: true, item: mapAssessmentRow(sealed) });
      }

      if (action === 'brief.md' && method === 'GET') {
        const langRaw = (
          urlObj.searchParams.get('lang') ||
          urlObj.searchParams.get('locale') ||
          'ar'
        )
          .trim()
          .toLowerCase();
        const locale = langRaw === 'en' ? 'en' : 'ar';
        const item = mapAssessmentRow(row);
        const md = buildVsmeBriefMarkdown(
          item.input,
          item.result,
          item.dossierCode,
          item.dossierSha256,
          locale,
        );
        const safeFilename = item.dossierCode.replace(/[^A-Za-z0-9_-]/g, '');
        return sendText(res, 200, 'text/markdown; charset=utf-8', md, {
          'Content-Disposition': `attachment; filename="${safeFilename}.${locale}.brief.md"`,
          'Cache-Control': 'no-store',
        });
      }

      if (action === 'export.csv' && method === 'GET') {
        const item = mapAssessmentRow(row);
        const csvContent =
          item.result.csvAudit && item.result.csvAudit.rows.length > 0
            ? exportBuyerRequestsAuditCsv(item.result.csvAudit)
            : buildFallbackSummaryCsv(item);
        const safeFilename = item.dossierCode.replace(/[^A-Za-z0-9_-]/g, '');
        return sendText(res, 200, 'text/csv; charset=utf-8', csvContent, {
          'Content-Disposition': `attachment; filename="${safeFilename}.audit.csv"`,
          'Cache-Control': 'no-store',
        });
      }

      if (action === 'summary' && method === 'GET') {
        const item = mapAssessmentRow(row);
        const langRaw = (
          urlObj.searchParams.get('lang') ||
          urlObj.searchParams.get('locale') ||
          'ar'
        )
          .trim()
          .toLowerCase();
        const locale = langRaw === 'en' ? 'en' : 'ar';
        const briefMarkdown = buildVsmeBriefMarkdown(
          item.input,
          item.result,
          item.dossierCode,
          item.dossierSha256,
          locale,
        );
        return sendJson(res, 200, {
          ok: true,
          dossierCode: item.dossierCode,
          title: item.title,
          organizationName: item.organizationName,
          reportingPeriodStart: item.reportingPeriodStart,
          status: item.status,
          readinessScore: item.readinessScore,
          hoursSavedByCap: item.hoursSavedByCap,
          lockedAt: item.lockedAt,
          publicSlug: item.publicSlug,
          dossierSha256: item.dossierSha256,
          legalDisclaimerEn: item.result.legalDisclaimerEn,
          legalDisclaimerAr: item.result.legalDisclaimerAr,
          shield: item.result.shield,
          disclosures: item.result.disclosures,
          csvAuditSummary: item.result.csvAudit
            ? {
                totalRequests: item.result.csvAudit.totalRequests,
                readyCount: item.result.csvAudit.readyCount,
                conditionalCount: item.result.csvAudit.conditionalCount,
                blockedCount: item.result.csvAudit.blockedCount,
                capShieldTriggeredCount: item.result.csvAudit.capShieldTriggeredCount,
                excessDemandCount: item.result.csvAudit.excessDemandCount,
              }
            : null,
          topFindings: item.result.findings.slice(0, 5),
          briefMarkdown,
        });
      }
    }

    const publicMatch = routePath.match(/^\/api\/public\/reports\/([^/]+)$/);
    if (publicMatch && method === 'GET') {
      const slugOrCode = decodeURIComponent(publicMatch[1]).trim();
      const row = db
        .prepare(
          'SELECT * FROM assessments WHERE (public_slug = ? OR dossier_code = ?) AND locked_at IS NOT NULL',
        )
        .get(slugOrCode, slugOrCode);
      if (!row) {
        throw new HttpError(
          404,
          'PUBLIC_REPORT_NOT_FOUND',
          `Published sealed VSME report "${slugOrCode}" was not found.`,
        );
      }

      const now = new Date().toISOString();
      const viewRow = db
        .prepare(
          `INSERT INTO public_report_views (slug_or_code, view_count, last_viewed_at)
           VALUES (?, 1, ?)
           ON CONFLICT(slug_or_code) DO UPDATE SET
             view_count = view_count + 1,
             last_viewed_at = excluded.last_viewed_at
           RETURNING view_count, last_viewed_at`,
        )
        .get(row.dossier_code, now);

      const item = mapAssessmentRow(row);
      return sendJson(res, 200, {
        ok: true,
        viewCount: Number(viewRow?.view_count ?? 1),
        lastViewedAt: viewRow?.last_viewed_at ?? now,
        report: {
          dossierCode: item.dossierCode,
          publicSlug: item.publicSlug,
          organizationName: item.organizationName,
          reportingPeriodStart: item.reportingPeriodStart,
          employeeHeadcount: item.employeeHeadcount,
          entityKind: item.entityKind,
          targetTier: item.targetTier,
          status: item.status,
          readinessScore: item.readinessScore,
          hoursSavedByCap: item.hoursSavedByCap,
          lockedAt: item.lockedAt,
          dossierSha256: item.dossierSha256,
          legalDisclaimerEn: item.result.legalDisclaimerEn,
          legalDisclaimerAr: item.result.legalDisclaimerAr,
          shield: item.result.shield,
          disclosures: item.result.disclosures,
          briefAr: buildVsmeBriefMarkdown(
            item.input,
            item.result,
            item.dossierCode,
            item.dossierSha256,
            'ar',
          ),
          briefEn: buildVsmeBriefMarkdown(
            item.input,
            item.result,
            item.dossierCode,
            item.dossierSha256,
            'en',
          ),
        },
      });
    }

    if (routePath.startsWith('/api/')) {
      throw new HttpError(404, 'API_NOT_FOUND', `Unknown API endpoint: ${method} ${routePath}`);
    }

    if (method === 'GET' || method === 'HEAD') {
      return tryServeStatic(res, routePath, method);
    }

    throw new HttpError(405, 'METHOD_NOT_ALLOWED', `Method ${method} not allowed on ${routePath}`);
  }

  const server = http.createServer((req, res) => {
    void handleRequest(req, res).catch((err) => {
      if (err instanceof HttpError) {
        return sendJson(res, err.status, {
          ok: false,
          error: err.code,
          message: err.message,
          ...err.extra,
        });
      }
      return sendJson(res, 500, {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unexpected server error',
      });
    });
  });

  return {
    server,
    db,
    basePath,
    async listen(port = Number(options.port ?? 0), host = options.host || '127.0.0.1') {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.removeListener('error', reject);
          resolve();
        });
      });
      const addr = server.address();
      const boundPort = typeof addr === 'object' && addr ? addr.port : port;
      return {
        port: boundPort,
        host,
        url: `http://${host}:${boundPort}${basePath}`,
      };
    },
    async close() {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
      closeDb(db);
    },
  };
}
