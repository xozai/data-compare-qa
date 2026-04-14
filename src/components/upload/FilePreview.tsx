import type { DataRow } from '../../types';

interface FilePreviewProps {
  headers: string[];
  rows: DataRow[];
  maxRows?: number;
}

export function FilePreview({ headers, rows, maxRows = 5 }: FilePreviewProps) {
  const preview = rows.slice(0, maxRows);

  return (
    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
              {headers.map((h) => (
                <td
                  key={h}
                  className="px-3 py-1 text-gray-700 dark:text-gray-400 whitespace-nowrap max-w-[200px] truncate"
                >
                  {String(row[h] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="text-xs text-gray-400 px-3 py-1 bg-gray-50 dark:bg-gray-800">
          Showing {maxRows} of {rows.length} rows
        </p>
      )}
    </div>
  );
}
