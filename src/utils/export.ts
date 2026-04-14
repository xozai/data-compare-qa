import type { ComparisonResult } from '../types';

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
