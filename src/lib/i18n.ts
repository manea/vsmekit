export type Locale = 'en' | 'ar';
export type ThemeMode = 'esg-parchment' | 'carbon-slate';

export interface Translations {
  brandTagline: string;
  independentNoticeBadge: string;
  modeServer: string;
  modeLocal: string;
  switchLangLabel: string;
  themeLightLabel: string;
  themeDarkLabel: string;
  presetHeading: string;
  tabScopeShield: string;
  tabDisclosuresGhg: string;
  tabBuyerCsv: string;
  tabVault: string;
  organizationName: string;
  reportingPeriodStart: string;
  employeeHeadcount: string;
  annualNetTurnoverEur: string;
  entityKind: string;
  targetTier: string;
  incomingBuyerRequest: string;
  seeksGreenFinance: string;
  notesLabel: string;
  entityMicro: string;
  entitySme: string;
  entityMidMarket: string;
  entityLargeCsrd: string;
  tierBasic: string;
  tierComprehensive: string;
  reqNone: string;
  reqBasic: string;
  reqComprehensive: string;
  reqExcess: string;
  saveDraft: string;
  createDossier: string;
  sealDossier: string;
  duplicateDraft: string;
  saveProfile: string;
  deleteDossier: string;
  downloadMarkdown: string;
  downloadCsvBom: string;
  printPdf: string;
  openPublicReport: string;
  backToWorkspace: string;
  shieldCardTitle: string;
  shieldEligible: string;
  shieldMandatoryCsrd: string;
  shieldCapActive: string;
  shieldProtected: string;
  shieldHoursSaved: string;
  yes: string;
  no: string;
  statusReady: string;
  statusConditional: string;
  statusBlocked: string;
  readinessScore: string;
  basicDisclosuresTitle: string;
  comprehensiveDisclosuresTitle: string;
  selectAllBasic: string;
  selectAllComprehensive: string;
  metricsHeading: string;
  energyMwh: string;
  scope1Tco2e: string;
  scope2Tco2e: string;
  scope3Tco2e: string;
  antiCorruptionConvictions: string;
  ghgIntensity: string;
  totalScope12: string;
  totalWithScope3: string;
  controlsHeading: string;
  findingsHeading: string;
  csvSectionTitle: string;
  csvDropHint: string;
  csvLoadPresetSample: string;
  csvClear: string;
  csvTotal: string;
  csvReady: string;
  csvConditional: string;
  csvBlocked: string;
  csvCapTriggered: string;
  vaultTitle: string;
  profilesTitle: string;
  noDossiersYet: string;
  noProfilesYet: string;
  dossierCodeLabel: string;
  lockedBadge: string;
  draftBadge: string;
  sha256Label: string;
  publicViewsLabel: string;
  legalFooterTitle: string;
}

