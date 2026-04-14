import { useState, useMemo } from 'react';
import { ArrowRight, Wand2, Key, AlertTriangle } from 'lucide-react';
import type { ColumnMapping, ParsedFile } from '../../types';
import { cn } from '../../utils/cn';

interface ColumnMapperProps {
  source: ParsedFile;
  target: ParsedFile;
  mappings: ColumnMapping[];
  keyColumns: string[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  onKeyColumnsChange: (keys: string[]) => void;
  onCompare: () => void;
  caseSensitive: boolean;
  trimWhitespace: boolean;
  numericTolerance: number;
  onCaseSensitiveChange: (v: boolean) => void;
  onTrimWhitespaceChange: (v: boolean) => void;
  onNumericToleranceChange: (v: number) => void;
}

export function ColumnMapper({
  source,
  target,
  mappings,
  keyColumns,
  onMappingsChange,
  onKeyColumnsChange,
  onCompare,
  caseSensitive,
  trimWhitespace,
  numericTolerance,
  onCaseSensitiveChange,
  onTrimWhitespaceChange,
  onNumericToleranceChange,
}: ColumnMapperProps) {
  const [showUnmapped, setShowUnmapped] = useState(true);

  const usedTargetColumns = useMemo(
    () => new Set(mappings.map((m) => m.targetColumn)),
    [mappings]
  );

  const unmappedSource = source.headers.filter(
    (h) => !mappings.some((m) => m.sourceColumn === h)
  );

  function autoMap() {
    const newMappings: ColumnMapping[] = [];
    const taken = new Set<string>();

    for (const srcCol of source.headers) {
      const exactMatch = target.headers.find(
        (t) => t.toLowerCase() === srcCol.toLowerCase() && !taken.has(t)
      );
      if (exactMatch) {
        newMappings.push({ sourceColumn: srcCol, targetColumn: exactMatch });
        taken.add(exactMatch);
      }
    }
    onMappingsChange(newMappings);
  }

  function setMapping(sourceColumn: string, targetColumn: string) {
    const existing = mappings.filter((m) => m.sourceColumn !== sourceColumn);
    if (targetColumn) {
      existing.push({ sourceColumn, targetColumn });
    }
    onMappingsChange(existing);
  }

  function toggleKey(sourceColumn: string) {
    if (keyColumns.includes(sourceColumn)) {
      onKeyColumnsChange(keyColumns.filter((k) => k !== sourceColumn));
    } else {
      onKeyColumnsChange([...keyColumns, sourceColumn]);
    }
  }

  const canCompare = mappings.length > 0 && keyColumns.length > 0;

  return (
    <div className="space-y-6">
      {/* Auto-map + Options */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={autoMap}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <Wand2 className="w-4 h-4" />
          Auto-Map by Name
        </button>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => onCaseSensitiveChange(e.target.checked)}
            className="rounded"
          />
          Case sensitive
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={trimWhitespace}
            onChange={(e) => onTrimWhitespaceChange(e.target.checked)}
            className="rounded"
          />
          Trim whitespace
        </label>

        <label className="flex items-center gap-2 text-sm">
          Numeric tolerance:
          <input
            type="number"
            min="0"
            step="0.01"
            value={numericTolerance}
            onChange={(e) => onNumericToleranceChange(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
          />
        </label>
      </div>

      {/* Mapping Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300 w-10">
                <Key className="w-4 h-4" />
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                Source Column
              </th>
              <th className="px-4 py-2 text-center w-10">
                <ArrowRight className="w-4 h-4 mx-auto text-gray-400" />
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                Target Column
              </th>
            </tr>
          </thead>
          <tbody>
            {source.headers.map((srcCol) => {
              const mapping = mappings.find((m) => m.sourceColumn === srcCol);
              const isMapped = !!mapping;
              const isKey = keyColumns.includes(srcCol);

              if (!showUnmapped && !isMapped) return null;

              return (
                <tr
                  key={srcCol}
                  className={cn(
                    'border-t border-gray-100 dark:border-gray-800',
                    isKey && 'bg-amber-50 dark:bg-amber-950/20'
                  )}
                >
                  <td className="px-4 py-2">
                    {isMapped && (
                      <button
                        onClick={() => toggleKey(srcCol)}
                        className={cn(
                          'p-1 rounded transition-colors',
                          isKey
                            ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
                            : 'text-gray-300 hover:text-gray-500'
                        )}
                        title={isKey ? 'Remove as key column' : 'Set as key column'}
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-gray-800 dark:text-gray-200">
                    {srcCol}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <ArrowRight className="w-4 h-4 mx-auto text-gray-300" />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={mapping?.targetColumn ?? ''}
                      onChange={(e) => setMapping(srcCol, e.target.value)}
                      className={cn(
                        'w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800',
                        isMapped
                          ? 'border-primary/30 text-gray-800 dark:text-gray-200'
                          : 'border-gray-300 dark:border-gray-600 text-gray-400'
                      )}
                    >
                      <option value="">— not mapped —</option>
                      {target.headers.map((tCol) => (
                        <option
                          key={tCol}
                          value={tCol}
                          disabled={usedTargetColumns.has(tCol) && mapping?.targetColumn !== tCol}
                        >
                          {tCol}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unmapped info */}
      {unmappedSource.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => setShowUnmapped(!showUnmapped)}
            className="text-primary hover:underline"
          >
            {showUnmapped ? 'Hide' : 'Show'} {unmappedSource.length} unmapped column
            {unmappedSource.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Warnings and Compare button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {keyColumns.length === 0 && mappings.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="w-4 h-4" />
              Select at least one key column to match rows
            </div>
          )}
        </div>
        <button
          onClick={onCompare}
          disabled={!canCompare}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium text-sm transition-colors',
            canCompare
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
          )}
        >
          Compare Datasets
        </button>
      </div>
    </div>
  );
}
