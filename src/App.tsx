import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Globe,
  HardDrive,
  Lock,
  Moon,
  Shield,
  Sun,
} from 'lucide-react';
import {
  VSME_PRESETS,
  VSME_TOOL_VERSION,
  assessVsmeReadiness,
} from './core/index.ts';
import type { AssessmentInput, AssessmentResult } from './core/types.ts';
import { BuyerCsvAuditPanel } from './components/BuyerCsvAuditPanel.tsx';
import { DisclosuresAndControlsPanel } from './components/DisclosuresAndControlsPanel.tsx';
import { DossierVaultAndPrint } from './components/DossierVaultAndPrint.tsx';
import { ScopeAndShieldPanel } from './components/ScopeAndShieldPanel.tsx';
import {
  type ApiMode,
  type PublicVsmeReport,
  type VsmeDossierRecord,
  type VsmeOrgProfile,
  createDossier,
  deleteDossier,
  detectApiMode,
  downloadAuditCsv,
  downloadBriefMarkdown,
  duplicateDossier,
  fetchPublicReport,
  finalizeDossier,
  listDossiers,
  listProfiles,
  saveOrgProfile,
  updateDossier,
} from './lib/api.ts';
import { stripBase, withBase } from './lib/basePath.ts';
import { type Locale, type ThemeMode, getTranslations } from './lib/i18n.ts';

