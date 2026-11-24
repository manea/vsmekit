import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app.mjs';
import {
  computePayloadDigest,
  VSME_BASIC_DISCLOSURES,
  VSME_COMPREHENSIVE_DISCLOSURES,
  VSME_CONTROLS,
  VSME_TOOL_VERSION,
} from '../../src/core/index.ts';

const activeServers: Array<{ close: () => Promise<void> }> = [];
const tempDirs: string[] = [];

function makeTempDir(prefix = 'vsmekit-test-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function startTestApp(options: Parameters<typeof createApp>[0] = {}) {
  const dataDir = options.dataDir ?? makeTempDir();
  const app = createApp({
    basePath: '/vsmekit',
    dataDir,
    ...options,
  });
  activeServers.push(app);
  const bound = await app.listen(0, '127.0.0.1');
  return { app, baseUrl: bound.url, rootUrl: `http://${bound.host}:${bound.port}` };
}

afterEach(async () => {
  while (activeServers.length > 0) {
    const srv = activeServers.pop()!;
    await srv.close();
  }
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('VSMEKit SQLite WAL HTTP Server (v0.2.0)', () => {
  it('serves /health, /readyz, BASE_PATH HTML injection, and /api/presets', async () => {
    const { baseUrl, rootUrl } = await startTestApp();

    const healthRes = await fetch(`${baseUrl}/health`);
    expect(healthRes.status).toBe(200);
    expect(healthRes.headers.get('x-content-type-options')).toBe('nosniff');
    expect(healthRes.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    const health = (await healthRes.json()) as {
      ok: boolean;
      service: string;
      version: string;
      basePath: string;
      db: { journalMode: string };
    };
    expect(health.ok).toBe(true);
    expect(health.service).toBe('vsmekit');
    expect(health.version).toBe(VSME_TOOL_VERSION);
    expect(health.basePath).toBe('/vsmekit');
    expect(health.db.journalMode).toBe('wal');

    const readyRes = await fetch(`${rootUrl}/readyz`);
    expect(readyRes.status).toBe(200);
    const ready = (await readyRes.json()) as { ready: boolean; journalMode: string };
    expect(ready.ready).toBe(true);
    expect(ready.journalMode).toBe('wal');

    const htmlRes = await fetch(`${baseUrl}/`);
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('window.__VSMEKIT_BASE__="/vsmekit"');

    const presetsRes = await fetch(`${baseUrl}/api/presets`);
    expect(presetsRes.status).toBe(200);
    const presetsJson = (await presetsRes.json()) as {
      ok: boolean;
      legalDisclaimerEn: string;
      legalDisclaimerAr: string;
      presets: Array<{ id: string }>;
    };
    expect(presetsJson.ok).toBe(true);
    expect(presetsJson.presets).toHaveLength(3);
    expect(presetsJson.legalDisclaimerEn).toContain('NOT affiliated');
    expect(presetsJson.legalDisclaimerAr).toContain('EFRAG');
  });

  it('evaluates /api/shield, /api/audit-csv (400 + CWE-1236), and /api/assess Preset #3', async () => {
    const { baseUrl } = await startTestApp();

    const shieldRes = await fetch(`${baseUrl}/api/shield`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'Nordic Parts Oy',
        reportingPeriodStart: '2027-01-01',
        employeeHeadcount: 180,
        annualNetTurnoverEur: 28_000_000,
        entityKind: 'sme_unlisted',
        targetTier: 'basic_b1_b11',
        incomingBuyerRequest: 'full_esrs_or_custom_excess',
        seeksGreenFinancingOrScope3Buyer: false,
      }),
    });
    expect(shieldRes.status).toBe(200);
    const shieldJson = (await shieldRes.json()) as {
      shield: {
        mandatoryCsrdInScope: boolean;
        valueChainCapActive: boolean;
        shieldProtectsAgainstExcessRequest: boolean;
        estimatedHoursSavedByCap: number;
      };
    };
    expect(shieldJson.shield.mandatoryCsrdInScope).toBe(false);
    expect(shieldJson.shield.valueChainCapActive).toBe(true);
    expect(shieldJson.shield.shieldProtectsAgainstExcessRequest).toBe(true);
    expect(shieldJson.shield.estimatedHoursSavedByCap).toBe(120);

    const emptyCsvRes = await fetch(`${baseUrl}/api/audit-csv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csv: '   ' }),
    });
    expect(emptyCsvRes.status).toBe(400);
    const emptyErr = (await emptyCsvRes.json()) as { error: string };
    expect(emptyErr.error).toBe('EMPTY_CSV');

    const badCsv = [
      'request_id,buyer_or_lender_name,buyer_csrd_covered,requested_tier,sme_employees,reporting_period_start,includes_excess_esrs_fields',
      'REQ-9,=HYPERLINK("http://bad"),true,full_esrs_or_custom_excess,200,2027-01-01,true',
    ].join('\n');
    const csvRes = await fetch(`${baseUrl}/api/audit-csv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csv: badCsv }),
    });
    expect(csvRes.status).toBe(200);
    const csvJson = (await csvRes.json()) as {
      audit: { blockedCount: number; capShieldTriggeredCount: number };
      exportCsv: string;
    };
    expect(csvJson.audit.blockedCount).toBe(1);
    expect(csvJson.audit.capShieldTriggeredCount).toBe(1);
    expect(csvJson.exportCsv.startsWith('\uFEFF')).toBe(true);
    expect(csvJson.exportCsv).toContain("'=HYPERLINK");

    const assessRes = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ presetId: 'buyer-overreach-and-disclosure-gaps-blocked' }),
    });
    expect(assessRes.status).toBe(200);
    const assessJson = (await assessRes.json()) as {
      assessment: {
        status: string;
        shield: { estimatedHoursSavedByCap: number };
        csvAudit: { blockedCount: number };
      };
    };
    expect(assessJson.assessment.status).toBe('blocked');
    expect(assessJson.assessment.csvAudit.blockedCount).toBe(2);
    expect(assessJson.assessment.shield.estimatedHoursSavedByCap).toBe(120);
  });

  it('supports profiles CRUD, atomic VSME-YYYY-0001 numbering, PATCH remediation, seal + 409 lock, duplicate/delete, brief.md, export.csv BOM, summary, and public report views', async () => {
    const { baseUrl } = await startTestApp();
    const expectedYear = new Date().getUTCFullYear();
    const expectedCode1 = `VSME-${expectedYear}-0001`;
    const expectedCode2 = `VSME-${expectedYear}-0002`;

    // Profiles CRUD
    const profCreate = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'IberiaPack Components S.L.',
        entityKind: 'mid_market_up_to_1000',
        employeeHeadcount: 320,
        annualNetTurnoverEur: 68_000_000,
        defaultTier: 'comprehensive_c1_c9',
      }),
    });
    expect(profCreate.status).toBe(201);
    const { profile } = (await profCreate.json()) as { profile: { id: number } };

    const profPatch = await fetch(`${baseUrl}/api/profiles/${profile.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'Verified profile' }),
    });
    expect(profPatch.status).toBe(200);

    // Create dossier #1 from Preset #3
    const createRes = await fetch(`${baseUrl}/api/assessments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profileId: profile.id,
        presetId: 'buyer-overreach-and-disclosure-gaps-blocked',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      item: { dossierCode: string; status: string; lockedAt: string | null };
    };
    expect(created.item.dossierCode).toBe(expectedCode1);
    expect(created.item.status).toBe('blocked');
    expect(created.item.lockedAt).toBeNull();

    // Verify CWE-1236 BOM export.csv BEFORE removing CSV
    const preCsvRes = await fetch(`${baseUrl}/api/dossiers/${expectedCode1}/export.csv`);
    expect(preCsvRes.status).toBe(200);
    const csvBytes = new Uint8Array(await preCsvRes.arrayBuffer());
    expect(csvBytes[0]).toBe(0xef);
    expect(csvBytes[1]).toBe(0xbb);
    expect(csvBytes[2]).toBe(0xbf);
    const csvText = new TextDecoder().decode(csvBytes);
    expect(csvText).toContain("'=HYPERLINK");

    // Remediate gaps cleanly via PATCH
    const patchRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        incomingBuyerRequest: 'vsme_comprehensive',
        buyerRequestsCsv: null,
        antiCorruptionConvictionsCount: 0,
        completedBasicDisclosures: VSME_BASIC_DISCLOSURES.map((d) => d.id),
        completedComprehensiveDisclosures: VSME_COMPREHENSIVE_DISCLOSURES.map((d) => d.id),
        scope3Tco2e: 840,
        implementedControls: VSME_CONTROLS.map((c) => c.id),
      }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as {
      item: { status: string; readinessScore: number };
    };
    expect(patched.item.status).toBe('ready');
    expect(patched.item.readinessScore).toBe(100);

    // Finalize (seal) dossier and verify Web Crypto canonical digest parity
    const finalizeRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/finalize`, {
      method: 'POST',
    });
    expect(finalizeRes.status).toBe(200);
    const sealed = (await finalizeRes.json()) as {
      item: {
        dossierCode: string;
        lockedAt: string;
        publicSlug: string;
        canonicalText: string;
        dossierSha256: string;
      };
    };
    expect(sealed.item.lockedAt).toBeTruthy();
    expect(sealed.item.publicSlug).toMatch(/^vsme-[0-9a-f]{12}$/);
    const expectedDigest = await computePayloadDigest(sealed.item.canonicalText);
    expect(sealed.item.dossierSha256).toBe(expectedDigest);

    // Lock enforcement (409)
    const doubleLockRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/lock`, {
      method: 'POST',
    });
    expect(doubleLockRes.status).toBe(409);
    expect(((await doubleLockRes.json()) as { error: string }).error).toBe('ALREADY_LOCKED');

    const lockedPatchRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Tamper Attempt' }),
    });
    expect(lockedPatchRes.status).toBe(409);
    expect(((await lockedPatchRes.json()) as { error: string }).error).toBe('DOSSIER_LOCKED');

    const lockedDeleteRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}`, {
      method: 'DELETE',
    });
    expect(lockedDeleteRes.status).toBe(409);

    // Duplicate & delete copy
    const dupRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/duplicate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'FY2028 Draft' }),
    });
    expect(dupRes.status).toBe(201);
    const dupJson = (await dupRes.json()) as {
      item: { dossierCode: string; lockedAt: string | null };
    };
    expect(dupJson.item.dossierCode).toBe(expectedCode2);
    expect(dupJson.item.lockedAt).toBeNull();

    const delCopyRes = await fetch(`${baseUrl}/api/assessments/${expectedCode2}`, {
      method: 'DELETE',
    });
    expect(delCopyRes.status).toBe(200);

    // Bilingual briefs & summary
    const briefEnRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/brief.md?lang=en`);
    expect(briefEnRes.status).toBe(200);
    const briefEn = await briefEnRes.text();
    expect(briefEn).toContain(expectedCode1);
    expect(briefEn).toContain(sealed.item.dossierSha256);
    expect(briefEn).toContain('NOT affiliated');

    const briefArRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/brief.md?lang=ar`);
    expect(briefArRes.status).toBe(200);
    expect(await briefArRes.text()).toContain('ملف جاهزية VSME');

    const summaryRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/summary?lang=en`);
    expect(summaryRes.status).toBe(200);
    const summaryJson = (await summaryRes.json()) as {
      dossierCode: string;
      status: string;
      readinessScore: number;
    };
    expect(summaryJson.dossierCode).toBe(expectedCode1);
    expect(summaryJson.status).toBe('ready');
    expect(summaryJson.readinessScore).toBe(100);

    // Fallback CSV on sealed clean dossier (no CSV rows -> summary CSV with BOM)
    const fallbackCsvRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/export.csv`);
    expect(fallbackCsvRes.status).toBe(200);
    expect((await fallbackCsvRes.text()).includes(expectedCode1)).toBe(true);

    // Public report + persistent view count increment
    const pub1Res = await fetch(`${baseUrl}/api/public/reports/${sealed.item.publicSlug}`);
    expect(pub1Res.status).toBe(200);
    const pub1 = (await pub1Res.json()) as { viewCount: number; report: { dossierCode: string } };
    expect(pub1.viewCount).toBe(1);
    expect(pub1.report.dossierCode).toBe(expectedCode1);

    const pub2Res = await fetch(`${baseUrl}/api/public/reports/${expectedCode1}`);
    expect(pub2Res.status).toBe(200);
    const pub2 = (await pub2Res.json()) as { viewCount: number };
    expect(pub2.viewCount).toBe(2);

    // Delete profile
    const profDel = await fetch(`${baseUrl}/api/profiles/${profile.id}`, { method: 'DELETE' });
    expect(profDel.status).toBe(200);
  });

  it('enforces 413 payload size cap and 429 API rate limits', async () => {
    const { baseUrl } = await startTestApp({
      maxBodyBytes: 256,
      rateLimitMax: 3,
      rateLimitWindowMs: 60_000,
    });

    const oversized = await fetch(`${baseUrl}/api/shield`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ padding: 'x'.repeat(500) }),
    });
    expect(oversized.status).toBe(413);
    expect(((await oversized.json()) as { error: string }).error).toBe('PAYLOAD_TOO_LARGE');

    expect((await fetch(`${baseUrl}/api/presets`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/presets`)).status).toBe(200);
    const limited = await fetch(`${baseUrl}/api/presets`);
    expect(limited.status).toBe(429);
    expect(((await limited.json()) as { error: string }).error).toBe('RATE_LIMITED');
  });
});
