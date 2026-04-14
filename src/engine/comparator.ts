import type {
  DataRow,
  ColumnMapping,
  ComparisonConfig,
  ComparisonResult,
  CellMismatch,
} from '../types';

function buildKey(row: DataRow, keyColumns: string[]): string {
  return keyColumns.map((col) => String(row[col] ?? '')).join('|~~|');
}

function normalize(
  value: unknown,
  config: Pick<ComparisonConfig, 'caseSensitive' | 'trimWhitespace' | 'numericTolerance'>
): string {
  let str = String(value ?? '');
  if (config.trimWhitespace) {
    str = str.trim();
  }
  if (!config.caseSensitive) {
    str = str.toLowerCase();
  }
  return str;
}

function valuesMatch(
  sourceVal: unknown,
  targetVal: unknown,
  config: Pick<ComparisonConfig, 'caseSensitive' | 'trimWhitespace' | 'numericTolerance'>
): boolean {
  const sNorm = normalize(sourceVal, config);
  const tNorm = normalize(targetVal, config);

  if (sNorm === tNorm) return true;

  if (config.numericTolerance > 0) {
    const sNum = parseFloat(sNorm);
    const tNum = parseFloat(tNorm);
    if (!isNaN(sNum) && !isNaN(tNum)) {
      return Math.abs(sNum - tNum) <= config.numericTolerance;
    }
  }

  return false;
}

function findDuplicateKeys(rows: DataRow[], keyColumns: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const key = buildKey(row, keyColumns);
    if (seen.has(key)) {
      duplicates.add(key);
    }
    seen.add(key);
  }
  return Array.from(duplicates);
}

export function compare(
  sourceRows: DataRow[],
  targetRows: DataRow[],
  config: ComparisonConfig
): ComparisonResult {
  const { mappings, keyColumns } = config;

  // Find the target key columns (mapped equivalents of source key columns)
  const keyMappings = keyColumns.map((srcKey) => {
    const mapping = mappings.find((m) => m.sourceColumn === srcKey);
    return { sourceKey: srcKey, targetKey: mapping?.targetColumn ?? srcKey };
  });
  const targetKeyColumns = keyMappings.map((m) => m.targetKey);

  // Check for duplicate keys
  const sourceDups = findDuplicateKeys(sourceRows, keyColumns);
  const targetDups = findDuplicateKeys(targetRows, targetKeyColumns);

  // Build index maps (last occurrence wins for duplicates)
  const sourceMap = new Map<string, DataRow>();
  for (const row of sourceRows) {
    sourceMap.set(buildKey(row, keyColumns), row);
  }

  const targetMap = new Map<string, DataRow>();
  for (const row of targetRows) {
    targetMap.set(buildKey(row, targetKeyColumns), row);
  }

  // Find missing rows
  const missingFromTarget: DataRow[] = [];
  const missingFromSource: DataRow[] = [];

  for (const [key, row] of sourceMap) {
    if (!targetMap.has(key)) {
      missingFromTarget.push(row);
    }
  }

  for (const [key, row] of targetMap) {
    if (!sourceMap.has(key)) {
      missingFromSource.push(row);
    }
  }

  // Compare matched rows
  const mismatches: CellMismatch[] = [];
  const mismatchRowKeys = new Set<string>();

  // Only compare non-key mapped columns
  const nonKeyMappings = mappings.filter(
    (m) => !keyColumns.includes(m.sourceColumn)
  );

  for (const [key, sourceRow] of sourceMap) {
    const targetRow = targetMap.get(key);
    if (!targetRow) continue;

    for (const mapping of nonKeyMappings) {
      const sourceVal = sourceRow[mapping.sourceColumn];
      const targetVal = targetRow[mapping.targetColumn];

      if (!valuesMatch(sourceVal, targetVal, config)) {
        const keyValues: Record<string, string> = {};
        for (const kc of keyColumns) {
          keyValues[kc] = String(sourceRow[kc] ?? '');
        }

        mismatches.push({
          keyValues,
          sourceColumn: mapping.sourceColumn,
          targetColumn: mapping.targetColumn,
          sourceValue: sourceVal == null ? null : String(sourceVal),
          targetValue: targetVal == null ? null : String(targetVal),
        });
        mismatchRowKeys.add(key);
      }
    }
  }

  const matchedKeys = new Set<string>();
  for (const key of sourceMap.keys()) {
    if (targetMap.has(key)) {
      matchedKeys.add(key);
    }
  }

  return {
    summary: {
      sourceRowCount: sourceMap.size,
      targetRowCount: targetMap.size,
      matchedRowCount: matchedKeys.size,
      missingFromTargetCount: missingFromTarget.length,
      missingFromSourceCount: missingFromSource.length,
      mismatchRowCount: mismatchRowKeys.size,
      mismatchCellCount: mismatches.length,
    },
    mismatches,
    missingFromTarget,
    missingFromSource,
    duplicateKeys: { source: sourceDups, target: targetDups },
  };
}