const EN: Translations = {
  brandTagline: 'EU VSME ((EU) 2026/1560) & 2027 Value-Chain Cap Readiness Studio',
  independentNoticeBadge: 'Independent Readiness Tool — Not Official EU / EFRAG Endorsement',
  modeServer: 'SQLite WAL Server',
  modeLocal: '$0 Local Browser Vault',
  switchLangLabel: 'العربية (RTL)',
  themeLightLabel: 'Limestone Parchment',
  themeDarkLabel: 'Carbon Slate',
  presetHeading: 'Quick Scenarios (3 Regulatory Archetypes)',
  tabScopeShield: '1. Scope & 2027 Cap Shield',
  tabDisclosuresGhg: '2. B1–C9 & Carbon Metrics',
  tabBuyerCsv: '3. Buyer Request CSV',
  tabVault: '4. Dossier Vault & Brief',
  organizationName: 'Organization Legal Name',
  reportingPeriodStart: 'Reporting Period Start',
  employeeHeadcount: 'Average Employees (FTE)',
  annualNetTurnoverEur: 'Annual Net Turnover (EUR)',
  entityKind: 'Undertaking Classification (Omnibus I)',
  targetTier: 'Target VSME Reporting Tier',
  incomingBuyerRequest: 'Incoming Buyer / Bank Request',
  seeksGreenFinance: 'Targeting Green Bank Loans / Scope 3 Buyers (Recommends C1–C9)',
  notesLabel: 'Undertaking / Audit Notes',
  entityMicro: 'Micro Undertaking (<10 employees)',
  entitySme: 'Unlisted SME (10–249 employees)',
  entityMidMarket: 'Small Mid-Cap (<= 1,000 employees)',
  entityLargeCsrd: 'Large Undertaking (>1,000 employees & >EUR 450M)',
  tierBasic: 'Basic Module (B1–B11 Baseline)',
  tierComprehensive: 'Comprehensive Module (Basic + C1–C9)',
  reqNone: 'Voluntary Self-Prep (No External Request)',
  reqBasic: 'VSME Basic (B1–B11) Requested',
  reqComprehensive: 'VSME Comprehensive (B1–B11 + C1–C9) Requested',
  reqExcess: 'Excess Full ESRS / Custom Spreadsheet Survey',
  saveDraft: 'Update Active Draft',
  createDossier: 'Save New Dossier (VSME-YYYY)',
  sealDossier: 'Finalize & Seal (SHA-256)',
  duplicateDraft: 'Duplicate Editable Draft',
  saveProfile: 'Save Profile Preset',
  deleteDossier: 'Delete Draft',
  downloadMarkdown: 'Download Brief (.md)',
  downloadCsvBom: 'Export Safe CSV (BOM)',
  printPdf: 'Print A4 Packet',
  openPublicReport: 'Open Public Share View',
  backToWorkspace: 'Back to VSMEKit Workspace',
  shieldCardTitle: 'EU Value-Chain Cap (2027-01-01) & Omnibus I Thresholds',
  shieldEligible: 'Eligible for <=1,000-Employee Shield',
  shieldMandatoryCsrd: 'Mandatory CSRD Scope (>1k & >EUR 450M)',
  shieldCapActive: '2027 Value-Chain Cap Active',
  shieldProtected: 'Shield Protects Against Excess Request',
  shieldHoursSaved: 'Estimated Admin Hours Saved / Yr',
  yes: 'Yes',
  no: 'No',
  statusReady: 'READY',
  statusConditional: 'CONDITIONAL',
  statusBlocked: 'BLOCKED',
  readinessScore: 'Readiness Score',
  basicDisclosuresTitle: 'Basic Module Disclosures (B1–B11)',
  comprehensiveDisclosuresTitle: 'Comprehensive Module Disclosures (C1–C9)',
  selectAllBasic: 'Select All B1–B11',
  selectAllComprehensive: 'Select All C1–C9',
  metricsHeading: 'Energy, GHG Emissions (Scope 1/2/3) & B11 Governance',
  energyMwh: 'Total Energy Consumption (MWh)',
  scope1Tco2e: 'Scope 1 Direct GHG (tCO2e)',
  scope2Tco2e: 'Scope 2 Energy Indirect GHG (tCO2e)',
  scope3Tco2e: 'Scope 3 Value-Chain GHG (tCO2e)',
  antiCorruptionConvictions: 'B11 Corruption/Bribery Convictions Count',
  ghgIntensity: 'GHG Intensity (tCO2e / EUR 1M)',
  totalScope12: 'Scope 1 + 2 Total (tCO2e)',
  totalWithScope3: 'Total Incl. Scope 3 (tCO2e)',
  controlsHeading: 'Six Governance & Verification Controls',
  findingsHeading: 'Statutory Findings & Action Items',
  csvSectionTitle: 'Buyer & Lender Sustainability Request CSV Triage (CWE-1236 Safe)',
  csvDropHint: 'Drop a buyer/lender request CSV file here or paste CSV lines below to detect 2027 cap over-reach.',
  csvLoadPresetSample: 'Load Over-Reach Sample CSV',
  csvClear: 'Clear CSV',
  csvTotal: 'Requests',
  csvReady: 'Ready',
  csvConditional: 'Conditional',
  csvBlocked: 'Blocked (Excess)',
  csvCapTriggered: 'Cap Shield Invoked',
  vaultTitle: 'Saved VSME Dossiers',
  profilesTitle: 'Saved Undertaking Profiles',
  noDossiersYet: 'No saved dossiers yet. Click "Save New Dossier" to persist your first VSME-YYYY assessment.',
  noProfilesYet: 'No saved undertaking profiles yet.',
  dossierCodeLabel: 'Dossier',
  lockedBadge: 'SEALED (SHA-256)',
  draftBadge: 'EDITABLE DRAFT',
  sha256Label: 'Canonical SHA-256 Digest',
  publicViewsLabel: 'Public Report Views',
  legalFooterTitle: 'Independence & Non-Assurance Notice',
};

