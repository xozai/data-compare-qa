import { useState } from 'react';
import { Download, ClipboardCopy, Check, FileWarning } from 'lucide-react';
import type { ComparisonResult, ParsedFile } from '../../types';
import {
  exportToCSV,
  downloadCSV,
  copyToClipboard,
  generateErrorLog,
  downloadText,
} from '../../utils/export';

interface ExportButtonsProps {
  result: ComparisonResult;
  source: ParsedFile;
  target: ParsedFile;
  keyColumns: string[];
}

export function ExportButtons({ result, source, target, keyColumns }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);

  function handleDownload() {
    const csv = exportToCSV(result);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    downloadCSV(csv, `comparison-report-${timestamp}.csv`);
  }

  function handleCopy() {
    copyToClipboard(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleErrorLog() {
    const log = generateErrorLog(result, source, target, keyColumns);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    downloadText(log, `error-log-${timestamp}.txt`);
  }

  const hasData =
    result.mismatches.length > 0 ||
    result.missingFromTarget.length > 0 ||
    result.missingFromSource.length > 0;

  const hasErrors =
    result.summary.mismatchCellCount > 0 ||
    result.summary.missingFromTargetCount > 0 ||
    result.summary.missingFromSourceCount > 0 ||
    result.duplicateKeys.source.length > 0 ||
    result.duplicateKeys.target.length > 0;

  if (!hasData) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Download className="w-4 h-4" />
        Download CSV
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <ClipboardCopy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
      {hasErrors && (
        <button
          onClick={handleErrorLog}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-warning/40 text-warning rounded-lg hover:bg-warning/5 transition-colors"
        >
          <FileWarning className="w-4 h-4" />
          Error Log
        </button>
      )}
    </div>
  );
}
