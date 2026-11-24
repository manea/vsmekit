import { ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import type {
  AssessmentInput,
  AssessmentResult,
  BuyerRequestType,
  ReportingEntityKind,
  VsmeReportingTier,
} from '../core/types.ts';
import type { Locale, Translations } from '../lib/i18n.ts';
import { VsmeShieldAndDisclosureSvg } from './VsmeShieldAndDisclosureSvg.tsx';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  t: Translations;
  locked: boolean;
  onChange: (patch: Partial<AssessmentInput>) => void;
}

export function ScopeAndShieldPanel({
  input,
  result,
  locale,
  t,
  locked,
  onChange,
}: Props) {
  const { shield } = result;

  return (
    <div className="space-y-4">
      <div className="vsme-card rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[var(--text-primary)]">{t.shieldCardTitle}</h2>
          <span className="vsme-mono rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
            (EU) 2026/1560 · Omnibus I
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.organizationName}</span>
            <input
              type="text"
              className="vsme-input"
              disabled={locked}
              value={input.organizationName}
              onChange={(e) => onChange({ organizationName: e.target.value })}
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.reportingPeriodStart}</span>
            <input
              type="date"
              className="vsme-input vsme-mono num-tabular"
              disabled={locked}
              value={input.reportingPeriodStart}
              onChange={(e) => onChange({ reportingPeriodStart: e.target.value })}
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.employeeHeadcount}</span>
            <input
              type="number"
              min={0}
              className="vsme-input vsme-mono num-tabular"
              disabled={locked}
              value={input.employeeHeadcount}
              onChange={(e) =>
                onChange({ employeeHeadcount: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.annualNetTurnoverEur}</span>
            <input
              type="number"
              min={0}
              step={10000}
              className="vsme-input vsme-mono num-tabular"
              disabled={locked}
              value={input.annualNetTurnoverEur}
              onChange={(e) =>
                onChange({ annualNetTurnoverEur: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.entityKind}</span>
            <select
              className="vsme-input"
              disabled={locked}
              value={input.entityKind}
              onChange={(e) => onChange({ entityKind: e.target.value as ReportingEntityKind })}
            >
              <option value="micro_undertaking">{t.entityMicro}</option>
              <option value="sme_unlisted">{t.entitySme}</option>
              <option value="mid_market_up_to_1000">{t.entityMidMarket}</option>
              <option value="large_above_1000_csrd">{t.entityLargeCsrd}</option>
            </select>
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
            <span>{t.targetTier}</span>
            <select
              className="vsme-input"
              disabled={locked}
              value={input.targetTier}
              onChange={(e) => onChange({ targetTier: e.target.value as VsmeReportingTier })}
            >
              <option value="basic_b1_b11">{t.tierBasic}</option>
              <option value="comprehensive_c1_c9">{t.tierComprehensive}</option>
            </select>
          </label>

          <label className="block space-y-1 text-xs font-semibold text-[var(--text-secondary)] md:col-span-2">
            <span>{t.incomingBuyerRequest}</span>
            <select
              className="vsme-input"
              disabled={locked}
              value={input.incomingBuyerRequest}
              onChange={(e) =>
                onChange({ incomingBuyerRequest: e.target.value as BuyerRequestType })
              }
            >
              <option value="none">{t.reqNone}</option>
              <option value="vsme_basic">{t.reqBasic}</option>
              <option value="vsme_comprehensive">{t.reqComprehensive}</option>
              <option value="full_esrs_or_custom_excess">{t.reqExcess}</option>
            </select>
          </label>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm font-medium text-[var(--text-primary)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent-primary)]"
            disabled={locked}
            checked={input.seeksGreenFinancingOrScope3Buyer}
            onChange={(e) => onChange({ seeksGreenFinancingOrScope3Buyer: e.target.checked })}
          />
          <span>{t.seeksGreenFinance}</span>
        </label>

        <label className="mt-4 block space-y-1 text-xs font-semibold text-[var(--text-secondary)]">
          <span>{t.notesLabel}</span>
          <textarea
            rows={2}
            className="vsme-input"
            disabled={locked}
            value={input.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </label>
      </div>

      {/* Shield KPI Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="vsme-card rounded-xl p-3">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {t.shieldEligible}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)]">
            {shield.eligibleForValueChainShield ? (
              <ShieldCheck className="h-4 w-4 text-[var(--accent-emerald)]" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[var(--accent-crimson)]" />
            )}
            <span>{shield.eligibleForValueChainShield ? t.yes : t.no}</span>
          </div>
        </div>

        <div className="vsme-card rounded-xl p-3">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {t.shieldMandatoryCsrd}
          </div>
          <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">
            {shield.mandatoryCsrdInScope ? t.yes : t.no}
          </div>
        </div>

        <div className="vsme-card rounded-xl p-3">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {t.shieldCapActive}
          </div>
          <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">
            {shield.valueChainCapActive ? t.yes : t.no}
          </div>
        </div>

        <div className="vsme-card rounded-xl p-3">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {t.shieldProtected}
          </div>
          <div className="mt-1 text-sm font-bold text-[var(--accent-emerald)]">
            {shield.shieldProtectsAgainstExcessRequest ? t.yes : t.no}
          </div>
        </div>

        <div className="vsme-card col-span-2 rounded-xl p-3 lg:col-span-1">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {t.shieldHoursSaved}
          </div>
          <div className="vsme-mono num-tabular mt-1 flex items-center gap-1.5 text-sm font-bold text-[var(--accent-primary)]">
            <Sparkles className="h-4 w-4" />
            <span>{shield.estimatedHoursSavedByCap}h</span>
          </div>
        </div>
      </div>

      <VsmeShieldAndDisclosureSvg
        result={result}
        employeeHeadcount={input.employeeHeadcount}
        annualNetTurnoverEur={input.annualNetTurnoverEur}
        locale={locale}
      />
    </div>
  );
}
