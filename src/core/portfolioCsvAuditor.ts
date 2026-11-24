import {
  CSRD_EMPLOYEE_THRESHOLD,
  VALUE_CHAIN_CAP_EFFECTIVE_DATE,
} from './vsmeCatalog.ts';
import type {
  BuyerRequestCsvRowAudit,
  BuyerRequestType,
  BuyerRequestsCsvAuditSummary,
  ReadinessStatus,
} from './types.ts';

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  if (tabCount > commaCount && tabCount >= semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

function parseBool(raw: string | undefined): boolean {
  const val = (raw ?? '').trim().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes' || val === 'y';
}

function parseNumber(raw: string | undefined, fallback: number): number {
  const n = Number((raw ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function normalizeRequestTier(raw: string | undefined): BuyerRequestType {
  const val = (raw ?? '').trim().toLowerCase();
  if (val === 'vsme_basic' || val === 'basic') return 'vsme_basic';
  if (val === 'vsme_comprehensive' || val === 'comprehensive') {
    return 'vsme_comprehensive';
  }
  if (
    val === 'full_esrs_or_custom_excess' ||
    val === 'full_esrs' ||
    val === 'custom_excess'
  ) {
    return 'full_esrs_or_custom_excess';
  }
  return 'none';
}

/**
 * Neutralizes CWE-1236 spreadsheet formula injection prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`)
 * and applies RFC 4180 quoting.
 */
export function sanitizeCsvCell(value: string | number | boolean): string {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function auditBuyerRequestsCsv(csvText: string): BuyerRequestsCsvAuditSummary {
  const cleaned = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) {
    return {
      totalRequests: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      capShieldTriggeredCount: 0,
      excessDemandCount: 0,
      rows: [],
      parseErrors: ['Buyer requests CSV payload is empty.'],
    };
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRequests: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      capShieldTriggeredCount: 0,
      excessDemandCount: 0,
      rows: [],
      parseErrors: ['CSV must include a header row and at least one buyer/bank request row.'],
    };
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delimiter).map((h) => h.toLowerCase().trim());
  const idxOf = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxReqId = idxOf(['request_id', 'id', 'req_id']);
  const idxBuyer = idxOf(['buyer_or_lender_name', 'buyer_name', 'client_name', 'buyer']);
  const idxCsrd = idxOf(['buyer_csrd_covered', 'csrd_covered', 'csrd']);
  const idxTier = idxOf(['requested_tier', 'tier', 'request_type']);
  const idxEmp = idxOf(['sme_employees', 'employees_in_sme', 'headcount', 'employees']);
  const idxDate = idxOf(['reporting_period_start', 'period_start', 'date']);
  const idxExcess = idxOf(['includes_excess_esrs_fields', 'excess_fields', 'excess']);

  if (idxReqId === -1 && idxBuyer === -1) {
    return {
      totalRequests: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      capShieldTriggeredCount: 0,
      excessDemandCount: 0,
      rows: [],
      parseErrors: ['Missing required request_id or buyer_or_lender_name column in CSV header.'],
    };
  }

  const rows: BuyerRequestCsvRowAudit[] = [];
  const parseErrors: string[] = [];
  let readyCount = 0;
  let conditionalCount = 0;
  let blockedCount = 0;
  let capShieldTriggeredCount = 0;
  let excessDemandCount = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const rowNumber = i + 1;
    const cols = splitCsvLine(lines[i]!, delimiter);
    const requestId = idxReqId !== -1 ? cols[idxReqId] || `REQ-${rowNumber}` : `REQ-${rowNumber}`;
    const buyerName = idxBuyer !== -1 ? cols[idxBuyer] || requestId : `Buyer Row ${rowNumber}`;
    const buyerCsrdCovered = idxCsrd !== -1 ? parseBool(cols[idxCsrd]) : true;
    const requestedTier =
      idxTier !== -1 ? normalizeRequestTier(cols[idxTier]) : 'vsme_basic';
    const smeEmployees = idxEmp !== -1 ? parseNumber(cols[idxEmp], 250) : 250;
    const reportingPeriodStart =
      idxDate !== -1 && cols[idxDate] ? cols[idxDate]! : VALUE_CHAIN_CAP_EFFECTIVE_DATE;
    const explicitExcess = idxExcess !== -1 ? parseBool(cols[idxExcess]) : false;

    const isExcess = explicitExcess || requestedTier === 'full_esrs_or_custom_excess';
    const capActive = reportingPeriodStart >= VALUE_CHAIN_CAP_EFFECTIVE_DATE;
    const capProtected =
      smeEmployees <= CSRD_EMPLOYEE_THRESHOLD && buyerCsrdCovered && capActive;

    const issues: string[] = [];
    let excessBlocked = false;

    if (smeEmployees > CSRD_EMPLOYEE_THRESHOLD) {
      issues.push('Entity >1,000 employees: check CSRD EUR 450M turnover scope');
    }

    if (isExcess) {
      excessDemandCount += 1;
      if (capProtected) {
        capShieldTriggeredCount += 1;
        excessBlocked = true;
        issues.push('Exceeds 2027 Value-Chain Cap (decline custom/ESRS excess; send VSME)');
      } else {
        issues.push('Custom/ESRS excess requested pre-2027 cap or outside shield');
      }
    }

    let status: ReadinessStatus;
    if (excessBlocked) {
      status = 'blocked';
      blockedCount += 1;
    } else if (issues.length > 0) {
      status = 'conditional';
      conditionalCount += 1;
    } else {
      status = 'ready';
      readyCount += 1;
    }

    rows.push({
      rowNumber,
      requestId,
      buyerName,
      buyerCsrdCovered,
      requestedTier: isExcess ? 'full_esrs_or_custom_excess' : requestedTier,
      smeEmployees,
      reportingPeriodStart,
      capProtected,
      excessBlocked,
      status,
      issues,
    });
  }

  return {
    totalRequests: rows.length,
    readyCount,
    conditionalCount,
    blockedCount,
    capShieldTriggeredCount,
    excessDemandCount,
    rows,
    parseErrors,
  };
}

export function exportBuyerRequestsAuditCsv(summary: BuyerRequestsCsvAuditSummary): string {
  const header = [
    'row_number',
    'request_id',
    'buyer_or_lender_name',
    'buyer_csrd_covered',
    'requested_tier',
    'sme_employees',
    'reporting_period_start',
    'cap_protected',
    'excess_blocked',
    'status',
    'audit_issues',
  ].join(',');

  const lines = summary.rows.map((row) =>
    [
      sanitizeCsvCell(row.rowNumber),
      sanitizeCsvCell(row.requestId),
      sanitizeCsvCell(row.buyerName),
      sanitizeCsvCell(row.buyerCsrdCovered),
      sanitizeCsvCell(row.requestedTier),
      sanitizeCsvCell(row.smeEmployees),
      sanitizeCsvCell(row.reportingPeriodStart),
      sanitizeCsvCell(row.capProtected),
      sanitizeCsvCell(row.excessBlocked),
      sanitizeCsvCell(row.status),
      sanitizeCsvCell(row.issues.join(' | ')),
    ].join(','),
  );

  return `\uFEFF${[header, ...lines].join('\n')}\n`;
}
