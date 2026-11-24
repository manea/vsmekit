import type {
  VsmeBasicDisclosureId,
  VsmeComprehensiveDisclosureId,
  VsmeControlSpec,
  VsmeDisclosureSpec,
} from './types.ts';

export const VSME_TOOL_VERSION = '0.5.0';
export const VALUE_CHAIN_CAP_EFFECTIVE_DATE = '2027-01-01';
export const CSRD_EMPLOYEE_THRESHOLD = 1000;
export const CSRD_NET_TURNOVER_THRESHOLD_EUR = 450_000_000;

export const LEGAL_DISCLAIMER_EN =
  'Notice: VSMEKit is an independent technical readiness tool and is NOT affiliated with or endorsed by the European Commission, EFRAG, any assurance provider, or national supervisory authority. Outputs do not constitute legal advice or sustainability assurance.';

export const LEGAL_DISCLAIMER_AR =
  'تنبيه مهم: أداة VSMEKit أداة فحص وجاهزية تقنية مستقلة وليست تابعة أو معتمدة من المفوضية الأوروبية أو EFRAG أو أي مدقق أو جهة رقابية. ولا تُعد مخرجاتها استشارة قانونية أو شهادة تأكيد؛ يُرجى التحقق عبر مختصين معتمدين.';

export const VSME_BASIC_DISCLOSURES: readonly VsmeDisclosureSpec<VsmeBasicDisclosureId>[] = [
  { id: 'B1', module: 'basic', pillar: 'Cross', titleEn: 'Basis for Preparation (Tier & Boundaries)', titleAr: 'B1: أساس الإعداد ونطاق الوحدة' },
  { id: 'B2', module: 'basic', pillar: 'Cross', titleEn: 'Practices, Policies & Future Transition Initiatives', titleAr: 'B2: الممارسات والسياسات ومبادرات التحول' },
  { id: 'B3', module: 'basic', pillar: 'E', titleEn: 'Energy & GHG Emissions (Scope 1 & 2)', titleAr: 'B3: الطاقة وانبعاثات الدفيئة (النطاقان 1 و2)' },
  { id: 'B4', module: 'basic', pillar: 'E', titleEn: 'Pollution of Air, Water & Soil', titleAr: 'B4: ملوثات الهواء والماء والتربة' },
  { id: 'B5', module: 'basic', pillar: 'E', titleEn: 'Biodiversity & Environmentally Sensitive Sites', titleAr: 'B5: التنوع الحيوي والمواقع البيئية الحساسة' },
  { id: 'B6', module: 'basic', pillar: 'E', titleEn: 'Water Withdrawal & Consumption', titleAr: 'B6: سحب واستهلاك المياه' },
  { id: 'B7', module: 'basic', pillar: 'E', titleEn: 'Resource Use, Circular Economy & Waste', titleAr: 'B7: استخدام الموارد والاقتصاد الدائري والنفايات' },
  { id: 'B8', module: 'basic', pillar: 'S', titleEn: 'Workforce General Characteristics (Headcount & Contracts)', titleAr: 'B8: خصائص القوى العاملة ونوع العقود' },
  { id: 'B9', module: 'basic', pillar: 'S', titleEn: 'Workforce Health & Safety (Accidents & Fatalities)', titleAr: 'B9: الصحة والسلامة المهنية والحوادث' },
  { id: 'B10', module: 'basic', pillar: 'S', titleEn: 'Remuneration, Collective Bargaining & Training', titleAr: 'B10: الأجور والمفاوضة الجماعية والتدريب' },
  { id: 'B11', module: 'basic', pillar: 'G', titleEn: 'Convictions & Fines for Corruption and Bribery', titleAr: 'B11: الإدانات والغرامات المتعلقة بالفساد والرشوة' },
];

export const VSME_COMPREHENSIVE_DISCLOSURES: readonly VsmeDisclosureSpec<VsmeComprehensiveDisclosureId>[] = [
  { id: 'C1', module: 'comprehensive', pillar: 'Cross', titleEn: 'Strategy: Business Model & Sustainability Integration', titleAr: 'C1: استراتيجية العمل ودمج الاستدامة' },
  { id: 'C2', module: 'comprehensive', pillar: 'Cross', titleEn: 'Policies, Practices & Targets on Material Matters', titleAr: 'C2: سياسات وأهداف القضايا الجوهرية' },
  { id: 'C3', module: 'comprehensive', pillar: 'E', titleEn: 'GHG Emission Reduction Targets & Transition Plan', titleAr: 'C3: أهداف خفض الانبعاثات وخطة التحول' },
  { id: 'C4', module: 'comprehensive', pillar: 'E', titleEn: 'Climate Change Physical & Transition Risks', titleAr: 'C4: المخاطر المناخية المادية ومخاطر التحول' },
  { id: 'C5', module: 'comprehensive', pillar: 'E', titleEn: 'Scope 3 Value-Chain & Total GHG Accounting', titleAr: 'C5: انبعاثات سلسلة القيمة (النطاق 3) والإجمالي' },
  { id: 'C6', module: 'comprehensive', pillar: 'S', titleEn: 'Additional Workforce Metrics & Human Rights Policy', titleAr: 'C6: مؤشرات العمل الإضافية وحقوق الإنسان' },
  { id: 'C7', module: 'comprehensive', pillar: 'S', titleEn: 'Human Rights Incidents, Grievances & Severe Impacts', titleAr: 'C7: حوادث وشكاوى حقوق الإنسان الجسيمة' },
  { id: 'C8', module: 'comprehensive', pillar: 'S', titleEn: 'Consumers & End-Users Product Impact Disclosures', titleAr: 'C8: إفصاحات المستهلكين والمستخدمين النهائيين' },
  { id: 'C9', module: 'comprehensive', pillar: 'G', titleEn: 'Governance Body Diversity & Business Conduct Policies', titleAr: 'C9: تنوع مجلس الإدارة وسياسات سلوك الأعمال' },
];