type WorkspaceTab = 'scope' | 'disclosures' | 'csv' | 'vault';

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem('vsmekit.v1.locale');
    return saved === 'ar' ? 'ar' : 'en';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'esg-parchment';
    const saved = window.localStorage.getItem('vsmekit.v1.theme');
    return saved === 'carbon-slate' ? 'carbon-slate' : 'esg-parchment';
  });
  const [mode, setMode] = useState<ApiMode>('local');
  const [tab, setTab] = useState<WorkspaceTab>('scope');
  const [input, setInput] = useState<AssessmentInput>(() => ({ ...VSME_PRESETS[0]!.input }));
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [dossiers, setDossiers] = useState<VsmeDossierRecord[]>([]);
  const [profiles, setProfiles] = useState<VsmeOrgProfile[]>([]);
  const [activeDossier, setActiveDossier] = useState<VsmeDossierRecord | null>(null);
  const [publicSlug, setPublicSlug] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const stripped = stripBase(window.location.pathname);
    return stripped.startsWith('/r/') ? decodeURIComponent(stripped.slice(3)) : null;
  });
  const [publicData, setPublicData] = useState<PublicVsmeReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = getTranslations(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('vsmekit.v1.locale', locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('vsmekit.v1.theme', theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const detected = await detectApiMode();
      if (cancelled) return;
      setMode(detected);
      const [loadedDossiers, loadedProfiles] = await Promise.all([
        listDossiers(detected).catch(() => []),
        listProfiles(detected).catch(() => []),
      ]);
      if (cancelled) return;
      setDossiers(loadedDossiers);
      setProfiles(loadedProfiles);

      if (publicSlug) {
        const pub = await fetchPublicReport(detected, publicSlug);
        if (!cancelled) setPublicData(pub);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicSlug]);

  useEffect(() => {
    let cancelled = false;
    void assessVsmeReadiness(input).then((assessed) => {
      if (!cancelled) setResult(assessed);
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  function patchInput(patch: Partial<AssessmentInput>) {
    setErrorMsg(null);
    setInput((prev) => ({ ...prev, ...patch }));
  }

  function applyPreset(presetId: string) {
    const found = VSME_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActiveDossier(null);
    setErrorMsg(null);
    setInput({ ...found.input });
  }

  async function refreshVault(currentMode: ApiMode) {
    const [nextDossiers, nextProfiles] = await Promise.all([
      listDossiers(currentMode),
      listProfiles(currentMode),
    ]);
    setDossiers(nextDossiers);
    setProfiles(nextProfiles);
  }

  async function handleCreateDossier() {
    setBusy(true);
    setErrorMsg(null);
    try {
      const created = await createDossier(mode, input);
      setActiveDossier(created);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateDossier() {
    if (!activeDossier) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const updated = await updateDossier(mode, activeDossier.dossierCode, input);
      setActiveDossier(updated);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update draft');
    } finally {
      setBusy(false);
    }
  }

  async function handleFinalizeDossier() {
    if (!activeDossier) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const updated = await updateDossier(mode, activeDossier.dossierCode, input);
      const sealed = await finalizeDossier(mode, updated.dossierCode);
      setActiveDossier(sealed);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to seal dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicateDossier(code: string) {
    setBusy(true);
    setErrorMsg(null);
    try {
      const copy = await duplicateDossier(mode, code);
      setActiveDossier(copy);
      setInput({ ...copy.input });
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to duplicate dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDossier(code: string) {
    setBusy(true);
    setErrorMsg(null);
    try {
      await deleteDossier(mode, code);
      if (activeDossier?.dossierCode === code) {
        setActiveDossier(null);
      }
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveOrgProfile(mode, input);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setBusy(false);
    }
  }

  function handleOpenPublicReport(slugOrCode: string) {
    window.history.pushState({}, '', withBase(`/r/${encodeURIComponent(slugOrCode)}`));
    setPublicSlug(slugOrCode);
  }

  function handleExitPublicReport() {
    window.history.pushState({}, '', withBase('/'));
    setPublicSlug(null);
    setPublicData(null);
  }

  const locked = Boolean(activeDossier?.lockedAt);

  if (publicSlug) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] px-4 py-6 text-[var(--text-primary)]">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleExitPublicReport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.backToWorkspace}</span>
            </button>
            <button
              type="button"
              onClick={() => setLocale((prev) => (prev === 'en' ? 'ar' : 'en'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t.switchLangLabel}</span>
            </button>
          </div>

          {publicData ? (
            <div className="vsme-card rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <div className="vsme-mono flex items-center gap-1.5 text-xs font-bold text-[var(--accent-cobalt)]">
                    <Lock className="h-3.5 w-3.5" />
                    <span>{publicData.report.dossierCode}</span>
                  </div>
                  <h1 className="mt-1 text-xl font-extrabold">
                    {publicData.report.organizationName}
                  </h1>
                </div>
                <div className="text-end">
                  <div className="vsme-mono num-tabular text-sm font-bold text-[var(--accent-emerald)]">
                    {publicData.report.status.toUpperCase()} · {publicData.report.readinessScore}/100
                  </div>
                  <div className="vsme-mono num-tabular text-xs text-[var(--text-secondary)]">
                    {t.publicViewsLabel}: {publicData.viewCount}
                  </div>
                </div>
              </div>

              <div className="vsme-mono break-all rounded-xl bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-secondary)]">
                {t.sha256Label}: {publicData.report.dossierSha256}
              </div>

              <pre className="vsme-mono whitespace-pre-wrap break-words rounded-xl bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed">
                {locale === 'ar' ? publicData.report.briefAr : publicData.report.briefEn}
              </pre>
            </div>
          ) : (
            <div className="vsme-card rounded-2xl p-6 text-sm text-[var(--text-secondary)]">
              Loading sealed VSME report ({publicSlug})...
            </div>
          )}
        </div>
      </div>
    );
  }

  const badgeColors =
    result?.status === 'ready'
      ? { bg: 'var(--accent-emerald-soft)', fg: 'var(--accent-emerald)', label: t.statusReady }
      : result?.status === 'conditional'
        ? { bg: 'var(--accent-amber-soft)', fg: 'var(--accent-amber)', label: t.statusConditional }
        : { bg: 'var(--accent-crimson-soft)', fg: 'var(--accent-crimson)', label: t.statusBlocked };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="no-print border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight">VSMEKit</span>
                <span className="vsme-mono rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                  v{VSME_TOOL_VERSION}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-primary)]">
                  {mode === 'server' ? (
                    <Database className="h-3 w-3" />
                  ) : (
                    <HardDrive className="h-3 w-3" />
                  )}
                  <span>{mode === 'server' ? t.modeServer : t.modeLocal}</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{t.brandTagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="lang-toggle"
              onClick={() => setLocale((prev) => (prev === 'en' ? 'ar' : 'en'))}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t.switchLangLabel}</span>
            </button>

            <button
              type="button"
              data-testid="theme-toggle"
              onClick={() =>
                setTheme((prev) => (prev === 'esg-parchment' ? 'carbon-slate' : 'esg-parchment'))
              }
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
            >
              {theme === 'esg-parchment' ? (
                <Moon className="h-3.5 w-3.5" />
              ) : (
                <Sun className="h-3.5 w-3.5" />
              )}
              <span>{theme === 'esg-parchment' ? t.themeDarkLabel : t.themeLightLabel}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
        {/* Preset Bar & Live Score Summary */}
        <section className="no-print vsme-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t.presetHeading}
            </div>
            <span className="rounded-full bg-[var(--accent-amber-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-amber)]">
              {t.independentNoticeBadge}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {VSME_PRESETS.map((preset) => {
              const selected =
                !activeDossier && input.organizationName === preset.input.organizationName;
              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`preset-${preset.id}`}
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-xl border p-3 text-start transition ${
                    selected
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {locale === 'ar' ? preset.labelAr : preset.labelEn}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    {locale === 'ar' ? preset.descriptionAr : preset.descriptionEn}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Telemetry Summary Banner */}
        {result && (
          <section className="no-print vsme-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                data-testid="status-badge"
                className="vsme-mono rounded-lg px-3 py-1.5 text-xs font-extrabold tracking-wide"
                style={{ backgroundColor: badgeColors.bg, color: badgeColors.fg }}
              >
                {badgeColors.label}
              </span>
              <div>
                <div className="vsme-mono num-tabular text-sm font-bold text-[var(--text-primary)]">
                  {t.readinessScore}: {result.readinessScore}/100
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {input.organizationName} ·{' '}
                  {activeDossier ? `${t.dossierCodeLabel}: ${activeDossier.dossierCode}` : t.draftBadge}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {result.shield.shieldProtectsAgainstExcessRequest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-emerald-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-emerald)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>2027 Shield ({result.shield.estimatedHoursSavedByCap}h saved)</span>
                </span>
              )}
              {locked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-cobalt-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-cobalt)]">
                  <Lock className="h-3.5 w-3.5" />
                  <span>{t.lockedBadge}</span>
                </span>
              )}
            </div>
          </section>
        )}

        {errorMsg && (
          <div className="no-print rounded-xl border border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-crimson)]">
            {errorMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="no-print flex flex-wrap gap-2">
          {(
            [
              ['scope', t.tabScopeShield],
              ['disclosures', t.tabDisclosuresGhg],
              ['csv', t.tabBuyerCsv],
              ['vault', t.tabVault],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              data-testid={`tab-${key}`}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === key
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]'
                  : 'vsme-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Active Panel */}
        {result && (
          <section>
            {tab === 'scope' && (
              <ScopeAndShieldPanel
                input={input}
                result={result}
                locale={locale}
                t={t}
                locked={locked}
                onChange={patchInput}
              />
            )}
            {tab === 'disclosures' && (
              <DisclosuresAndControlsPanel
                input={input}
                result={result}
                locale={locale}
                t={t}
                locked={locked}
                onChange={patchInput}
              />
            )}
            {tab === 'csv' && (
              <BuyerCsvAuditPanel
                input={input}
                result={result}
                t={t}
                locked={locked}
                onChange={patchInput}
                onDownloadCsv={() =>
                  void downloadAuditCsv(mode, activeDossier, input, result)
                }
              />
            )}
            {tab === 'vault' && (
              <DossierVaultAndPrint
                input={input}
                result={result}
                activeDossier={activeDossier}
                dossiers={dossiers}
                profiles={profiles}
                locale={locale}
                t={t}
                busy={busy}
                onCreateDossier={() => void handleCreateDossier()}
                onUpdateDossier={() => void handleUpdateDossier()}
                onFinalizeDossier={() => void handleFinalizeDossier()}
                onDuplicateDossier={(code) => void handleDuplicateDossier(code)}
                onDeleteDossier={(code) => void handleDeleteDossier(code)}
                onSelectDossier={(item) => {
                  setActiveDossier(item);
                  setInput({ ...item.input });
                }}
                onSaveProfile={() => void handleSaveProfile()}
                onLoadProfile={(prof) => {
                  setActiveDossier(null);
                  patchInput({
                    organizationName: prof.organizationName,
                    entityKind: prof.entityKind,
                    reportingPeriodStart: prof.reportingPeriodStart,
                    employeeHeadcount: prof.employeeHeadcount,
                    annualNetTurnoverEur: prof.annualNetTurnoverEur,
                    targetTier: prof.defaultTier,
                    notes: prof.notes,
                  });
                  setTab('scope');
                }}
                onDownloadBrief={() =>
                  void downloadBriefMarkdown(mode, activeDossier, input, result, locale)
                }
                onDownloadCsv={() =>
                  void downloadAuditCsv(mode, activeDossier, input, result)
                }
                onOpenPublicReport={handleOpenPublicReport}
              />
            )}
          </section>
        )}

        {/* Statutory Non-Assurance Disclaimer Footer */}
        {result && (
          <footer className="vsme-card rounded-2xl p-4 text-xs text-[var(--text-secondary)]">
            <div className="font-bold text-[var(--text-primary)]">{t.legalFooterTitle}</div>
            <p className="mt-1">
              {locale === 'ar' ? result.legalDisclaimerAr : result.legalDisclaimerEn}
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}
