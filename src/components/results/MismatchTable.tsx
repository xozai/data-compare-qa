import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { CellMismatch } from '../../types';

interface MismatchTableProps {
  mismatches: CellMismatch[];
}

export function MismatchTable({ mismatches }: MismatchTableProps) {
  const [search, setSearch] = useState('');
  const [columnFilter, setColumnFilter] = useState('');

  const columns = useMemo(
    () => [...new Set(mismatches.map((m) => m.sourceColumn))],
    [mismatches]
  );

  const filtered = useMemo(() => {
    let result = mismatches;
    if (columnFilter) {
      result = result.filter((m) => m.sourceColumn === columnFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          Object.values(m.keyValues).some((v) => v.toLowerCase().includes(q)) ||
          (m.sourceValue?.toLowerCase().includes(q) ?? false) ||
          (m.targetValue?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [mismatches, search, columnFilter]);

  if (mismatches.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No mismatches found — all matched rows have identical values.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by key or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          />
        </div>
        <select
          value={columnFilter}
          onChange={(e) => setColumnFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
        >
          <option value="">All columns</option>
          {columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                Key
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                Column
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                Source Value
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                Target Value
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 500).map((m, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {Object.entries(m.keyValues)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {m.sourceColumn} / {m.targetColumn}
                </td>
                <td className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 font-mono text-xs">
                  {m.sourceValue ?? '(null)'}
                </td>
                <td className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 font-mono text-xs">
                  {m.targetValue ?? '(null)'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-800">
            Showing 500 of {filtered.length} mismatches
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400">{filtered.length} mismatch(es)</p>
    </div>
  );
}
