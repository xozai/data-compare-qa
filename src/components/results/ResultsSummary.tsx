import { CheckCircle2, XCircle, AlertTriangle, FileQuestion } from 'lucide-react';
import type { ComparisonResult } from '../../types';

interface ResultsSummaryProps {
  result: ComparisonResult;
}

export function ResultsSummary({ result }: ResultsSummaryProps) {
  const { summary } = result;
  const perfectMatch = summary.mismatchCellCount === 0 && summary.missingFromTargetCount === 0 && summary.missingFromSourceCount === 0;

  const cards = [
    {
      label: 'Source Rows',
      value: summary.sourceRowCount,
      icon: FileQuestion,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: 'Target Rows',
      value: summary.targetRowCount,
      icon: FileQuestion,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: 'Matched Rows',
      value: summary.matchedRowCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'Rows with Mismatches',
      value: summary.mismatchRowCount,
      icon: XCircle,
      color: summary.mismatchRowCount > 0 ? 'text-red-600' : 'text-gray-400',
      bg: summary.mismatchRowCount > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: 'Cell Mismatches',
      value: summary.mismatchCellCount,
      icon: XCircle,
      color: summary.mismatchCellCount > 0 ? 'text-red-600' : 'text-gray-400',
      bg: summary.mismatchCellCount > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: 'Missing from Target',
      value: summary.missingFromTargetCount,
      icon: AlertTriangle,
      color: summary.missingFromTargetCount > 0 ? 'text-amber-600' : 'text-gray-400',
      bg: summary.missingFromTargetCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-gray-50 dark:bg-gray-800',
    },
    {
      label: 'Missing from Source',
      value: summary.missingFromSourceCount,
      icon: AlertTriangle,
      color: summary.missingFromSourceCount > 0 ? 'text-amber-600' : 'text-gray-400',
      bg: summary.missingFromSourceCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-gray-50 dark:bg-gray-800',
    },
  ];

  return (
    <div className="space-y-4">
      {perfectMatch && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-200">Perfect Match</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              All {summary.matchedRowCount} rows match across all mapped columns.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-lg p-3 text-center`}>
            <card.icon className={`w-5 h-5 mx-auto mb-1 ${card.color}`} />
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {card.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Duplicate key warnings */}
      {(result.duplicateKeys.source.length > 0 || result.duplicateKeys.target.length > 0) && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
          <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200 mb-1">
            <AlertTriangle className="w-4 h-4" />
            Duplicate Keys Detected
          </div>
          {result.duplicateKeys.source.length > 0 && (
            <p className="text-amber-700 dark:text-amber-300">
              Source has {result.duplicateKeys.source.length} duplicate key(s): {result.duplicateKeys.source.slice(0, 5).join(', ')}
              {result.duplicateKeys.source.length > 5 && ` and ${result.duplicateKeys.source.length - 5} more`}
            </p>
          )}
          {result.duplicateKeys.target.length > 0 && (
            <p className="text-amber-700 dark:text-amber-300">
              Target has {result.duplicateKeys.target.length} duplicate key(s): {result.duplicateKeys.target.slice(0, 5).join(', ')}
              {result.duplicateKeys.target.length > 5 && ` and ${result.duplicateKeys.target.length - 5} more`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
