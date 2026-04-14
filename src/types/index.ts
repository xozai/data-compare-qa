export interface DataRow {
  [column: string]: string | number | boolean | null;
}

export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: DataRow[];
  sheetName?: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
}

export interface ComparisonConfig {
  mappings: ColumnMapping[];
  keyColumns: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
  numericTolerance: number;
}

export interface CellMismatch {
  keyValues: Record<string, string>;
  sourceColumn: string;
  targetColumn: string;
  sourceValue: string | null;
  targetValue: string | null;
}

export interface ComparisonResult {
  summary: {
    sourceRowCount: number;
    targetRowCount: number;
    matchedRowCount: number;
    missingFromTargetCount: number;
    missingFromSourceCount: number;
    mismatchRowCount: number;
    mismatchCellCount: number;
  };
  mismatches: CellMismatch[];
  missingFromTarget: DataRow[];
  missingFromSource: DataRow[];
  duplicateKeys: { source: string[]; target: string[] };
}

export type WizardStep = 'upload' | 'mapping' | 'results';
