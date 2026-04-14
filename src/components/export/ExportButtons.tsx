import { useState } from 'react';
import { Download, ClipboardCopy, Check } from 'lucide-react';
import type { ComparisonResult } from '../../types';
import { exportToCSV, downloadCSV, copyToClipboard } from '../../utils/export';

interface ExportButtonsProps {
  result: ComparisonResult;
}

export function ExportButtons({ result }: ExportButtonsProps) {
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

  const hasData =
    result.mismatches.length > 0 ||
    result.missingFromTarget.length > 0 ||
    result.missingFromSource.length > 0;

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
    </div>
  );
}
