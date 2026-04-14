import { useCallback, useState, type DragEvent } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ParsedFile } from '../../types';
import { parseFile, getExcelSheetNames } from '../../engine/parser';
import { FilePreview } from './FilePreview';

interface FileUploaderProps {
  label: string;
  parsed: ParsedFile | null;
  onParsed: (file: ParsedFile) => void;
  onClear: () => void;
}

export function FileUploader({ label, parsed, onParsed, onClear }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<string[] | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setSheets(null);
      setPendingFile(null);

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        try {
          const names = await getExcelSheetNames(file);
          if (names.length > 1) {
            setSheets(names);
            setPendingFile(file);
            return;
          }
        } catch {
          // fall through to parse
        }
      }

      try {
        const result = await parseFile(file);
        onParsed(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    },
    [onParsed]
  );

  const handleSheetSelect = useCallback(
    async (sheetName: string) => {
      if (!pendingFile) return;
      try {
        const result = await parseFile(pendingFile, { sheetName });
        setSheets(null);
        setPendingFile(null);
        onParsed(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    },
    [pendingFile, onParsed]
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  if (parsed) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
            <span className="text-sm text-gray-500">
              {parsed.fileName} — {parsed.rows.length} rows, {parsed.headers.length} columns
              {parsed.sheetName ? ` (${parsed.sheetName})` : ''}
            </span>
          </div>
          <button
            onClick={onClear}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <FilePreview headers={parsed.headers} rows={parsed.rows} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>

      {sheets && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-4">
          <p className="text-sm mb-2 font-medium">Select a sheet:</p>
          <div className="flex flex-wrap gap-2">
            {sheets.map((s) => (
              <button
                key={s}
                onClick={() => handleSheetSelect(s)}
                className="px-3 py-1.5 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {!sheets && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          )}
          onClick={() => document.getElementById(`file-input-${label}`)?.click()}
        >
          <input
            id={`file-input-${label}`}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            onChange={onInputChange}
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag & drop or <span className="text-primary font-medium">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">CSV, TSV, XLSX, XLS</p>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
