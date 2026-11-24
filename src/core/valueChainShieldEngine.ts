import {
  CSRD_EMPLOYEE_THRESHOLD,
  CSRD_NET_TURNOVER_THRESHOLD_EUR,
  VALUE_CHAIN_CAP_EFFECTIVE_DATE,
} from './vsmeCatalog.ts';
import type {
  AssessmentInput,
  FindingItem,
  ValueChainShieldResult,
  VsmeReportingTier,
} from './types.ts';

export function evaluateValueChainShield(input: AssessmentInput): {
  shield: ValueChainShieldResult;
  findings: FindingItem[];
} {
  const periodStart = input.reportingPeriodStart.trim();
  const valueChainCapActive = periodStart >= VALUE_CHAIN_CAP_EFFECTIVE_DATE;

  // Under Omnibus I Directive (EU) 2026/470, mandatory CSRD applies only where entity exceeds BOTH >1,000 employees AND >EUR 450M turnover
  const mandatoryCsrdInScope =
    input.entityKind === 'large_above_1000_csrd' ||
    (input.employeeHeadcount > CSRD_EMPLOYEE_THRESHOLD &&
      input.annualNetTurnoverEur > CSRD_NET_TURNOVER_THRESHOLD_EUR);

  const eligibleForValueChainShield =
    !mandatoryCsrdInScope && input.employeeHeadcount <= CSRD_EMPLOYEE_THRESHOLD;

  const buyerExcessDemandDetected =
    input.incomingBuyerRequest === 'full_esrs_or_custom_excess';

  const shieldProtectsAgainstExcessRequest =
    eligibleForValueChainShield && valueChainCapActive && buyerExcessDemandDetected;

  const recommendedTier: VsmeReportingTier =
    input.seeksGreenFinancingOrScope3Buyer ||
    input.targetTier === 'comprehensive_c1_c9' ||
    input.incomingBuyerRequest === 'vsme_comprehensive'
      ? 'comprehensive_c1_c9'
      : 'basic_b1_b11';

  const estimatedHoursSavedByCap = shieldProtectsAgainstExcessRequest ? 120 : 0;

  const findings: FindingItem[] = [];

  if (mandatoryCsrdInScope) {
    findings.push({
      code: 'VSME-MANDATORY-CSRD-SCOPE',
      severity: 'blocker',
      titleEn: 'Entity Exceeds >1,000 Employees & EUR 450M CSRD Threshold (Outside Voluntary VSME Scope)',
      titleAr: 'تجاوز عتبتي 1,000 موظف و450 مليون يورو — خضوع إلزامي لـ CSRD وليس VSME',
      detailEn:
        'Companies exceeding both 1,000 employees and EUR 450M net turnover remain inside mandatory CSRD/ESRS reporting and cannot rely on VSME or the 2027 value-chain cap.',
      detailAr:
        'تخضع المنشآت التي تتجاوز 1,000 موظف و450 مليون يورو للتقارير الإلزامية الكاملة (ESRS) ولا يغطيها سقف المعيار الطوعي.',
      legalRef: 'Omnibus I Directive (EU) 2026/470 & Delegated Reg. (EU) 2026/1560',
    });
  } else if (buyerExcessDemandDetected && eligibleForValueChainShield) {
    if (valueChainCapActive) {
      findings.push({
        code: 'VSME-SHIELD-CAP-PROTECTED',
        severity: 'info',
        titleEn: '2027 Value-Chain Cap Shield Protects Against Full ESRS / Custom Buyer Over-Reach',
        titleAr: 'درع سلسلة القيمة (2027) يحمي المنشأة من الطلبات الزائدة عن VSME',
        detailEn: `With ${input.employeeHeadcount} employees (<= 1,000) for periods >= 2027-01-01, CSRD-covered buyers and lenders are barred from forcing disclosures beyond VSME; reply with standardized ${recommendedTier === 'comprehensive_c1_c9' ? 'Basic + Comprehensive (B1–C9)' : 'Basic (B1–B11)'} disclosures.`,
        detailAr: `بعدد ${input.employeeHeadcount} موظف (<= 1,000) اعتباراً من 2027-01-01، يحظر التوجيه على المشترين والبنوك فرض متطلبات تفوق معيار VSME؛ اكتفِ بإرسال حزمة VSME القياسية.`,
        legalRef: 'Delegated Regulation (EU) 2026/1560 Value-Chain Cap',
      });
    } else {
      findings.push({
        code: 'VSME-PRE-2027-BUYER-PRESSURE',
        severity: 'warning',
        titleEn: 'Excess ESRS / Custom Buyer Questionnaire Prior to 2027-01-01 Cap Cutoff',
        titleAr: 'طلب عميل/بنك يتجاوز VSME قبل دخول درع 2027-01-01 حيز التنفيذ',
        detailEn:
          'Prior to financial years starting 2027-01-01, align stakeholders on VSME Basic + Comprehensive packets proactively ahead of statutory value-chain cap enforcement.',
        detailAr:
          'قبل السنوات المالية التي تبدأ في 2027-01-01، استخدم حزمة VSME لتقليص التشتت التفاوضي تمهيداً لنفاذ السقف القانوني.',
        legalRef: 'Delegated Regulation (EU) 2026/1560 (2027-01-01 Application)',
      });
    }
  }

  if (
    !mandatoryCsrdInScope &&
    input.seeksGreenFinancingOrScope3Buyer &&
    input.targetTier === 'basic_b1_b11'
  ) {
    findings.push({
      code: 'VSME-UPGRADE-COMPREHENSIVE-RECOMMENDED',
      severity: 'warning',
      titleEn: 'Green Finance or Scope 3 Buyer Declared While Targeting Basic Module Only',
      titleAr: 'هدف تمويل أخضر أو عميل Scope 3 يتطلب إضافة الوحدة الشاملة C1–C9',
      detailEn:
        'While B1–B11 forms the minimum core, EU banks seeking green loan data or large buyers calculating Scope 3 typically require the optional Comprehensive Module (C1–C9).',
      detailAr:
        'تتطلب بنوك التمويل الأخضر وحسابات Scope 3 في سلاسل التوريد تفعيل الوحدة الشاملة (C1–C9) فوق الوحدة الأساسية.',
      legalRef: 'EFRAG VSME / Delegated Reg. (EU) 2026/1560 Basic + Comprehensive',
    });
  }

  return {
    shield: {
      mandatoryCsrdInScope,
      valueChainCapActive,
      eligibleForValueChainShield,
      shieldProtectsAgainstExcessRequest,
      buyerExcessDemandDetected,
      recommendedTier,
      estimatedHoursSavedByCap,
    },
    findings,
  };
}
