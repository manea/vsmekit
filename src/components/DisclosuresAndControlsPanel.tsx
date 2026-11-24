import { CheckSquare, Square, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  VSME_BASIC_DISCLOSURES,
  VSME_COMPREHENSIVE_DISCLOSURES,
  VSME_CONTROLS,
} from '../core/index.ts';
import type {
  AssessmentInput,
  AssessmentResult,
  VsmeBasicDisclosureId,
  VsmeComprehensiveDisclosureId,
  VsmeControlId,
} from '../core/types.ts';
import type { Locale, Translations } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  t: Translations;
  locked: boolean;
  onChange: (patch: Partial<AssessmentInput>) => void;
}

export function DisclosuresAndControlsPanel({
  input,
  result,
  locale,
  t,
  locked,
  onChange,
}: Props) {
  const isAr = locale === 'ar';

  function toggleBasic(id: VsmeBasicDisclosureId) {
    if (locked) return;
    const set = new Set(input.completedBasicDisclosures);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ completedBasicDisclosures: Array.from(set) });
  }

  function toggleComprehensive(id: VsmeComprehensiveDisclosureId) {
    if (locked) return;
    const set = new Set(input.completedComprehensiveDisclosures);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ completedComprehensiveDisclosures: Array.from(set) });
  }

  function toggleControl(id: VsmeControlId) {
    if (locked) return;
    const set = new Set(input.implementedControls);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ implementedControls: Array.from(set) });
  }

  return (
    <div className="space-y-4">
      {/* Basic Module B1-B11 */}
      <div className="vsme-card rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {t.basicDisclosuresTitle}
            </h2>
            <p className="vsme-mono num-tabular text-xs text-[var(--text-secondary)]">
              {result.disclosures.basicCompletedCount}/{result.disclosures.basicRequiredCount} (
              {result.disclosures.basicCompletionPct}%)
            </p>
          </div>
          <button
            type="button"
            disabled={locked}
            onClick={() =>
              onChange({
                completedBasicDisclosures: VSME_BASIC_DISCLOSURES.map((d) => d.id),
              })
            }
            className="whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
          >
            {t.selectAllBasic}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {VSME_BASIC_DISCLOSURES.map((item) => {
            const active = input.completedBasicDisclosures.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={locked}
                onClick={() => toggleBasic(item.id)}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-start transition ${
                  active
                    ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                }`}
              >
                {active ? (
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-emerald)]" />
                ) : (
                  <Square className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="vsme-mono text-xs font-bold text-[var(--text-primary)]">
                      {item.id}
                    </span>
                    <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                      {item.pillar}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {isAr ? item.titleAr : item.titleEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Module C1-C9 */}
      <div className="vsme-card rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {t.comprehensiveDisclosuresTitle}
            </h2>
            <p className="vsme-mono num-tabular text-xs text-[var(--text-secondary)]">
              {result.disclosures.comprehensiveCompletedCount}/
              {result.disclosures.comprehensiveRequiredCount} (
              {result.disclosures.comprehensiveCompletionPct}%)
            </p>
          </div>
          <button
            type="button"
            disabled={locked}
            onClick={() =>
              onChange({
                completedComprehensiveDisclosures: VSME_COMPREHENSIVE_DISCLOSURES.map((d) => d.id),
              })
            }
            className="whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
          >
            {t.selectAllComprehensive}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {VSME_COMPREHENSIVE_DISCLOSURES.map((item) => {
            const active = input.completedComprehensiveDisclosures.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={locked}
                onClick={() => toggleComprehensive(item.id)}
                className={`flex items-start gap-2.5 rounded-xl border p-3 text-start transition ${
                  active
                    ? 'border-[var(--accent-cobalt)] bg-[var(--accent-cobalt-soft)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                }`}
              >
                {active ? (
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-cobalt)]" />
                ) : (
                  <Square className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="vsme-mono text-xs font-bold text-[var(--text-primary)]">
                      {item.id}
                    </span>
                    <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                      {item.pillar}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {isAr ? item.titleAr : item.titleEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy & GHG Metrics */}
      <div className="vsme-card rounded-2xl p-5">
        <h2 className="mb-4 text-base font-bold text-[var(--text-primary)]">{t.metricsHeading}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.energyMwh}</span>
            <input
              type="number"
              min={0}
              step="0.1"
              disabled={locked}
              className="vsme-input vsme-mono num-tabular"
              value={input.energyMwh}
              onChange={(e) => onChange({ energyMwh: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.scope1Tco2e}</span>
            <input
              type="number"
              min={0}
              step="0.1"
              disabled={locked}
              className="vsme-input vsme-mono num-tabular"
              value={input.scope1Tco2e}
              onChange={(e) => onChange({ scope1Tco2e: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.scope2Tco2e}</span>
            <input
              type="number"
              min={0}
              step="0.1"
              disabled={locked}
              className="vsme-input vsme-mono num-tabular"
              value={input.scope2Tco2e}
              onChange={(e) => onChange({ scope2Tco2e: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.scope3Tco2e}</span>
            <input
              type="number"
              min={0}
              step="0.1"
              disabled={locked}
              className="vsme-input vsme-mono num-tabular"
              value={input.scope3Tco2e}
              onChange={(e) => onChange({ scope3Tco2e: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.antiCorruptionConvictions}</span>
            <input
              type="number"
              min={0}
              disabled={locked}
              className="vsme-input vsme-mono num-tabular"
              value={input.antiCorruptionConvictionsCount}
              onChange={(e) =>
                onChange({
                  antiCorruptionConvictionsCount: Math.max(0, Math.round(Number(e.target.value) || 0)),
                })
              }
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {t.totalScope12}
            </div>
            <div className="vsme-mono num-tabular mt-1 text-base font-bold text-[var(--text-primary)]">
              {result.disclosures.totalScope1And2Tco2e} tCO2e
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {t.totalWithScope3}
            </div>
            <div className="vsme-mono num-tabular mt-1 text-base font-bold text-[var(--text-primary)]">
              {result.disclosures.totalGhgWithScope3Tco2e} tCO2e
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {t.ghgIntensity}
            </div>
            <div className="vsme-mono num-tabular mt-1 text-base font-bold text-[var(--accent-primary)]">
              {result.disclosures.ghgIntensityTco2ePerEurMillion}
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Findings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="vsme-card rounded-2xl p-5">
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">
            {t.controlsHeading}
          </h2>
          <div className="space-y-2">
            {VSME_CONTROLS.map((ctrl) => {
              const checked = input.implementedControls.includes(ctrl.id);
              return (
                <button
                  key={ctrl.id}
                  type="button"
                  disabled={locked}
                  onClick={() => toggleControl(ctrl.id)}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-start transition ${
                    checked
                      ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-emerald)]" />
                  ) : (
                    <Square className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="vsme-mono text-xs font-bold text-[var(--text-primary)]">
                        {ctrl.id}
                      </span>
                      <span className="vsme-mono num-tabular text-[11px] font-semibold text-[var(--text-secondary)]">
                        {ctrl.weight} pts
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {isAr ? ctrl.titleAr : ctrl.titleEn}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                      {isAr ? ctrl.descriptionAr : ctrl.descriptionEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="vsme-card rounded-2xl p-5">
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">
            {t.findingsHeading}
          </h2>
          <div className="space-y-2.5">
            {result.findings.map((finding) => {
              const boxClass =
                finding.severity === 'blocker'
                  ? 'border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]'
                  : finding.severity === 'warning'
                    ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-soft)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]';
              return (
                <div key={finding.code} className={`rounded-xl border p-3 ${boxClass}`}>
                  <div className="flex items-start gap-2">
                    {finding.severity === 'blocker' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-crimson)]" />
                    ) : finding.severity === 'warning' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-amber)]" />
                    ) : finding.code.startsWith('VSME-VALUE-CHAIN-SHIELD') ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-emerald)]" />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-cobalt)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="vsme-mono text-[11px] font-bold text-[var(--text-primary)]">
                          {finding.code}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {isAr ? finding.titleAr : finding.titleEn}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {isAr ? finding.detailAr : finding.detailEn}
                      </p>
                      <div className="vsme-mono mt-1 text-[10px] text-[var(--text-secondary)]">
                        {finding.legalRef}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
