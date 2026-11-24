import {
  VSME_PRESETS,
  assessVsmeReadiness,
  buildVsmeBriefMarkdown,
  exportBuyerRequestsAuditCsv,
  sanitizeCsvCell,
} from '../core/index.ts';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import { withBase } from './basePath.ts';
import type { Locale } from './i18n.ts';

export type ApiMode = 'server' | 'local';

export interface VsmeDossierRecord {
  id: number | string;
  profileId: number | string | null;
  dossierCode: string;
  title: string;
  organizationName: string;
  reportingPeriodStart: string;
  employeeHeadcount: number;
  annualNetTurnoverEur: number;
  entityKind: AssessmentInput['entityKind'];
  targetTier: AssessmentInput['targetTier'];
  status: AssessmentResult['status'];
  readinessScore: number;
  hoursSavedByCap: number;
  canonicalText: string;
  dossierSha256: string;
  publicSlug: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  input: AssessmentInput;
  result: AssessmentResult;
}

export interface VsmeOrgProfile {
  id: number | string;
  organizationName: string;
  entityKind: AssessmentInput['entityKind'];
  reportingPeriodStart: string;
  employeeHeadcount: number;
  annualNetTurnoverEur: number;
  defaultTier: AssessmentInput['targetTier'];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicVsmeReport {
  viewCount: number;
  lastViewedAt: string;
  report: {
    dossierCode: string;
    publicSlug: string;
    organizationName: string;
    reportingPeriodStart: string;
    employeeHeadcount: number;
    entityKind: AssessmentInput['entityKind'];
    targetTier: AssessmentInput['targetTier'];
    status: AssessmentResult['status'];
    readinessScore: number;
    hoursSavedByCap: number;
    lockedAt: string;
    dossierSha256: string;
    legalDisclaimerEn: string;
    legalDisclaimerAr: string;
    shield: AssessmentResult['shield'];
    disclosures: AssessmentResult['disclosures'];
    briefAr: string;
    briefEn: string;
  };
}

const LS_DOSSIERS = 'vsmekit.v1.dossiers';
const LS_PROFILES = 'vsmekit.v1.profiles';
const LS_SEQ = 'vsmekit.v1.seq';
const LS_VIEWS = 'vsmekit.v1.views';

function readLocalList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function allocateLocalDossierCode(): string {
  const year = new Date().getUTCFullYear();
  const prev = Number(localStorage.getItem(LS_SEQ) || '0');
  const next = Number.isFinite(prev) ? prev + 1 : 1;
  localStorage.setItem(LS_SEQ, String(next));
  return `VSME-${year}-${String(next).padStart(4, '0')}`;
}

export function triggerTextDownload(
  filename: string,
  mimeType: string,
  content: string | Uint8Array<ArrayBuffer>,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function detectApiMode(): Promise<ApiMode> {
  try {
    const res = await fetch(withBase('/health'), { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; service?: string };
      if (data?.ok && data?.service === 'vsmekit') return 'server';
    }
  } catch {
    // static Cloudflare Workers / offline browser fallback
  }
  return 'local';
}

export async function listDossiers(mode: ApiMode): Promise<VsmeDossierRecord[]> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/dossiers'), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load VSMEKit dossiers');
    const json = (await res.json()) as { items: VsmeDossierRecord[] };
    return json.items || [];
  }
  return readLocalList<VsmeDossierRecord>(LS_DOSSIERS);
}

export async function listProfiles(mode: ApiMode): Promise<VsmeOrgProfile[]> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/profiles'), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { items: VsmeOrgProfile[] };
    return json.items || [];
  }
  return readLocalList<VsmeOrgProfile>(LS_PROFILES);
}

export async function saveOrgProfile(mode: ApiMode, input: AssessmentInput): Promise<VsmeOrgProfile> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/profiles'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: input.organizationName,
        entityKind: input.entityKind,
        reportingPeriodStart: input.reportingPeriodStart,
        employeeHeadcount: input.employeeHeadcount,
        annualNetTurnoverEur: input.annualNetTurnoverEur,
        defaultTier: input.targetTier,
        notes: input.notes || '',
      }),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    const json = (await res.json()) as { profile: VsmeOrgProfile };
    return json.profile;
  }

  const now = new Date().toISOString();
  const profile: VsmeOrgProfile = {
    id: `prof-${Date.now().toString(36)}`,
    organizationName: input.organizationName,
    entityKind: input.entityKind,
    reportingPeriodStart: input.reportingPeriodStart,
    employeeHeadcount: input.employeeHeadcount,
    annualNetTurnoverEur: input.annualNetTurnoverEur,
    defaultTier: input.targetTier,
    notes: input.notes || '',
    createdAt: now,
    updatedAt: now,
  };
  const all = [profile, ...readLocalList<VsmeOrgProfile>(LS_PROFILES)];
  writeLocalList(LS_PROFILES, all);
  return profile;
}

