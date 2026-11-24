import type { AssessmentInput, AssessmentResult } from './types.ts';

function escMdCell(value: unknown): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatNumber(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
}

export function buildVsmeBriefMarkdown(
  input: AssessmentInput,
  result: AssessmentResult,
  dossierCode: string,
  sha256Digest: string,
  locale: 'en' | 'ar' = 'ar',
): string {
  const isAr = locale === 'ar';
  const digest = sha256Digest || result.dossierSha256;

  if (isAr) {
    const lines: string[] = [
      `# ملف جاهزية VSME ودرع سلسلة القيمة — \`${dossierCode}\``,
      '',
      `> **تنبيه الحوكمة وعدم الاعتماد الرسمي:** ${result.legalDisclaimerAr}`,
      '',
      '## 1. ملخص المنشأة وحالة الجاهزية',
      '',
      '| البند | القيمة |',
      '|---|---|',
      `| رمز الملف | \`${escMdCell(dossierCode)}\` |`,
      `| الأداة والإصدار | \`VSMEKit v${escMdCell(result.version)}\` |`,
      `| اسم المنشأة | ${escMdCell(input.organizationName)} |`,
      `| بداية الفترة المالية | \`${escMdCell(input.reportingPeriodStart)}\` |`,
      `| عدد الموظفين / صافي الإيرادات (يورو) | ${formatNumber(input.employeeHeadcount)} موظف / €${formatNumber(input.annualNetTurnoverEur)} |`,
      `| نوع المنشأة / الحزمة المستهدفة | \`${escMdCell(input.entityKind)}\` / \`${escMdCell(input.targetTier)}\` |`,
      `| طلب المشتري/البنك الوارد | \`${escMdCell(input.incomingBuyerRequest)}\` |`,
      `| حالة الجاهزية | **${result.status.toUpperCase()}** |`,
      `| درجة الجاهزية | **${result.readinessScore}/100** |`,
      `| بصمة SHA-256 القانونية | \`${escMdCell(digest)}\` |`,
      '',
      '## 2. تقييم درع سلسلة القيمة الأوروبي (حد 2027-01-01 وتعديل Omnibus I)',
      '',
      `- خضوع المنشأة لـ CSRD الإلزامي (>1,000 موظف و>€450M): **${result.shield.mandatoryCsrdInScope ? 'نعم (داخل النطاق الإلزامي)' : 'لا (خارج النطاق الإلزامي)'}**`,
      `- تفعيل سقف سلسلة القيمة القانوني (ابتداءً من 2027-01-01): **${result.shield.valueChainCapActive ? 'مُفعّل' : 'غير مُفعّل بعد'}**`,
      `- أهلية المنشأة لدرع حماية VSME (<= 1,000 موظف): **${result.shield.eligibleForValueChainShield ? 'مؤهلة' : 'غير مؤهلة'}**`,
      `- الحماية ضد الطلبات الزائدة عن المعيار الطوعي: **${result.shield.shieldProtectsAgainstExcessRequest ? 'نعم — محمي نظامياً' : 'لا'}**`,
      `- رصد طلب زائد عن حد VSME: **${result.shield.buyerExcessDemandDetected ? 'نعم' : 'لا'}**`,
      `- الحزمة الموصى بها: \`${result.shield.recommendedTier}\``,
      `- تقدير الساعات الإدارية المحمية سنوياً بفضل الدرع: **${formatNumber(result.shield.estimatedHoursSavedByCap)} ساعة**`,
      '',
      '## 3. مصفوفة إفصاحات VSME والبصمة الكربونية والطاقة',
      '',
      `- **الوحدة الأساسية (B1–B11):** ${result.disclosures.basicCompletedCount}/${result.disclosures.basicRequiredCount} (${result.disclosures.basicCompletionPct}%) — الناقص: ${result.disclosures.missingBasicIds.length > 0 ? result.disclosures.missingBasicIds.join(', ') : 'لا يوجد'}`,
      `- **الوحدة الشاملة (C1–C9):** ${result.disclosures.comprehensiveCompletedCount}/${result.disclosures.comprehensiveRequiredCount} (${result.disclosures.comprehensiveCompletionPct}%) — الناقص: ${result.disclosures.missingComprehensiveIds.length > 0 ? result.disclosures.missingComprehensiveIds.join(', ') : 'لا يوجد'}`,
      `- **استهلاك الطاقة:** ${formatNumber(input.energyMwh)} MWh`,
      `- **انبعاثات النطاقين 1 و2 (B3):** ${formatNumber(result.disclosures.totalScope1And2Tco2e)} tCO2e`,
      `- **إجمالي الانبعاثات مع النطاق 3 (C5):** ${formatNumber(result.disclosures.totalGhgWithScope3Tco2e)} tCO2e`,
      `- **كثافة الانبعاثات:** ${result.disclosures.ghgIntensityTco2ePerEurMillion} tCO2e / مليون يورو`,
      `- **إدانات/غرامات الفساد والرشوة (B11):** ${input.antiCorruptionConvictionsCount}`,
      '',
      '## 4. الضوابط الرقابية الستة (VSME Controls)',
      '',
      '| الضابط | الحالة | الوزن | الوصف |',
      '|---|---|---|---|',
      ...result.controls.map(
        (ctrl) =>
          `| \`${ctrl.id}\` | ${ctrl.implemented ? 'مُنفذ ✓' : 'ناقص ✗'} | ${ctrl.weight} | ${escMdCell(ctrl.titleAr)} |`,
      ),
    ];

    if (result.csvAudit) {
      lines.push(
        '',
        '## 5. تدقيق محفظة طلبات المشترين والبنوك (CSV)',
        '',
        `- الإجمالي: ${result.csvAudit.totalRequests} | جاهز: ${result.csvAudit.readyCount} | مشروط: ${result.csvAudit.conditionalCount} | محجوب: ${result.csvAudit.blockedCount} | تفعيل الدرع: ${result.csvAudit.capShieldTriggeredCount}`,
        '',
      );
      if (result.csvAudit.rows.length > 0) {
        lines.push(
          '| الصف | رمز الطلب | الجهة الطالبة | الفئة المطلوبة | الحالة | الحماية |',
          '|---|---|---|---|---|---|',
          ...result.csvAudit.rows.map(
            (row) =>
              `| ${row.rowNumber} | \`${escMdCell(row.requestId)}\` | ${escMdCell(row.buyerName)} | \`${escMdCell(row.requestedTier)}\` | **${row.status.toUpperCase()}** | ${row.capProtected ? 'درع 2027 ✓' : 'خارج الدرع'} |`,
          ),
        );
      }
    }

    lines.push(
      '',
      `## ${result.csvAudit ? '6' : '5'}. الملاحظات والنتائج التفصيلية`,
      '',
      ...(result.findings.length > 0
        ? result.findings.map(
            (f) =>
              `- **[${f.severity.toUpperCase()}] ${f.code} — ${escMdCell(f.titleAr)}:** ${escMdCell(f.detailAr)} *(${escMdCell(f.legalRef)})*`,
          )
        : ['- لا توجد ملاحظات مانعة؛ المنشأة مستوفية لمتطلبات VSME المحددة.']),
    );

    if (input.notes) {
      lines.push('', '### ملاحظات المستخدم', '', escMdCell(input.notes));
    }

    return `${lines.join('\n')}\n`;
  }

  const lines: string[] = [
    `# VSME Readiness & Value-Chain Cap Brief — \`${dossierCode}\``,
    '',
    `> **Independence Disclaimer:** ${result.legalDisclaimerEn}`,
    '',
    '## 1. Undertaking Profile & Readiness Summary',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Dossier Code | \`${escMdCell(dossierCode)}\` |`,
    `| Tool / Version | \`VSMEKit v${escMdCell(result.version)}\` |`,
    `| Organization | ${escMdCell(input.organizationName)} |`,
    `| Reporting Period Start | \`${escMdCell(input.reportingPeriodStart)}\` |`,
    `| Headcount / Net Turnover | ${formatNumber(input.employeeHeadcount)} employees / €${formatNumber(input.annualNetTurnoverEur)} |`,
    `| Entity Kind / Target Tier | \`${escMdCell(input.entityKind)}\` / \`${escMdCell(input.targetTier)}\` |`,
    `| Incoming Buyer Request | \`${escMdCell(input.incomingBuyerRequest)}\` |`,
    `| Readiness Status | **${result.status.toUpperCase()}** |`,
    `| Readiness Score | **${result.readinessScore}/100** |`,
    `| Canonical SHA-256 Digest | \`${escMdCell(digest)}\` |`,
    '',
    '## 2. EU Value-Chain Cap & Shield Evaluation (2027-01-01 & Omnibus I)',
    '',
    `- Mandatory CSRD In Scope (>1,000 employees & >€450M turnover): **${result.shield.mandatoryCsrdInScope ? 'Yes (In Scope)' : 'No (Out of Scope)'}**`,
    `- Value-Chain Cap Active (>= 2027-01-01): **${result.shield.valueChainCapActive ? 'Active' : 'Pre-Cutoff'}**`,
    `- Eligible for <=1,000-Employee Value-Chain Shield: **${result.shield.eligibleForValueChainShield ? 'Eligible' : 'Not Eligible'}**`,
    `- Statutory Shield Against Excess Requests: **${result.shield.shieldProtectsAgainstExcessRequest ? 'Protected' : 'Not Protected'}**`,
    `- Buyer Excess Demand Detected: **${result.shield.buyerExcessDemandDetected ? 'Yes' : 'No'}**`,
    `- Recommended Standardized Tier: \`${result.shield.recommendedTier}\``,
    `- Estimated Admin Hours Saved Annually by Cap: **${formatNumber(result.shield.estimatedHoursSavedByCap)} hours**`,
    '',
    '## 3. VSME Disclosures & GHG / Energy Metrics',
    '',
    `- **Basic Module (B1–B11):** ${result.disclosures.basicCompletedCount}/${result.disclosures.basicRequiredCount} (${result.disclosures.basicCompletionPct}%) — Missing: ${result.disclosures.missingBasicIds.length > 0 ? result.disclosures.missingBasicIds.join(', ') : 'None'}`,
    `- **Comprehensive Module (C1–C9):** ${result.disclosures.comprehensiveCompletedCount}/${result.disclosures.comprehensiveRequiredCount} (${result.disclosures.comprehensiveCompletionPct}%) — Missing: ${result.disclosures.missingComprehensiveIds.length > 0 ? result.disclosures.missingComprehensiveIds.join(', ') : 'None'}`,
    `- **Energy Consumption:** ${formatNumber(input.energyMwh)} MWh`,
    `- **Scope 1 + 2 GHG Emissions (B3):** ${formatNumber(result.disclosures.totalScope1And2Tco2e)} tCO2e`,
    `- **Total GHG incl. Scope 3 (C5):** ${formatNumber(result.disclosures.totalGhgWithScope3Tco2e)} tCO2e`,
    `- **GHG Intensity:** ${result.disclosures.ghgIntensityTco2ePerEurMillion} tCO2e / EUR M`,
    `- **Anti-Corruption Convictions/Fines (B11):** ${input.antiCorruptionConvictionsCount}`,
    '',
    '## 4. Controls Assessment Matrix',
    '',
    '| Control | Status | Weight | Description |',
    '|---|---|---|---|',
    ...result.controls.map(
      (ctrl) =>
        `| \`${ctrl.id}\` | ${ctrl.implemented ? 'Implemented' : 'Gap'} | ${ctrl.weight} | ${escMdCell(ctrl.titleEn)} |`,
    ),
  ];

  if (result.csvAudit) {
    lines.push(
      '',
      '## 5. Buyer & Bank Request Portfolio CSV Audit',
      '',
      `- Total: ${result.csvAudit.totalRequests} | Ready: ${result.csvAudit.readyCount} | Conditional: ${result.csvAudit.conditionalCount} | Blocked: ${result.csvAudit.blockedCount} | Cap Shield Triggered: ${result.csvAudit.capShieldTriggeredCount}`,
      '',
    );
    if (result.csvAudit.rows.length > 0) {
      lines.push(
        '| Row | Request ID | Buyer / Lender | Requested Tier | Status | Cap Shield |',
        '|---|---|---|---|---|---|',
        ...result.csvAudit.rows.map(
          (row) =>
            `| ${row.rowNumber} | \`${escMdCell(row.requestId)}\` | ${escMdCell(row.buyerName)} | \`${escMdCell(row.requestedTier)}\` | **${row.status.toUpperCase()}** | ${row.capProtected ? '2027 Shield' : 'Outside Shield'} |`,
        ),
      );
    }
  }

  lines.push(
    '',
    `## ${result.csvAudit ? '6' : '5'}. Findings & Recommendations`,
    '',
    ...(result.findings.length > 0
      ? result.findings.map(
          (f) =>
            `- **[${f.severity.toUpperCase()}] ${f.code} — ${escMdCell(f.titleEn)}:** ${escMdCell(f.detailEn)} *(${escMdCell(f.legalRef)})*`,
        )
      : ['- No blocking findings; undertaking satisfies targeted VSME criteria.']),
  );

  if (input.notes) {
    lines.push('', '### Undertaking Notes', '', escMdCell(input.notes));
  }

  return `${lines.join('\n')}\n`;
}