const AR: Translations = {
  brandTagline: 'منصة جاهزية معيار الاستدامة الطوعي VSME (2026/1560) ودرع سلسلة القيمة 2027',
  independentNoticeBadge: 'أداة فحص تقنية مستقلة — غير تابعة للمفوضية الأوروبية أو EFRAG',
  modeServer: 'خادم SQLite WAL',
  modeLocal: 'خزنة المتصفح المحلية ($0)',
  switchLangLabel: 'English (LTR)',
  themeLightLabel: 'الحجر الجيري الدافئ',
  themeDarkLabel: 'الكربون الداكن',
  presetHeading: 'سيناريوهات جاهزة (3 أنماط تنظيمية أوروبية)',
  tabScopeShield: '1. النطاق ودرع 2027',
  tabDisclosuresGhg: '2. مصفوفة B1–C9 والكربون',
  tabBuyerCsv: '3. تدقيق طلبات المشترين CSV',
  tabVault: '4. الخزنة والتقرير والختم',
  organizationName: 'الاسم القانوني للمنشأة',
  reportingPeriodStart: 'بداية الفترة المالية',
  employeeHeadcount: 'متوسط عدد الموظفين (FTE)',
  annualNetTurnoverEur: 'صافي المبيعات السنوية (يورو)',
  entityKind: 'تصنيف المنشأة (Omnibus I)',
  targetTier: 'حزمة VSME المستهدفة',
  incomingBuyerRequest: 'طلب المشتري أو البنك الوارد',
  seeksGreenFinance: 'استهداف تمويل أخضر أو مشترين لنطاق Scope 3 (يوصى بـ C1–C9)',
  notesLabel: 'ملاحظات المنشأة والتدقيق',
  entityMicro: 'منشأة متناهية الصغر (أقل من 10 موظفين)',
  entitySme: 'شركة صغيرة أو متوسطة غير مدرجة (10–249 موظفاً)',
  entityMidMarket: 'شركة متوسطة الحجم (حتى 1,000 موظف)',
  entityLargeCsrd: 'شركة كبرى خاضعة لـ CSRD (أكثر من 1,000 موظف و€450M)',
  tierBasic: 'الوحدة الأساسية (B1–B11)',
  tierComprehensive: 'الوحدة الشاملة (الأساسية + C1–C9)',
  reqNone: 'إعداد طوعي ذاتي (دون طلب خارجي)',
  reqBasic: 'طلب معيار VSME الأساسي (B1–B11)',
  reqComprehensive: 'طلب معيار VSME الشامل (B1–B11 + C1–C9)',
  reqExcess: 'استبيان مخصّص أو ESRS كامل زائد عن السقف',
  saveDraft: 'تحديث المسودة النشطة',
  createDossier: 'حفظ ملف جديد (VSME-YYYY)',
  sealDossier: 'الختم النهائي (SHA-256)',
  duplicateDraft: 'نسخ مسودة قابلة للتعديل',
  saveProfile: 'حفظ ملف المنشأة',
  deleteDossier: 'حذف المسودة',
  downloadMarkdown: 'تنزيل التقرير (.md)',
  downloadCsvBom: 'تصدير CSV آمن (BOM)',
  printPdf: 'طباعة حزمة A4 PDF',
  openPublicReport: 'فتح رابط المشاركة العام',
  backToWorkspace: 'العودة إلى لوحة العمل',
  shieldCardTitle: 'درع سلسلة القيمة (2027-01-01) وحدود Omnibus I',
  shieldEligible: 'أهلية الدرع (حتى 1,000 موظف)',
  shieldMandatoryCsrd: 'خضوع CSRD إلزامي (فوق 1k و€450M)',
  shieldCapActive: 'سقف 2027 القانوني مُفعّل',
  shieldProtected: 'الحماية ضد الطلبات الزائدة عن VSME',
  shieldHoursSaved: 'تقدير ساعات العمل المحمية سنوياً',
  yes: 'نعم',
  no: 'لا',
  statusReady: 'جاهز',
  statusConditional: 'مشروط',
  statusBlocked: 'محجوب',
  readinessScore: 'درجة الجاهزية',
  basicDisclosuresTitle: 'إفصاحات الوحدة الأساسية (B1–B11)',
  comprehensiveDisclosuresTitle: 'إفصاحات الوحدة الشاملة (C1–C9)',
  selectAllBasic: 'تحديد كافة B1–B11',
  selectAllComprehensive: 'تحديد كافة C1–C9',
  metricsHeading: 'الطاقة وانبعاثات الدفيئة (Scope 1/2/3) ومؤشر النزاهة B11',
  energyMwh: 'إجمالي استهلاك الطاقة (MWh)',
  scope1Tco2e: 'النطاق 1 المباشر (tCO2e)',
  scope2Tco2e: 'النطاق 2 غير المباشر للطاقة (tCO2e)',
  scope3Tco2e: 'النطاق 3 لسلسلة القيمة (tCO2e)',
  antiCorruptionConvictions: 'عدد إدانات/غرامات الفساد B11',
  ghgIntensity: 'كثافة الانبعاثات (tCO2e / مليون يورو)',
  totalScope12: 'إجمالي النطاقين 1 و2 (tCO2e)',
  totalWithScope3: 'الإجمالي شاملة النطاق 3 (tCO2e)',
  controlsHeading: 'الضوابط الحوكمية الستة',
  findingsHeading: 'النتائج القانونية والتوصيات التنفيذية',
  csvSectionTitle: 'تدقيق دفعات طلبات المشترين والبنوك CSV (محمي من CWE-1236)',
  csvDropHint: 'اسحب ملف CSV لطلبات العملاء هنا أو الصقه أدناه لرصد الاستبيانات المتجاوزة لسقف 2027.',
  csvLoadPresetSample: 'تحميل عينة تجاوزات CSV',
  csvClear: 'مسح النص',
  csvTotal: 'الطلبات',
  csvReady: 'جاهز',
  csvConditional: 'مشروط',
  csvBlocked: 'محجوب (متجاوز)',
  csvCapTriggered: 'تفعيل درع 2027',
  vaultTitle: 'خزنة ملفات VSME المحفوظة',
  profilesTitle: 'ملفات المنشآت المحفوظة',
  noDossiersYet: 'لا توجد ملفات محفوظة بعد. اضغط «حفظ ملف جديد» لإنشاء أول ملف برقم VSME-YYYY-0001.',
  noProfilesYet: 'لا توجد ملفات منشآت محفوظة بعد.',
  dossierCodeLabel: 'رقم الملف',
  lockedBadge: 'مختوم (SHA-256)',
  draftBadge: 'مسودة قابلة للتعديل',
  sha256Label: 'بصمة SHA-256 القانونية',
  publicViewsLabel: 'عدد المشاهدات العامة',
  legalFooterTitle: 'تنبيه الاستقلالية وعدم الاعتماد الرسمي',
};

export function getTranslations(locale: Locale): Translations {
  return locale === 'ar' ? AR : EN;
}