export async function createDossier(mode: ApiMode, input: AssessmentInput): Promise<VsmeDossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/dossiers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create VSME dossier');
    const json = (await res.json()) as { item: VsmeDossierRecord };
    return json.item;
  }

  const result = await assessVsmeReadiness(input);
  const now = new Date().toISOString();
  const code = allocateLocalDossierCode();
  const record: VsmeDossierRecord = {
    id: `local-${Date.now().toString(36)}`,
    profileId: null,
    dossierCode: code,
    title: `${input.organizationName} (${input.reportingPeriodStart})`,
    organizationName: input.organizationName,
    reportingPeriodStart: input.reportingPeriodStart,
    employeeHeadcount: input.employeeHeadcount,
    annualNetTurnoverEur: input.annualNetTurnoverEur,
    entityKind: input.entityKind,
    targetTier: input.targetTier,
    status: result.status,
    readinessScore: result.readinessScore,
    hoursSavedByCap: result.shield.estimatedHoursSavedByCap,
    canonicalText: result.canonicalDossierText,
    dossierSha256: result.dossierSha256,
    publicSlug: null,
    lockedAt: null,
    createdAt: now,
    updatedAt: now,
    input,
    result,
  };
  writeLocalList(LS_DOSSIERS, [record, ...readLocalList<VsmeDossierRecord>(LS_DOSSIERS)]);
  return record;
}

export async function updateDossier(
  mode: ApiMode,
  idOrCode: string,
  input: AssessmentInput,
): Promise<VsmeDossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to update dossier');
    const json = (await res.json()) as { item: VsmeDossierRecord };
    return json.item;
  }

  const result = await assessVsmeReadiness(input);
  const now = new Date().toISOString();
  const list = readLocalList<VsmeDossierRecord>(LS_DOSSIERS);
  const updated = list.map((item) => {
    if (String(item.id) !== String(idOrCode) && item.dossierCode !== idOrCode) return item;
    if (item.lockedAt) throw new Error('Sealed dossier cannot be modified');
    return {
      ...item,
      organizationName: input.organizationName,
      reportingPeriodStart: input.reportingPeriodStart,
      employeeHeadcount: input.employeeHeadcount,
      annualNetTurnoverEur: input.annualNetTurnoverEur,
      entityKind: input.entityKind,
      targetTier: input.targetTier,
      status: result.status,
      readinessScore: result.readinessScore,
      hoursSavedByCap: result.shield.estimatedHoursSavedByCap,
      canonicalText: result.canonicalDossierText,
      dossierSha256: result.dossierSha256,
      updatedAt: now,
      input,
      result,
    };
  });
  writeLocalList(LS_DOSSIERS, updated);
  const target = updated.find(
    (item) => String(item.id) === String(idOrCode) || item.dossierCode === idOrCode,
  );
  if (!target) throw new Error('Dossier not found');
  return target;
}

export async function finalizeDossier(
  mode: ApiMode,
  idOrCode: string,
): Promise<VsmeDossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}/finalize`), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to finalize dossier');
    const json = (await res.json()) as { item: VsmeDossierRecord };
    return json.item;
  }

  const now = new Date().toISOString();
  const list = readLocalList<VsmeDossierRecord>(LS_DOSSIERS);
  const updated = list.map((item) => {
    if (String(item.id) !== String(idOrCode) && item.dossierCode !== idOrCode) return item;
    if (item.lockedAt) return item;
    return {
      ...item,
      publicSlug: item.publicSlug || `vsme-${item.dossierSha256.slice(0, 12)}`,
      lockedAt: now,
      updatedAt: now,
    };
  });
  writeLocalList(LS_DOSSIERS, updated);
  const target = updated.find(
    (item) => String(item.id) === String(idOrCode) || item.dossierCode === idOrCode,
  );
  if (!target) throw new Error('Dossier not found');
  return target;
}

export async function duplicateDossier(
  mode: ApiMode,
  idOrCode: string,
): Promise<VsmeDossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}/duplicate`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Failed to duplicate dossier');
    const json = (await res.json()) as { item: VsmeDossierRecord };
    return json.item;
  }

  const list = readLocalList<VsmeDossierRecord>(LS_DOSSIERS);
  const src = list.find(
    (item) => String(item.id) === String(idOrCode) || item.dossierCode === idOrCode,
  );
  if (!src) throw new Error('Source dossier not found');
  return createDossier('local', { ...src.input });
}

