import type {
  VsmeBasicDisclosureId,
  VsmeComprehensiveDisclosureId,
  VsmePreset,
} from './types.ts';

const ALL_BASIC: VsmeBasicDisclosureId[] = [
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'B10',
  'B11',
];

const ALL_COMPREHENSIVE: VsmeComprehensiveDisclosureId[] = [
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
];

const PRESET_3_BUYER_CSV = [
  'request_id,buyer_or_lender_name,buyer_csrd_covered,requested_tier,sme_employees,reporting_period_start,includes_excess_esrs_fields',
  'REQ-101,NordAuto OEM Procurement GmbH,true,full_esrs_or_custom_excess,320,2027-01-01,true',
  'REQ-102,EuroGreen Commercial Bank,true,vsme_comprehensive,320,2027-01-01,false',
  'REQ-103,"=HYPERLINK(""http://bad"")",true,full_esrs_or_custom_excess,180,2027-01-01,true',
].join('\n');

export const VSME_PRESETS: readonly VsmePreset[] = [
  {
    id: 'sme-green-finance-vsme-ready',
    labelEn: 'Unlisted EU SME (Ready — Basic B1–B11 + Comprehensive C1–C9 Verified)',
    labelAr: 'شركة صغيرة/متوسطة أوروبية (جاهزة — الوحدة الأساسية B1–B11 والشاملة C1–C9)',
    descriptionEn:
      '180-employee manufacturing SME for FY 2027 with complete B1–B11 & C1–C9 disclosures, audited MWh & Scope 1/2/3 metrics, ready for green bank loans & Scope 3 buyers.',
    descriptionAr:
      'منشأة بعدد 180 موظفاً للسنة المالية 2027 مستوفية لكامل حزمة B1–C9 لتمويل البنوك الخضراء وطلبات سلسلة التوريد.',
    input: {
      organizationName: 'AlpenPrecision Machining GmbH',
      reportingPeriodStart: '2027-01-01',
      employeeHeadcount: 180,
      annualNetTurnoverEur: 32_000_000,
      entityKind: 'sme_unlisted',
      targetTier: 'comprehensive_c1_c9',
      incomingBuyerRequest: 'vsme_comprehensive',
      seeksGreenFinancingOrScope3Buyer: true,
      completedBasicDisclosures: ALL_BASIC,
      completedComprehensiveDisclosures: ALL_COMPREHENSIVE,
      energyMwh: 1_450,
      scope1Tco2e: 210,
      scope2Tco2e: 175,
      scope3Tco2e: 1_920,
      antiCorruptionConvictionsCount: 0,
      implementedControls: [
        'VSME-CTRL-01',
        'VSME-CTRL-02',
        'VSME-CTRL-03',
        'VSME-CTRL-04',
        'VSME-CTRL-05',
        'VSME-CTRL-06',
      ],
    },
  },
  {
    id: 'pre-2027-micro-basic-prep',
    labelEn: 'Pre-2027 Micro Supplier (Conditional — Facing Pre-Cutoff Excess Survey)',
    labelAr: 'منشأة متناهية الصغر قبل 2027 (مشروطة — استبيان زائد قبل سريان الدرع)',
    descriptionEn:
      '8-employee micro B2B supplier in FY 2026 with full Basic Module (B1–B11) under pressure from a large buyer ahead of 2027-01-01 cap enforcement.',
    descriptionAr:
      'منشأة بـ 8 موظفين للسنة المالية 2026 أتمت الوحدة الأساسية وتواجه ضغط استبيان مخصّص قبل سريان درع 2027-01-01.',
    input: {
      organizationName: 'Atelier NordCraft S.r.l.',
      reportingPeriodStart: '2026-01-01',
      employeeHeadcount: 8,
      annualNetTurnoverEur: 1_200_000,
      entityKind: 'micro_undertaking',
      targetTier: 'basic_b1_b11',
      incomingBuyerRequest: 'full_esrs_or_custom_excess',
      seeksGreenFinancingOrScope3Buyer: false,
      completedBasicDisclosures: ALL_BASIC,
      completedComprehensiveDisclosures: [],
      energyMwh: 64,
      scope1Tco2e: 8.4,
      scope2Tco2e: 11.2,
      scope3Tco2e: 0,
      antiCorruptionConvictionsCount: 0,
      implementedControls: [
        'VSME-CTRL-01',
        'VSME-CTRL-02',
        'VSME-CTRL-03',
        'VSME-CTRL-04',
        'VSME-CTRL-06',
      ],
    },
  },
  {
    id: 'buyer-overreach-and-disclosure-gaps-blocked',
    labelEn: 'Supply-Chain Dispute & Disclosure Gaps (Blocked — Over-Reach CSV & Missing B/C)',
    labelAr: 'فجوات إفصاح وتجاوزات مشترين (محجوب — ملف CSV وطلبات ESRS زائدة)',
    descriptionEn:
      '2027 supplier above basic readiness missing B4–B11 & C3–C9 disclosures while bombarded by excess CSRD buyer requests flagged in CWE-1236 buyer CSV.',
    descriptionAr:
      'مورد في 2027 يعاني نقصاً في إفصاحات B4–B11 وC3–C9 مع هجوم استبيانات تتجاوز سقف 2027 في ملف CSV.',
    input: {
      organizationName: 'IberiaPack Components S.L.',
      reportingPeriodStart: '2027-01-01',
      employeeHeadcount: 320,
      annualNetTurnoverEur: 68_000_000,
      entityKind: 'mid_market_up_to_1000',
      targetTier: 'comprehensive_c1_c9',
      incomingBuyerRequest: 'full_esrs_or_custom_excess',
      seeksGreenFinancingOrScope3Buyer: true,
      completedBasicDisclosures: ['B1', 'B2', 'B3'],
      completedComprehensiveDisclosures: ['C1', 'C2'],
      energyMwh: 920,
      scope1Tco2e: 145,
      scope2Tco2e: 130,
      scope3Tco2e: 0,
      antiCorruptionConvictionsCount: 1,
      buyerRequestsCsv: PRESET_3_BUYER_CSV,
      implementedControls: ['VSME-CTRL-01'],
    },
  },
];
