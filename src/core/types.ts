export type VsmeReportingTier = 'basic_b1_b11' | 'comprehensive_c1_c9';

export type ReportingEntityKind =
  | 'micro_undertaking'
  | 'sme_unlisted'
  | 'mid_market_up_to_1000'
  | 'large_above_1000_csrd';

export type BuyerRequestType =
  | 'none'
  | 'vsme_basic'
  | 'vsme_comprehensive'
  | 'full_esrs_or_custom_excess';

export type VsmeBasicDisclosureId =
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4'
  | 'B5'
  | 'B6'
  | 'B7'
  | 'B8'
  | 'B9'
  | 'B10'
  | 'B11';

export type VsmeComprehensiveDisclosureId =
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'C5'
  | 'C6'
  | 'C7'
  | 'C8'
  | 'C9';

export type VsmeControlId =
  | 'VSME-CTRL-01'
  | 'VSME-CTRL-02'
  | 'VSME-CTRL-03'
  | 'VSME-CTRL-04'
  | 'VSME-CTRL-05'
  | 'VSME-CTRL-06';

export type SeverityLevel = 'blocker' | 'warning' | 'info';
export type ReadinessStatus = 'ready' | 'conditional' | 'blocked';

export interface VsmeControlSpec {
  id: VsmeControlId;
  weight: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface VsmeDisclosureSpec<TId extends string> {
  id: TId;
  module: 'basic' | 'comprehensive';
  pillar: 'G' | 'E' | 'S' | 'Cross';
  titleEn: string;
  titleAr: string;
}

export interface AssessmentInput {
  organizationName: string;
  reportingPeriodStart: string;
  employeeHeadcount: number;
  annualNetTurnoverEur: number;
  entityKind: ReportingEntityKind;
  targetTier: VsmeReportingTier;
  incomingBuyerRequest: BuyerRequestType;
  seeksGreenFinancingOrScope3Buyer: boolean;
  completedBasicDisclosures: readonly VsmeBasicDisclosureId[];
  completedComprehensiveDisclosures: readonly VsmeComprehensiveDisclosureId[];
  energyMwh: number;
  scope1Tco2e: number;
  scope2Tco2e: number;
  scope3Tco2e: number;
  antiCorruptionConvictionsCount: number;
  buyerRequestsCsv?: string;
  implementedControls: readonly VsmeControlId[];
  notes?: string;
}

export interface FindingItem {
  code: string;
  severity: SeverityLevel;
  titleEn: string;
  titleAr: string;
  detailEn: string;
  detailAr: string;
  legalRef: string;
}

export interface ValueChainShieldResult {
  mandatoryCsrdInScope: boolean;
  valueChainCapActive: boolean;
  eligibleForValueChainShield: boolean;
  shieldProtectsAgainstExcessRequest: boolean;
  buyerExcessDemandDetected: boolean;
  recommendedTier: VsmeReportingTier;
  estimatedHoursSavedByCap: number;
}

export interface DisclosureMatrixResult {
  basicCompletedCount: number;
  basicRequiredCount: number;
  missingBasicIds: VsmeBasicDisclosureId[];
  comprehensiveCompletedCount: number;
  comprehensiveRequiredCount: number;
  missingComprehensiveIds: VsmeComprehensiveDisclosureId[];
  basicCompletionPct: number;
  comprehensiveCompletionPct: number;
  totalScope1And2Tco2e: number;
  totalGhgWithScope3Tco2e: number;
  ghgIntensityTco2ePerEurMillion: number;
}

export interface ControlEvaluationItem {
  id: VsmeControlId;
  titleEn: string;
  titleAr: string;
  implemented: boolean;
  weight: number;
}

export interface BuyerRequestCsvRowAudit {
  rowNumber: number;
  requestId: string;
  buyerName: string;
  buyerCsrdCovered: boolean;
  requestedTier: BuyerRequestType;
  smeEmployees: number;
  reportingPeriodStart: string;
  capProtected: boolean;
  excessBlocked: boolean;
  status: ReadinessStatus;
  issues: string[];
}

export interface BuyerRequestsCsvAuditSummary {
  totalRequests: number;
  readyCount: number;
  conditionalCount: number;
  blockedCount: number;
  capShieldTriggeredCount: number;
  excessDemandCount: number;
  rows: BuyerRequestCsvRowAudit[];
  parseErrors: string[];
}

export interface AssessmentResult {
  toolName: 'VSMEKit';
  version: string;
  legalDisclaimerEn: string;
  legalDisclaimerAr: string;
  organizationName: string;
  reportingPeriodStart: string;
  entityKind: ReportingEntityKind;
  targetTier: VsmeReportingTier;
  shield: ValueChainShieldResult;
  disclosures: DisclosureMatrixResult;
  csvAudit: BuyerRequestsCsvAuditSummary | null;
  status: ReadinessStatus;
  readinessScore: number;
  controls: ControlEvaluationItem[];
  findings: FindingItem[];
  canonicalDossierText: string;
  dossierSha256: string;
}

export interface VsmePreset {
  id: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  input: AssessmentInput;
}