export async function deleteDossier(mode: ApiMode, idOrCode: string): Promise<void> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}`), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete dossier');
    return;
  }
  const list = readLocalList<VsmeDossierRecord>(LS_DOSSIERS);
  writeLocalList(
    LS_DOSSIERS,
    list.filter((item) => String(item.id) !== String(idOrCode) && item.dossierCode !== idOrCode),
  );
}

export async function downloadBriefMarkdown(
  mode: ApiMode,
  dossier: VsmeDossierRecord | null,
  input: AssessmentInput,
  result: AssessmentResult,
  locale: Locale,
): Promise<void> {
  const code = dossier?.dossierCode || 'VSME-PREVIEW';
  if (mode === 'server' && dossier) {
    const res = await fetch(
      withBase(`/api/dossiers/${encodeURIComponent(dossier.dossierCode)}/brief.md?lang=${locale}`),
    );
    if (res.ok) {
      const md = await res.text();
      triggerTextDownload(`${code}.${locale}.brief.md`, 'text/markdown;charset=utf-8', md);
      return;
    }
  }
  const md = buildVsmeBriefMarkdown(input, result, code, result.dossierSha256, locale);
  triggerTextDownload(`${code}.${locale}.brief.md`, 'text/markdown;charset=utf-8', md);
}

export async function downloadAuditCsv(
  mode: ApiMode,
  dossier: VsmeDossierRecord | null,
  input: AssessmentInput,
  result: AssessmentResult,
): Promise<void> {
  const code = dossier?.dossierCode || 'VSME-PREVIEW';
  if (mode === 'server' && dossier) {
    const res = await fetch(
      withBase(`/api/dossiers/${encodeURIComponent(dossier.dossierCode)}/export.csv`),
    );
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      triggerTextDownload(`${code}.audit.csv`, 'text/csv;charset=utf-8', bytes);
      return;
    }
  }

  let csv: string;
  if (result.csvAudit && result.csvAudit.rows.length > 0) {
    csv = exportBuyerRequestsAuditCsv(result.csvAudit);
  } else {
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
      sanitizeCsvCell(code),
      sanitizeCsvCell(input.organizationName),
      sanitizeCsvCell(input.reportingPeriodStart),
      sanitizeCsvCell(input.employeeHeadcount),
      sanitizeCsvCell(input.entityKind),
      sanitizeCsvCell(input.targetTier),
      sanitizeCsvCell(result.status),
      sanitizeCsvCell(result.readinessScore),
      sanitizeCsvCell(result.shield.estimatedHoursSavedByCap),
      sanitizeCsvCell(result.dossierSha256),
    ].join(',');
    csv = `\uFEFF${header}\n${row}\n`;
  }
  const encoded = new TextEncoder().encode(csv);
  triggerTextDownload(`${code}.audit.csv`, 'text/csv;charset=utf-8', encoded);
}

export async function fetchPublicReport(
  mode: ApiMode,
  slugOrCode: string,
): Promise<PublicVsmeReport | null> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/public/reports/${encodeURIComponent(slugOrCode)}`), {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicVsmeReport;
  }

  const list = readLocalList<VsmeDossierRecord>(LS_DOSSIERS);
  const found = list.find(
    (d) => (d.publicSlug === slugOrCode || d.dossierCode === slugOrCode) && Boolean(d.lockedAt),
  );
  if (!found) return null;

  const viewsMap = JSON.parse(localStorage.getItem(LS_VIEWS) || '{}') as Record<string, number>;
  const viewCount = (viewsMap[found.dossierCode] || 0) + 1;
  viewsMap[found.dossierCode] = viewCount;
  localStorage.setItem(LS_VIEWS, JSON.stringify(viewsMap));

  return {
    viewCount,
    lastViewedAt: new Date().toISOString(),
    report: {
      dossierCode: found.dossierCode,
      publicSlug: found.publicSlug || found.dossierCode,
      organizationName: found.organizationName,
      reportingPeriodStart: found.reportingPeriodStart,
      employeeHeadcount: found.employeeHeadcount,
      entityKind: found.entityKind,
      targetTier: found.targetTier,
      status: found.status,
      readinessScore: found.readinessScore,
      hoursSavedByCap: found.hoursSavedByCap,
      lockedAt: found.lockedAt!,
      dossierSha256: found.dossierSha256,
      legalDisclaimerEn: found.result.legalDisclaimerEn,
      legalDisclaimerAr: found.result.legalDisclaimerAr,
      shield: found.result.shield,
      disclosures: found.result.disclosures,
      briefAr: buildVsmeBriefMarkdown(
        found.input,
        found.result,
        found.dossierCode,
        found.dossierSha256,
        'ar',
      ),
      briefEn: buildVsmeBriefMarkdown(
        found.input,
        found.result,
        found.dossierCode,
        found.dossierSha256,
        'en',
      ),
    },
  };
}

export function getPresetSampleBuyerCsv(): string {
  return VSME_PRESETS[2]?.input.buyerRequestsCsv || '';
}
