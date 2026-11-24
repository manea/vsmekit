import {
  canonicalizeDossierPayload,
  computePayloadDigest,
} from './dossierDigest.ts';
import { evaluateDisclosureMatrix } from './disclosureMatrixEngine.ts';
import { auditBuyerRequestsCsv } from './portfolioCsvAuditor.ts';
import { evaluateValueChainShield } from './valueChainShieldEngine.ts';
import {
  LEGAL_DISCLAIMER_AR,
  LEGAL_DISCLAIMER_EN,
  VSME_CONTROLS,
  VSME_TOOL_VERSION,
} from './vsmeCatalog.ts';
import type {
  AssessmentInput,
  AssessmentResult,
  ControlEvaluationItem,
  FindingItem,
  ReadinessStatus,
  VsmeControlId,
} from './types.ts';

export async function assessVsmeReadiness(
  input: AssessmentInput,
): Promise<AssessmentResult> {
  const { shield, findings: shieldFindings } = evaluateValueChainShield(input);
  const { disclosures, findings: disclosureFindings } = evaluateDisclosureMatrix(
    input,
    shield,
  );

  const hasCsv =
    typeof input.buyerRequestsCsv === 'string' &&
    input.buyerRequestsCsv.trim().length > 0;
  const csvAudit = hasCsv
    ? auditBuyerRequestsCsv(input.buyerRequestsCsv!)
    : null;

  const findings: FindingItem[] = [...shieldFindings, ...disclosureFindings];

  if (csvAudit) {
    if (csvAudit.parseErrors.length > 0) {
      findings.push({
        code: 'VSME-CSV-PARSE-ERROR',
        severity: 'blocker',
        titleEn: 'Buyer Requests CSV Validation Error',
        titleAr: 'خطأ في بنية ملف طلبات المشترين والبنوك CSV',
        detailEn: csvAudit.parseErrors.join('; '),
        detailAr: csvAudit.parseErrors.join(' ؛ '),
        legalRef: 'VSMEKit CSV Validation',
      });
    } else if (csvAudit.excessDemandCount > 0) {
      findings.push({
        code: 'VSME-CSV-EXCESS-REQUESTS',
        severity: csvAudit.blockedCount > 0 ? 'blocker' : 'warning',
        titleEn: `${csvAudit.excessDemandCount} Buyer/Lender Request(s) Exceed VSME Boundaries (${csvAudit.capShieldTriggeredCount} Cap-Blocked)`,
        titleAr: `رصد ${csvAudit.excessDemandCount} طلبات تتجاوز معيار VSME (${csvAudit.capShieldTriggeredCount} محظورة بالدرع)`,
        detailEn:
          'Respond to over-reaching ESRS/custom questionnaires using standardized VSME Basic/Comprehensive disclosures and your 2027 Value-Chain Cap shield.',
        detailAr:
          'ردّ على الاستبيانات المخصّصة الزائدة بملف VSME الموحّد واحتج بدرع سلسلة القيمة لعام 2027.',
        legalRef: 'Delegated Regulation (EU) 2026/1560 Value-Chain Cap',
      });
    }
  }

  const implementedSet: ReadonlySet<VsmeControlId> = new Set(
    input.implementedControls,
  );
  const controls: ControlEvaluationItem[] = VSME_CONTROLS.map((ctrl) => ({
    id: ctrl.id,
    titleEn: ctrl.titleEn,
    titleAr: ctrl.titleAr,
    implemented: implementedSet.has(ctrl.id),
    weight: ctrl.weight,
  }));

  const controlPoints = controls.reduce(
    (acc, item) => (item.implemented ? acc + item.weight : acc),
    0,
  );

  let deductions = 0;
  if (shield.mandatoryCsrdInScope) deductions += 40;
  deductions += disclosures.missingBasicIds.length * 6;
  if (disclosures.comprehensiveRequiredCount > 0) {
    deductions += disclosures.missingComprehensiveIds.length * 4;
  }
  if (csvAudit && csvAudit.blockedCount > 0) {
    deductions += Math.min(20, csvAudit.blockedCount * 10);
  }

  const readinessScore = Math.max(
    0,
    Math.min(100, controlPoints - deductions),
  );

  const hasBlockers = findings.some((f) => f.severity === 'blocker');
  const hasWarnings = findings.some((f) => f.severity === 'warning');

  let status: ReadinessStatus;
  if (hasBlockers) {
    status = 'blocked';
  } else if (hasWarnings || readinessScore < 90) {
    status = 'conditional';
  } else {
    status = 'ready';
  }

  const canonicalDossierText = canonicalizeDossierPayload({
    organizationName: input.organizationName,
    reportingPeriodStart: input.reportingPeriodStart,
    entityKind: input.entityKind,
    targetTier: input.targetTier,
    shield,
    disclosures,
    csvAudit,
    status,
    readinessScore,
  });
  const dossierSha256 = await computePayloadDigest(canonicalDossierText);

  return {
    toolName: 'VSMEKit',
    version: VSME_TOOL_VERSION,
    legalDisclaimerEn: LEGAL_DISCLAIMER_EN,
    legalDisclaimerAr: LEGAL_DISCLAIMER_AR,
    organizationName: input.organizationName.trim(),
    reportingPeriodStart: input.reportingPeriodStart.trim(),
    entityKind: input.entityKind,
    targetTier: input.targetTier,
    shield,
    disclosures,
    csvAudit,
    status,
    readinessScore,
    controls,
    findings,
    canonicalDossierText,
    dossierSha256,
  };
}
