import type { AssessmentResult } from '../core/types.ts';
import type { Locale } from '../lib/i18n.ts';

interface Props {
  result: AssessmentResult;
  employeeHeadcount: number;
  annualNetTurnoverEur: number;
  locale: Locale;
}

export function VsmeShieldAndDisclosureSvg({
  result,
  employeeHeadcount,
  annualNetTurnoverEur,
  locale,
}: Props) {
  const { shield, disclosures } = result;
  const isAr = locale === 'ar';

  const statusColor =
    result.status === 'ready'
      ? 'var(--accent-emerald)'
      : result.status === 'conditional'
        ? 'var(--accent-amber)'
        : 'var(--accent-crimson)';

  const shieldColor = shield.mandatoryCsrdInScope
    ? 'var(--accent-crimson)'
    : shield.shieldProtectsAgainstExcessRequest
      ? 'var(--accent-emerald)'
      : shield.eligibleForValueChainShield
        ? 'var(--accent-cobalt)'
        : 'var(--accent-amber)';

  const basicBarW = Math.max(4, Math.round((disclosures.basicCompletionPct / 100) * 232));
  const compBarW = Math.max(4, Math.round((disclosures.comprehensiveCompletionPct / 100) * 232));
  const scoreBarW = Math.max(4, Math.round((result.readinessScore / 100) * 232));
  const headcountPct = Math.min(100, Math.round((employeeHeadcount / 1000) * 100));
  const headcountBarW = Math.max(4, Math.round((headcountPct / 100) * 224));

  return (
    <div className="vsme-card rounded-2xl p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--text-secondary)]">
        <span>
          {isAr
            ? 'مخطط درع سلسلة القيمة 2027 واكتمال B1–C9'
            : '2027 Value-Chain Cap & B1–C9 Disclosure Matrix Telemetry'}
        </span>
        <span className="vsme-mono num-tabular" dir="ltr" style={{ color: statusColor }}>
          {result.status.toUpperCase()} · {result.readinessScore}/100
        </span>
      </div>

      <div dir="ltr">
        <svg
          viewBox="0 0 640 220"
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={
            isAr
              ? 'مخطط حدود CSRD ودرع 2027 ومصفوفة B1-B11 وC1-C9'
              : 'CSRD threshold, 2027 Value-Chain Shield, and VSME B1-B11 / C1-C9 matrix chart'
          }
        >
        {/* Left Panel: Omnibus I & 2027 Shield */}
        <rect
          x="4"
          y="6"
          width="308"
          height="206"
          rx="14"
          fill="var(--bg-elevated)"
          stroke="var(--border-subtle)"
          strokeWidth="1.2"
        />
        <text
          x="18"
          y="30"
          fill="var(--text-primary)"
          fontSize="13"
          fontWeight="700"
        >
          Omnibus I &amp; 2027 Shield Cutoff
        </text>
        <text x="18" y="50" fill="var(--text-secondary)" fontSize="11.5">
          {`FTE: ${employeeHeadcount.toLocaleString('en-US')} / 1,000 cap (${headcountPct}%)`}
        </text>
        <rect x="18" y="58" width="236" height="10" rx="5" fill="var(--border-subtle)" />
        <rect x="18" y="58" width={headcountBarW} height="10" rx="5" fill={shieldColor} />

        <text x="18" y="90" fill="var(--text-secondary)" fontSize="11.5">
          {`Turnover: EUR ${annualNetTurnoverEur.toLocaleString('en-US')} vs EUR 450M`}
        </text>
        <text x="18" y="114" fill="var(--text-primary)" fontSize="11.5" fontWeight="600">
          {shield.mandatoryCsrdInScope
            ? 'CSRD Mandatory Scope (>1,000 & >EUR 450M)'
            : shield.valueChainCapActive
              ? '2027-01-01 Value-Chain Cap: ACTIVE'
              : 'Pre-2027 Period: Cap Voluntary Until 2027-01-01'}
        </text>

        <rect
          x="16"
          y="130"
          width="284"
          height="66"
          rx="10"
          fill="var(--bg-surface)"
          stroke={shieldColor}
          strokeWidth="1.5"
        />
        <text x="28" y="153" fill={shieldColor} fontSize="11.5" fontWeight="700">
          {shield.shieldProtectsAgainstExcessRequest
            ? 'SHIELD ACTIVE: Excess CSRD Survey Blocked'
            : shield.eligibleForValueChainShield
              ? `Tier: ${shield.recommendedTier === 'comprehensive_c1_c9' ? 'Comprehensive (C1–C9)' : 'Basic (B1–B11)'}`
              : 'Outside VSME Shield — Mandatory ESRS'}
        </text>
        <text x="28" y="176" fill="var(--text-secondary)" fontSize="11">
          {`Est. Admin Saved: ${shield.estimatedHoursSavedByCap} h/yr · CSRD: ${shield.mandatoryCsrdInScope ? 'Yes' : 'No'}`}
        </text>

        {/* Right Panel: VSME Disclosure & Readiness Bars */}
        <rect
          x="324"
          y="6"
          width="312"
          height="204"
          rx="14"
          fill="var(--bg-elevated)"
          stroke="var(--border-subtle)"
          strokeWidth="1.2"
        />
        <text
          x="340"
          y="30"
          fill="var(--text-primary)"
          fontSize="12.5"
          fontWeight="700"
        >
          VSME Disclosure Coverage &amp; Intensity
        </text>

        <text x="340" y="54" fill="var(--text-secondary)" fontSize="11">
          {`Basic (B1–B11): ${disclosures.basicCompletedCount}/${disclosures.basicRequiredCount} (${disclosures.basicCompletionPct}%)`}
        </text>
        <rect x="340" y="62" width="232" height="10" rx="5" fill="var(--border-subtle)" />
        <rect x="340" y="62" width={basicBarW} height="10" rx="5" fill="var(--accent-emerald)" />

        <text x="340" y="96" fill="var(--text-secondary)" fontSize="11">
          {`Comprehensive (C1–C9): ${disclosures.comprehensiveCompletedCount}/${disclosures.comprehensiveRequiredCount} (${disclosures.comprehensiveCompletionPct}%)`}
        </text>
        <rect x="340" y="104" width="232" height="10" rx="5" fill="var(--border-subtle)" />
        <rect x="340" y="104" width={compBarW} height="10" rx="5" fill="var(--accent-cobalt)" />

        <text x="340" y="138" fill="var(--text-secondary)" fontSize="11">
          {`Overall Readiness Score: ${result.readinessScore}/100`}
        </text>
        <rect x="340" y="146" width="232" height="10" rx="5" fill="var(--border-subtle)" />
        <rect x="340" y="146" width={scoreBarW} height="10" rx="5" fill={statusColor} />

        <text x="340" y="176" fill="var(--text-primary)" fontSize="11" fontWeight="600">
          {`Scope 1+2: ${disclosures.totalScope1And2Tco2e} tCO2e · Incl. S3: ${disclosures.totalGhgWithScope3Tco2e} tCO2e`}
        </text>
        <text x="340" y="194" fill="var(--text-secondary)" fontSize="10.5">
          {`Intensity: ${disclosures.ghgIntensityTco2ePerEurMillion} tCO2e / EUR 1M turnover`}
        </text>
        </svg>
      </div>
    </div>
  );
}
