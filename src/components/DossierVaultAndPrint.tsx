import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Printer,
  Save,
  Trash2,
} from 'lucide-react';
import { buildVsmeBriefMarkdown } from '../core/index.ts';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import type { VsmeDossierRecord, VsmeOrgProfile } from '../lib/api.ts';
import type { Locale, Translations } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  activeDossier: VsmeDossierRecord | null;
  dossiers: VsmeDossierRecord[];
  profiles: VsmeOrgProfile[];
  locale: Locale;
  t: Translations;
  busy: boolean;
  onCreateDossier: () => void;
  onUpdateDossier: () => void;
  onFinalizeDossier: () => void;
  onDuplicateDossier: (code: string) => void;
  onDeleteDossier: (code: string) => void;
  onSelectDossier: (item: VsmeDossierRecord) => void;
  onSaveProfile: () => void;
  onLoadProfile: (profile: VsmeOrgProfile) => void;
  onDownloadBrief: () => void;
  onDownloadCsv: () => void;
  onOpenPublicReport: (slugOrCode: string) => void;
}

export function DossierVaultAndPrint({
  input,
  result,
  activeDossier,
  dossiers,
  profiles,
  locale,
  t,
  busy,
  onCreateDossier,
  onUpdateDossier,
  onFinalizeDossier,
  onDuplicateDossier,
  onDeleteDossier,
  onSelectDossier,
  onSaveProfile,
  onLoadProfile,
  onDownloadBrief,
  onDownloadCsv,
  onOpenPublicReport,
}: Props) {
  const locked = Boolean(activeDossier?.lockedAt);
  const code = activeDossier?.dossierCode || 'VSME-PREVIEW';
  const digest = activeDossier?.dossierSha256 || result.dossierSha256;
  const briefText = buildVsmeBriefMarkdown(input, result, code, digest, locale);

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="no-print vsme-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            data-testid="btn-create-dossier"
            onClick={onCreateDossier}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{t.createDossier}</span>
          </button>

          {activeDossier && !locked && (
            <button
              type="button"
              disabled={busy}
              data-testid="btn-update-draft"
              onClick={onUpdateDossier}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{t.saveDraft}</span>
            </button>
          )}

          {activeDossier && !locked && (
            <button
              type="button"
              disabled={busy}
              data-testid="btn-seal-dossier"
              onClick={onFinalizeDossier}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--accent-cobalt)] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{t.sealDossier}</span>
            </button>
          )}

          {activeDossier && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDuplicateDossier(activeDossier.dossierCode)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{t.duplicateDraft}</span>
            </button>
          )}

          {activeDossier && !locked && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeleteDossier(activeDossier.dossierCode)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--accent-crimson)] px-3 py-2 text-xs font-semibold text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson-soft)] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.deleteDossier}</span>
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={onSaveProfile}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
          >
            <span>{t.saveProfile}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadBrief}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t.downloadMarkdown}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadCsv}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t.downloadCsvBom}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{t.printPdf}</span>
          </button>

          {activeDossier && locked && (
            <button
              type="button"
              data-testid="btn-open-public"
              onClick={() =>
                onOpenPublicReport(activeDossier.publicSlug || activeDossier.dossierCode)
              }
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--accent-emerald)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{t.openPublicReport}</span>
            </button>
          )}
        </div>
      </div>

      {/* Vault List & Saved Profiles */}
      <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="vsme-card rounded-2xl p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
            {t.vaultTitle} ({dossiers.length})
          </h3>
          {dossiers.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">{t.noDossiersYet}</p>
          ) : (
            <div className="space-y-2">
              {dossiers.map((item) => {
                const isSelected = activeDossier?.dossierCode === item.dossierCode;
                return (
                  <button
                    key={item.dossierCode}
                    type="button"
                    onClick={() => onSelectDossier(item)}
                    className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-start transition ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-soft)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="vsme-mono text-xs font-bold text-[var(--text-primary)]">
                          {item.dossierCode}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {item.organizationName}
                        </span>
                        <span
                          className="vsme-mono rounded px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: item.lockedAt
                              ? 'var(--accent-cobalt-soft)'
                              : 'var(--bg-surface)',
                            color: item.lockedAt
                              ? 'var(--accent-cobalt)'
                              : 'var(--text-secondary)',
                          }}
                        >
                          {item.lockedAt ? t.lockedBadge : t.draftBadge}
                        </span>
                      </div>
                      <div className="vsme-mono mt-1 truncate text-[10px] text-[var(--text-secondary)]">
                        {item.dossierSha256}
                      </div>
                    </div>
                    <div className="vsme-mono num-tabular text-xs font-bold text-[var(--text-primary)]">
                      {item.status.toUpperCase()} · {item.readinessScore}/100
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="vsme-card rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
            {t.profilesTitle} ({profiles.length})
          </h3>
          {profiles.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">{t.noProfilesYet}</p>
          ) : (
            <div className="space-y-2">
              {profiles.map((prof) => (
                <button
                  key={String(prof.id)}
                  type="button"
                  onClick={() => onLoadProfile(prof)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-start hover:border-[var(--accent-primary)]"
                >
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {prof.organizationName}
                  </div>
                  <div className="vsme-mono num-tabular mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    {prof.employeeHeadcount} FTE · EUR {prof.annualNetTurnoverEur.toLocaleString('en-US')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Printable Executive Sheet */}
      <div className="print-only-sheet vsme-card rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <div className="vsme-mono text-xs font-bold text-[var(--accent-primary)]">
              {t.dossierCodeLabel}: {code} · {locked ? t.lockedBadge : t.draftBadge}
            </div>
            <div className="vsme-mono mt-1 break-all text-[11px] text-[var(--text-secondary)]">
              {t.sha256Label}: {digest}
            </div>
          </div>
          <div className="vsme-mono num-tabular text-sm font-bold text-[var(--text-primary)]">
            {result.status.toUpperCase()} ({result.readinessScore}/100)
          </div>
        </div>

        <pre className="vsme-mono whitespace-pre-wrap break-words rounded-xl bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed text-[var(--text-primary)]">
          {briefText}
        </pre>
      </div>
    </div>
  );
}
