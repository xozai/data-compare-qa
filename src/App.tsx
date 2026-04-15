import { useState, useCallback, useRef } from 'react';
import { FileUploader } from './components/upload/FileUploader';
import { ColumnMapper } from './components/mapping/ColumnMapper';
import { ResultsSummary } from './components/results/ResultsSummary';
import { MismatchTable } from './components/results/MismatchTable';
import { MissingRowsTable } from './components/results/MissingRowsTable';
import { ExportButtons } from './components/export/ExportButtons';
import { compare } from './engine/comparator';
import type { ParsedFile, ColumnMapping, ComparisonResult, WizardStep, ComparisonConfig } from './types';
import { cn } from './utils/cn';
import { ArrowLeft, GitCompareArrows, Loader2 } from 'lucide-react';

// Use a Web Worker for large datasets to avoid blocking the UI thread.
const WORKER_ROW_THRESHOLD = 50_000;

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'upload', label: 'Upload Files' },
  { key: 'mapping', label: 'Map Columns' },
  { key: 'results', label: 'Results' },
];

function App() {
  const [step, setStep] = useState<WizardStep>('upload');
  const [source, setSource] = useState<ParsedFile | null>(null);
  const [target, setTarget] = useState<ParsedFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [keyColumns, setKeyColumns] = useState<string[]>([]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [numericTolerance, setNumericTolerance] = useState(0);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mismatches' | 'missingTarget' | 'missingSource'>('mismatches');
  const workerRef = useRef<Worker | null>(null);

  const canProceedToMapping = source !== null && target !== null;

  const handleCompare = useCallback(() => {
    if (!source || !target) return;

    const config: ComparisonConfig = {
      mappings,
      keyColumns,
      caseSensitive,
      trimWhitespace,
      numericTolerance,
    };

    const totalRows = source.rows.length + target.rows.length;
    setCompareError(null);

    if (totalRows > WORKER_ROW_THRESHOLD) {
      // Terminate any previous worker still running
      workerRef.current?.terminate();

      setComparing(true);
      const worker = new Worker(
        new URL('./engine/comparator.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<{ result?: ComparisonResult; error?: string }>) => {
        setComparing(false);
        worker.terminate();
        workerRef.current = null;
        if (e.data.error) {
          setCompareError(e.data.error);
        } else if (e.data.result) {
          setResult(e.data.result);
          setActiveTab('mismatches');
          setStep('results');
        }
      };

      worker.onerror = (err) => {
        setComparing(false);
        workerRef.current = null;
        setCompareError(err.message ?? 'Comparison failed');
      };

      worker.postMessage({ sourceRows: source.rows, targetRows: target.rows, config });
    } else {
      // Small dataset — run synchronously on the main thread
      const compResult = compare(source.rows, target.rows, config);
      setResult(compResult);
      setActiveTab('mismatches');
      setStep('results');
    }
  }, [source, target, mappings, keyColumns, caseSensitive, trimWhitespace, numericTolerance]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setSource(null);
    setTarget(null);
    setMappings([]);
    setKeyColumns([]);
    setResult(null);
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Data Compare
            </h1>
          </div>
          {step !== 'upload' && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Step Indicator */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-gray-300 dark:bg-gray-700" />}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  i === stepIndex
                    ? 'bg-primary text-white'
                    : i < stepIndex
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                )}
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs bg-white/20">
                  {i + 1}
                </span>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          {/* UPLOAD STEP */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FileUploader
                  label="Source"
                  parsed={source}
                  onParsed={setSource}
                  onClear={() => setSource(null)}
                />
                <FileUploader
                  label="Target"
                  parsed={target}
                  onParsed={setTarget}
                  onClear={() => setTarget(null)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setStep('mapping')}
                  disabled={!canProceedToMapping}
                  className={cn(
                    'px-6 py-2.5 rounded-lg font-medium text-sm transition-colors',
                    canProceedToMapping
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  )}
                >
                  Next: Map Columns
                </button>
              </div>
            </div>
          )}

          {/* MAPPING STEP */}
          {step === 'mapping' && source && target && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setStep('upload')}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Upload
                </button>
                <p className="text-sm text-gray-500">
                  {source.fileName} ({source.rows.length} rows) vs {target.fileName} ({target.rows.length} rows)
                </p>
              </div>
              <ColumnMapper
                source={source}
                target={target}
                mappings={mappings}
                keyColumns={keyColumns}
                onMappingsChange={setMappings}
                onKeyColumnsChange={setKeyColumns}
                onCompare={handleCompare}
                caseSensitive={caseSensitive}
                trimWhitespace={trimWhitespace}
                numericTolerance={numericTolerance}
                onCaseSensitiveChange={setCaseSensitive}
                onTrimWhitespaceChange={setTrimWhitespace}
                onNumericToleranceChange={setNumericTolerance}
                comparing={comparing}
              />
              {comparing && (
                <div className="flex items-center gap-3 mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>
                    Comparing {source.rows.length.toLocaleString()} × {target.rows.length.toLocaleString()} rows in background…
                  </span>
                </div>
              )}
              {compareError && (
                <div className="mt-4 p-4 bg-danger/5 border border-danger/20 rounded-lg text-sm text-danger">
                  Comparison error: {compareError}
                </div>
              )}
            </div>
          )}

          {/* RESULTS STEP */}
          {step === 'results' && result && source && target && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('mapping')}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Mapping
                </button>
                <ExportButtons
                  result={result}
                  source={source}
                  target={target}
                  keyColumns={keyColumns}
                />
              </div>

              <ResultsSummary result={result} />

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                  {([
                    { key: 'mismatches' as const, label: 'Mismatches', count: result.summary.mismatchCellCount },
                    { key: 'missingTarget' as const, label: 'Missing from Target', count: result.summary.missingFromTargetCount },
                    { key: 'missingSource' as const, label: 'Missing from Source', count: result.summary.missingFromSourceCount },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                        activeTab === tab.key
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      )}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-gray-700">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'mismatches' && (
                <MismatchTable mismatches={result.mismatches} />
              )}
              {activeTab === 'missingTarget' && (
                <MissingRowsTable rows={result.missingFromTarget} label="Missing from Target" />
              )}
              {activeTab === 'missingSource' && (
                <MissingRowsTable rows={result.missingFromSource} label="Missing from Source" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
