import type { ComparisonResult, DataRow, ParsedFile } from '../types';

export function exportToCSV(result: ComparisonResult): string {
  const lines: string[] = [];
  lines.push('Type,Key,Column (Source),Column (Target),Source Value,Target Value');

  for (const m of result.mismatches) {
    const keyStr = Object.entries(m.keyValues)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    lines.push(
      [
        'Mismatch',
        csvEscape(keyStr),
        csvEscape(m.sourceColumn),
        csvEscape(m.targetColumn),
        csvEscape(m.sourceValue ?? '(null)'),
        csvEscape(m.targetValue ?? '(null)'),
      ].join(',')
    );
  }

  for (const row of result.missingFromTarget) {
    const vals = Object.entries(row)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    lines.push(
      ['Missing from Target', csvEscape(vals), '', '', '', ''].join(',')
    );
  }

  for (const row of result.missingFromSource) {
    const vals = Object.entries(row)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    lines.push(
      ['Missing from Source', '', '', csvEscape(vals), '', ''].join(',')
    );
  }

  return lines.join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Error Log ───────────────────────────────────────────────────────────────

const DIVIDER = '─'.repeat(46);

function formatKeyDisplay(row: DataRow, keyColumns: string[]): string {
  const cols = keyColumns.length > 0 ? keyColumns : Object.keys(row).slice(0, 3);
  return cols.map((k) => `${k}=${row[k] ?? '(empty)'}`).join(', ');
}

function val(v: string | null | undefined): string {
  return v == null || v === '' ? '(empty)' : v;
}

export function generateErrorLog(
  result: ComparisonResult,
  source: ParsedFile,
  target: ParsedFile,
  keyColumns: string[]
): string {
  const lines: string[] = [];
  const totalErrors =
    result.summary.mismatchCellCount +
    result.summary.missingFromTargetCount +
    result.summary.missingFromSourceCount +
    result.duplicateKeys.source.length +
    result.duplicateKeys.target.length;

  // Header
  lines.push('DATA COMPARE — ERROR LOG');
  lines.push(`Generated : ${new Date().toISOString()}`);
  lines.push(`Source file: ${source.fileName}  (${source.rows.length} rows)`);
  lines.push(`Target file: ${target.fileName}  (${target.rows.length} rows)`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push(`  Mismatch cells       : ${result.summary.mismatchCellCount}`);
  lines.push(`  Missing from target  : ${result.summary.missingFromTargetCount}`);
  lines.push(`  Missing from source  : ${result.summary.missingFromSourceCount}`);
  lines.push(`  Duplicate keys (source): ${result.duplicateKeys.source.length}`);
  lines.push(`  Duplicate keys (target): ${result.duplicateKeys.target.length}`);
  lines.push(`  Total errors         : ${totalErrors}`);
  lines.push('');

  // Errors section
  lines.push(DIVIDER);
  lines.push('ERRORS');
  lines.push(DIVIDER);

  // Mismatches
  for (const m of result.mismatches) {
    const keyStr = Object.entries(m.keyValues)
      .map(([k, v]) => `${k}=${val(v)}`)
      .join(', ');
    lines.push('');
    lines.push(`[MISMATCH] Row key: ${keyStr}`);
    lines.push(`  Dataset : Source & Target`);
    lines.push(`  Column  : ${m.sourceColumn} → ${m.targetColumn}`);
    lines.push(`  Source  : "${val(m.sourceValue)}"`);
    lines.push(`  Target  : "${val(m.targetValue)}"`);
    lines.push(`  Message : Value mismatch in column "${m.sourceColumn}"`);
  }

  // Missing from target (rows in source with no match in target)
  for (const row of result.missingFromTarget) {
    const keyStr = formatKeyDisplay(row, keyColumns);
    lines.push('');
    lines.push(`[MISSING] Row key: ${keyStr}`);
    lines.push(`  Dataset : Source  (row exists in Source but not in Target)`);
    lines.push(`  Message : Row present in Source has no matching key in Target`);
  }

  // Missing from source (rows in target with no match in source)
  for (const row of result.missingFromSource) {
    const keyStr = formatKeyDisplay(row, keyColumns);
    lines.push('');
    lines.push(`[MISSING] Row key: ${keyStr}`);
    lines.push(`  Dataset : Target  (row exists in Target but not in Source)`);
    lines.push(`  Message : Row present in Target has no matching key in Source`);
  }

  // Duplicate keys — source
  for (const key of result.duplicateKeys.source) {
    lines.push('');
    lines.push(`[DUPLICATE KEY] Key: ${key}`);
    lines.push(`  Dataset : Source`);
    lines.push(`  Message : Key appears more than once in the Source dataset`);
  }

  // Duplicate keys — target
  for (const key of result.duplicateKeys.target) {
    lines.push('');
    lines.push(`[DUPLICATE KEY] Key: ${key}`);
    lines.push(`  Dataset : Target`);
    lines.push(`  Message : Key appears more than once in the Target dataset`);
  }

  lines.push('');
  return lines.join('\n');
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

export function copyToClipboard(result: ComparisonResult): string {
  const lines: string[] = [];
  lines.push('Type\tKey\tColumn (Source)\tColumn (Target)\tSource Value\tTarget Value');

  for (const m of result.mismatches) {
    const keyStr = Object.entries(m.keyValues)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    lines.push(
      ['Mismatch', keyStr, m.sourceColumn, m.targetColumn, m.sourceValue ?? '(null)', m.targetValue ?? '(null)'].join('\t')
    );
  }

  for (const row of result.missingFromTarget) {
    const vals = Object.entries(row)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    lines.push(['Missing from Target', vals, '', '', '', ''].join('\t'));
  }

  for (const row of result.missingFromSource) {
    const vals = Object.entries(row)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    lines.push(['Missing from Source', '', '', vals, '', ''].join('\t'));
  }

  const text = lines.join('\n');
  navigator.clipboard.writeText(text);
  return text;
}
