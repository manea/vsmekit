import { describe, expect, it } from 'vitest';
import {
  VSME_BASIC_DISCLOSURES,
  VSME_COMPREHENSIVE_DISCLOSURES,
  VSME_CONTROLS,
  VSME_PRESETS,
  assessVsmeReadiness,
  auditBuyerRequestsCsv,
  computePayloadDigest,
  evaluateDisclosureMatrix,
  evaluateValueChainShield,
  exportBuyerRequestsAuditCsv,
  sanitizeCsvCell,
} from '../../src/core/index.ts';

describe('VSMEKit core ((EU) 2026/1560 / EFRAG VSME & 2027 Value-Chain Cap)', () => {
  it('exposes catalog, 11 Basic & 9 Comprehensive disclosures, and non-regulator disclaimer', async () => {
    expect(VSME_BASIC_DISCLOSURES).toHaveLength(11);
    expect(VSME_COMPREHENSIVE_DISCLOSURES).toHaveLength(9);
    expect(VSME_CONTROLS).toHaveLength(6);

    const ready = await assessVsmeReadiness(VSME_PRESETS[0]!.input);
    expect(ready.toolName).toBe('VSMEKit');
    expect(ready.legalDisclaimerEn).toContain('NOT affiliated');
    expect(ready.legalDisclaimerAr).toContain('ليست تابعة');
  });

  it('scores Preset 1 Ready SME Comprehensive with B1–B11, C1–C9 & intensity metrics', async () => {
    const res = await assessVsmeReadiness(VSME_PRESETS[0]!.input);
    expect(res.status).toBe('ready');
    expect(res.readinessScore).toBe(100);
    expect(res.disclosures.basicCompletedCount).toBe(11);
    expect(res.disclosures.comprehensiveCompletedCount).toBe(9);
    expect(res.disclosures.totalScope1And2Tco2e).toBe(385);
    expect(res.disclosures.totalGhgWithScope3Tco2e).toBe(2305);
    expect(res.disclosures.ghgIntensityTco2ePerEurMillion).toBe(12.031);
    expect(res.shield.eligibleForValueChainShield).toBe(true);
    expect(res.shield.mandatoryCsrdInScope).toBe(false);
  });

  it('scores Preset 2 Pre-2027 Micro Supplier as conditional prior to 2027-01-01 shield', async () => {
    const res = await assessVsmeReadiness(VSME_PRESETS[1]!.input);
    expect(res.status).toBe('conditional');
    expect(res.shield.valueChainCapActive).toBe(false);
    expect(res.shield.eligibleForValueChainShield).toBe(true);
    expect(res.shield.shieldProtectsAgainstExcessRequest).toBe(false);
    expect(res.findings.some((f) => f.code === 'VSME-PRE-2027-BUYER-PRESSURE')).toBe(true);
  });

  it('scores Preset 3 blocked with B/C disclosure gaps, Value-Chain Cap shield & CSV over-reach', async () => {
    const res = await assessVsmeReadiness(VSME_PRESETS[2]!.input);
    expect(res.status).toBe('blocked');
    expect(res.shield.valueChainCapActive).toBe(true);
    expect(res.shield.shieldProtectsAgainstExcessRequest).toBe(true);
    expect(res.shield.estimatedHoursSavedByCap).toBe(120);
    expect(res.disclosures.missingBasicIds).toHaveLength(8);
    expect(res.disclosures.missingComprehensiveIds).toHaveLength(7);
    expect(res.csvAudit?.totalRequests).toBe(3);
    expect(res.csvAudit?.blockedCount).toBe(2);
    expect(res.csvAudit?.capShieldTriggeredCount).toBe(2);
  });

  it('enforces Omnibus I >1,000 employees AND >EUR 450M turnover mandatory CSRD threshold', async () => {
    const boundary = evaluateValueChainShield({
      ...VSME_PRESETS[0]!.input,
      employeeHeadcount: 1000,
      annualNetTurnoverEur: 600_000_000,
    });
    expect(boundary.shield.mandatoryCsrdInScope).toBe(false);
    expect(boundary.shield.eligibleForValueChainShield).toBe(true);

    const large = await assessVsmeReadiness({
      ...VSME_PRESETS[0]!.input,
      employeeHeadcount: 1001,
      annualNetTurnoverEur: 450_000_001,
      entityKind: 'large_above_1000_csrd',
    });
    expect(large.shield.mandatoryCsrdInScope).toBe(true);
    expect(large.status).toBe('blocked');
    expect(large.findings.some((f) => f.code === 'VSME-MANDATORY-CSRD-SCOPE')).toBe(true);
  });

  it('activates the 2027-01-01 Value-Chain Cap cutoff cleanly', () => {
    const pre = evaluateValueChainShield({
      ...VSME_PRESETS[2]!.input,
      reportingPeriodStart: '2026-12-31',
    });
    expect(pre.shield.valueChainCapActive).toBe(false);
    expect(pre.shield.shieldProtectsAgainstExcessRequest).toBe(false);

    const active = evaluateValueChainShield({
      ...VSME_PRESETS[2]!.input,
      reportingPeriodStart: '2027-01-01',
    });
    expect(active.shield.valueChainCapActive).toBe(true);
    expect(active.shield.shieldProtectsAgainstExcessRequest).toBe(true);
  });

  it('neutralizes CWE-1236 formula injection prefixes and adds UTF-8 BOM in CSV exports', () => {
    expect(sanitizeCsvCell('=CMD|calc')).toBe("'=CMD|calc");
    expect(sanitizeCsvCell('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)");
    expect(sanitizeCsvCell('-2+3')).toBe("'-2+3");
    expect(sanitizeCsvCell('@RISK')).toBe("'@RISK");

    const audit = auditBuyerRequestsCsv(VSME_PRESETS[2]!.input.buyerRequestsCsv!);
    expect(audit.parseErrors).toEqual([]);
    const csvOut = exportBuyerRequestsAuditCsv(audit);
    expect(csvOut.startsWith('\uFEFF')).toBe(true);
    expect(csvOut).toContain("'=HYPERLINK");
  });

  it('computes deterministic SHA-256 dossier digest matching Web Crypto helper', async () => {
    const a = await assessVsmeReadiness(VSME_PRESETS[0]!.input);
    const b = await assessVsmeReadiness({
      ...VSME_PRESETS[0]!.input,
      implementedControls: [...VSME_PRESETS[0]!.input.implementedControls].reverse(),
    });
    expect(a.dossierSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(a.dossierSha256).toBe(b.dossierSha256);
    const check = await computePayloadDigest(a.canonicalDossierText);
    expect(a.dossierSha256).toBe(check);

    const matrix = evaluateDisclosureMatrix(VSME_PRESETS[0]!.input, a.shield);
    expect(matrix.findings).toHaveLength(0);
  });
});
