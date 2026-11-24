import {
  VSME_BASIC_DISCLOSURES,
  VSME_COMPREHENSIVE_DISCLOSURES,
} from './vsmeCatalog.ts';
import type {
  AssessmentInput,
  DisclosureMatrixResult,
  FindingItem,
  ValueChainShieldResult,
  VsmeBasicDisclosureId,
  VsmeComprehensiveDisclosureId,
} from './types.ts';

export function evaluateDisclosureMatrix(
  input: AssessmentInput,
  shield: ValueChainShieldResult,
): { disclosures: DisclosureMatrixResult; findings: FindingItem[] } {
  const basicSet = new Set<VsmeBasicDisclosureId>(input.completedBasicDisclosures);
  const compSet = new Set<VsmeComprehensiveDisclosureId>(
    input.completedComprehensiveDisclosures,
  );

  const missingBasicIds = VSME_BASIC_DISCLOSURES.map((d) => d.id).filter(
    (id) => !basicSet.has(id),
  );
  const basicCompletedCount = VSME_BASIC_DISCLOSURES.length - missingBasicIds.length;
  const basicRequiredCount = VSME_BASIC_DISCLOSURES.length;

  const needsComprehensive =
    input.targetTier === 'comprehensive_c1_c9' ||
    input.seeksGreenFinancingOrScope3Buyer ||
    input.incomingBuyerRequest === 'vsme_comprehensive';

  const missingComprehensiveIds = VSME_COMPREHENSIVE_DISCLOSURES.map((d) => d.id).filter(
    (id) => !compSet.has(id),
  );
  const comprehensiveRequiredCount = needsComprehensive
    ? VSME_COMPREHENSIVE_DISCLOSURES.length
    : 0;
  const comprehensiveCompletedCount =
    VSME_COMPREHENSIVE_DISCLOSURES.length - missingComprehensiveIds.length;

  const basicCompletionPct = Math.round((basicCompletedCount / basicRequiredCount) * 100);
  const comprehensiveCompletionPct = Math.round(
    (comprehensiveCompletedCount / VSME_COMPREHENSIVE_DISCLOSURES.length) * 100,
  );

  const totalScope1And2Tco2e = Number(
    (Math.max(0, input.scope1Tco2e) + Math.max(0, input.scope2Tco2e)).toFixed(2),
  );
  const totalGhgWithScope3Tco2e = Number(
    (totalScope1And2Tco2e + Math.max(0, input.scope3Tco2e)).toFixed(2),
  );
  const turnoverMillions = input.annualNetTurnoverEur / 1_000_000;
  const ghgIntensityTco2ePerEurMillion =
    turnoverMillions > 0
      ? Number((totalScope1And2Tco2e / turnoverMillions).toFixed(3))
      : 0;

  const findings: FindingItem[] = [];

  if (missingBasicIds.length > 0) {
    findings.push({
      code: 'VSME-BASIC-GAPS',
      severity: shield.mandatoryCsrdInScope ? 'warning' : 'blocker',
      titleEn: `Missing ${missingBasicIds.length} Basic Module Disclosure(s): ${missingBasicIds.join(', ')}`,
      titleAr: `نقص ${missingBasicIds.length} بنود في الوحدة الأساسية: ${missingBasicIds.join(', ')}`,
      detailEn:
        'Applying either Basic or Comprehensive VSME requires completing the core B1–B11 baseline metrics first (or documenting "not applicable" boundaries in B1).',
      detailAr:
        'يتطلب اعتماد معيار VSME (أساسي أو شامل) استيفاء حزمة B1–B11 الأساسية أولاً كحد أدنى متكامل.',
      legalRef: 'EFRAG VSME / Reg. (EU) 2026/1560 Basic Module B1–B11',
    });
  }

  if (needsComprehensive && missingComprehensiveIds.length > 0) {
    findings.push({
      code: 'VSME-COMPREHENSIVE-GAPS',
      severity: shield.valueChainCapActive ? 'blocker' : 'warning',
      titleEn: `Missing ${missingComprehensiveIds.length} Comprehensive Disclosure(s): ${missingComprehensiveIds.join(', ')}`,
      titleAr: `نقص ${missingComprehensiveIds.length} بنود في الوحدة الشاملة: ${missingComprehensiveIds.join(', ')}`,
      detailEn:
        'Target profile requires Comprehensive Module metrics (C1–C9) to satisfy green-financing or Scope 3 value-chain expectations.',
      detailAr:
        'الوضع المستهدف (التمويل الأخضر أو طلب عميل شامل) يتطلب إغلاق فجوات الوحدة الشاملة C1–C9.',
      legalRef: 'EFRAG VSME / Reg. (EU) 2026/1560 Comprehensive Module C1–C9',
    });
  }

  if (input.energyMwh <= 0 || totalScope1And2Tco2e <= 0) {
    findings.push({
      code: 'VSME-B3-ENERGY-GHG-ZERO',
      severity: 'warning',
      titleEn: 'B3 Energy (MWh) or Scope 1–2 Emissions Reported as Zero',
      titleAr: 'بيانات الطاقة (MWh) أو انبعاثات النطاقين 1 و2 (B3) مسجلة صفراً',
      detailEn:
        'Disclosure B3 requires total energy consumption in MWh and location-based Scope 1 + Scope 2 GHG emissions in tCO2e.',
      detailAr:
        'يتطلب الإفصاح B3 توثيق إجمالي استهلاك الطاقة بـ MWh وانبعاثات النطاقين 1 و2 بـ tCO2e.',
      legalRef: 'VSME Disclosure B3 (Energy & GHG Emissions)',
    });
  }

  if (input.antiCorruptionConvictionsCount > 0) {
    findings.push({
      code: 'VSME-B11-CONVICTIONS-FLAG',
      severity: 'warning',
      titleEn: `B11 Anti-Corruption Disclosure: ${input.antiCorruptionConvictionsCount} Conviction(s) / Fine(s) Logged`,
      titleAr: `إفصاح مكافحة الفساد B11: رصد ${input.antiCorruptionConvictionsCount} مخالفة/غرامة مسجلة`,
      detailEn:
        'Ensure remediation governance narrative under B11/C9 documents corrective controls alongside statutory fine totals.',
      detailAr:
        'أرفق توصيف الإجراءات التصحيحية ضمن B11 وC9 عند وجود مخالفات أو غرامات مسجلة.',
      legalRef: 'VSME Disclosures B11 & C9',
    });
  }

  return {
    disclosures: {
      basicCompletedCount,
      basicRequiredCount,
      missingBasicIds,
      comprehensiveCompletedCount,
      comprehensiveRequiredCount,
      missingComprehensiveIds,
      basicCompletionPct,
      comprehensiveCompletionPct,
      totalScope1And2Tco2e,
      totalGhgWithScope3Tco2e,
      ghgIntensityTco2ePerEurMillion,
    },
    findings,
  };
}