export const VSME_CONTROLS: readonly VsmeControlSpec[] = [
  {
    id: 'VSME-CTRL-01',
    weight: 20,
    titleEn: 'CSRD Threshold & <=1,000-Employee Value-Chain Shield Verification',
    titleAr: 'التحقق من حدود CSRD وأهلية درع سلسلة القيمة (<= 1,000 موظف)',
    descriptionEn:
      'Document annual headcount (<= 1,000) and turnover relative to EUR 450M to formally invoke the Delegated Reg. (EU) 2026/1560 cap against excessive buyer questionnaires.',
    descriptionAr:
      'توثيق عدد الموظفين (<= 1,000) وصافي الإيرادات (< 450M يورو) للاحتجاج بالحد الأقصى القانوني أمام استبيانات المشترين الزائدة.',
  },
  {
    id: 'VSME-CTRL-02',
    weight: 20,
    titleEn: 'Basic Module Core Complete (B1–B11 Baseline Evidence)',
    titleAr: 'اكتمال حزمة الوحدة الأساسية (B1–B11) كمرجع أدنى',
    descriptionEn:
      'Compile verified evidence for all 11 Basic disclosures covering basis, practices, energy/GHG, water/waste, workforce safety/pay, and anti-corruption B11.',
    descriptionAr:
      'تجميع الأدلة الموثقة للإفصاحات الـ 11 الأساسية كقاعدة بيانات معيارية قبل الرد على أي عميل أو ممول.',
  },
  {
    id: 'VSME-CTRL-03',
    weight: 20,
    titleEn: 'Energy (MWh) & Scope 1–2 GHG Boundary Auditability (B3)',
    titleAr: 'قابلية تدقيق فواتير الطاقة وانبعاثات النطاقين 1 و2 (B3)',
    descriptionEn:
      'Tie fuel, electricity kWh/MWh invoices, and standard emission factors to reproducible Scope 1 & Scope 2 totals and revenue intensity ratios.',
    descriptionAr:
      'ربط فواتير الوقود والكهرباء بمعاملات الانبعاث لإخراج أرقام Scope 1 و2 وكثافة الانبعاثات بدقة قابلة للمراجعة.',
  },
  {
    id: 'VSME-CTRL-04',
    weight: 15,
    titleEn: 'Buyer & Bank Request Triage Protocol (Value-Chain Cap Response)',
    titleAr: 'بروتوكول فرز طلبات العملاء والبنوك والرد بالمعيار الموحد',
    descriptionEn:
      'Intercept non-standard ESG spreadsheets and respond with a standardized VSME packet plus a polite statutory Value-Chain Cap notice where requests exceed C1–C9.',
    descriptionAr:
      'استبدال جداول العملاء المتفرقة بملف VSME موحد وإشعار قانوني مهني عند تجاوز الطلبات للحد الأقصى لعام 2027.',
  },
  {
    id: 'VSME-CTRL-05',
    weight: 15,
    titleEn: 'Comprehensive Module Readiness for Green Finance & Scope 3 (C1–C9)',
    titleAr: 'جاهزية الوحدة الشاملة (C1–C9) للتمويل الأخضر وسلسلة التوريد',
    descriptionEn:
      'Maintain optional C1–C9 targets, climate risk notes, Scope 3 estimates, human-rights policies, and governance diversity metrics when pitching EU banks or Scope 3 buyers.',
    descriptionAr:
      'استكمال بنود C1–C9 عند التقدم لقروض التمويل الأخضر أو تلبية طلبات Scope 3 ضمن حدود المعيار الطوعي.',
  },
  {
    id: 'VSME-CTRL-06',
    weight: 10,
    titleEn: 'Annual Archive Retention & If-Applicable ("Omnibus Ready") Traceability',
    titleAr: 'الأرشفة السنوية وسجل البنود المنطبقة (If-Applicable Trail)',
    descriptionEn:
      'Preserve calculation workpapers and documented omissions ("not applicable") consistently alongside SHA-256 stamped dossiers.',
    descriptionAr:
      'حفظ أوراق العمل ومبررات عدم الانطباق مع أرشفة سنوية ببصمة SHA-256 المعيارية.',
  },
];
