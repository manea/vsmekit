import { useState, type DragEvent } from 'react';
import { Download, FileSpreadsheet, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import { getPresetSampleBuyerCsv } from '../lib/api.ts';
import type { Translations } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  t: Translations;
  locked: boolean;
  onChange: (patch: Partial<AssessmentInput>) => void;
  onDownloadCsv: () => void;
}

export function BuyerCsvAuditPanel({
  input,
  result,
  t,
  locked,
  onChange,
  onDownloadCsv,
}: Props) {
  const [dragOver, setDragOver] = useState(false);

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (locked) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    onChange({ buyerRequestsCsv: text });
  }

  const audit = result.csvAudit;

  return (
    <div className="space-y-4">
      <div className="vsme-card rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[var(--text-primary)]">{t.csvSectionTitle}</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={locked}
              onClick={() => onChange({ buyerRequestsCsv: getPresetSampleBuyerCsv() })}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{t.csvLoadPresetSample}</span>
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => onChange({ buyerRequestsCsv: '' })}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.csvClear}</span>
            </button>
            <button
              type="button"
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.downloadCsvBom}</span>
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!locked) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => void handleDrop(e)}
          className={`rounded-xl border-2 border-dashed p-3 transition ${
            dragOver
              ? 'border-[var(--accent-primary)] bg-[var(--bg-soft)]'
              : 'border-[var(--border-strong)] bg-[var(--bg-elevated)]'
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Upload className="h-4 w-4 shrink-0" />
            <span>{t.csvDropHint}</span>
          </div>
          <textarea
            rows={5}
            dir="ltr"
            disabled={locked}
            className="vsme-input vsme-mono text-xs"
            value={input.buyerRequestsCsv || ''}
            onChange={(e) => onChange({ buyerRequestsCsv: e.target.value })}
            placeholder="request_id,buyer_or_lender_name,buyer_csrd_covered,requested_tier,sme_employees,reporting_period_start,includes_excess_esrs_fields"
          />
        </div>
      </div>

      {audit && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="vsme-card rounded-xl p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvTotal}</div>
              <div className="vsme-mono num-tabular text-lg font-bold text-[var(--text-primary)]">
                {audit.totalRequests}
              </div>
            </div>
            <div className="vsme-card rounded-xl p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvReady}</div>
              <div className="vsme-mono num-tabular text-lg font-bold text-[var(--accent-emerald)]">
                {audit.readyCount}
              </div>
            </div>
            <div className="vsme-card rounded-xl p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvConditional}</div>
              <div className="vsme-mono num-tabular text-lg font-bold text-[var(--accent-amber)]">
                {audit.conditionalCount}
              </div>
            </div>
            <div className="vsme-card rounded-xl p-3">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvBlocked}</div>
              <div className="vsme-mono num-tabular text-lg font-bold text-[var(--accent-crimson)]">
                {audit.blockedCount}
              </div>
            </div>
            <div className="vsme-card col-span-2 rounded-xl p-3 sm:col-span-1">
              <div className="text-[11px] text-[var(--text-secondary)]">{t.csvCapTriggered}</div>
              <div className="vsme-mono num-tabular text-lg font-bold text-[var(--accent-primary)]">
                {audit.capShieldTriggeredCount}
              </div>
            </div>
          </div>

          {audit.rows.length > 0 && (
            <div className="vsme-card overflow-x-auto rounded-2xl p-4" dir="ltr">
              <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <th className="py-2 pr-3 font-semibold">#</th>
                    <th className="py-2 pr-3 font-semibold">Request</th>
                    <th className="py-2 pr-3 font-semibold">Buyer / Lender</th>
                    <th className="py-2 pr-3 font-semibold">Requested Tier</th>
                    <th className="py-2 pr-3 font-semibold">Period</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 font-semibold">2027 Shield / Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.rows.map((row) => (
                    <tr
                      key={`${row.rowNumber}-${row.requestId}`}
                      className="border-b border-[var(--border-subtle)] last:border-none"
                    >
                      <td className="vsme-mono num-tabular py-2.5 pr-3">{row.rowNumber}</td>
                      <td className="vsme-mono py-2.5 pr-3 font-semibold">{row.requestId}</td>
                      <td className="py-2.5 pr-3">{row.buyerName}</td>
                      <td className="vsme-mono py-2.5 pr-3">{row.requestedTier}</td>
                      <td className="vsme-mono num-tabular py-2.5 pr-3">
                        {row.reportingPeriodStart}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className="vsme-mono rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor:
                              row.status === 'ready'
                                ? 'var(--accent-emerald-soft)'
                                : row.status === 'conditional'
                                  ? 'var(--accent-amber-soft)'
                                  : 'var(--accent-crimson-soft)',
                            color:
                              row.status === 'ready'
                                ? 'var(--accent-emerald)'
                                : row.status === 'conditional'
                                  ? 'var(--accent-amber)'
                                  : 'var(--accent-crimson)',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        {row.capProtected && (
                          <span className="mr-1.5 inline-flex items-center gap-1 font-semibold text-[var(--accent-emerald)]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Shield
                          </span>
                        )}
                        {row.issues.join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
