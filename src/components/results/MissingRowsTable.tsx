import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { DataRow } from '../../types';

interface MissingRowsTableProps {
  rows: DataRow[];
  label: string;
}

export function MissingRowsTable({ rows, label }: MissingRowsTableProps) {
  const [search, setSearch] = useState('');

  const headers = useMemo(
    () => (rows.length > 0 ? Object.keys(rows[0]) : []),
    [rows]
  );

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No rows are {label.toLowerCase()}.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search rows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 500).map((row, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                {headers.map((h) => (
                  <td
                    key={h}
                    className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                  >
                    {String(row[h] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <p className="text-xs text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-800">
            Showing 500 of {filtered.length} rows
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400">{filtered.length} row(s)</p>
    </div>
  );
}
