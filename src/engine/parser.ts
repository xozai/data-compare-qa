import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import type { ParsedFile, DataRow } from '../types';

export function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as DataRow[];
        resolve({ fileName: file.name, headers, rows });
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}

export interface ExcelParseOptions {
  sheetName?: string;
}

async function fileToBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function getExcelSheetNames(file: File): Promise<string[]> {
  const buffer = await fileToBuffer(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.worksheets.map((ws) => ws.name);
}

export async function parseExcel(file: File, opts?: ExcelParseOptions): Promise<ParsedFile> {
  const buffer = await fileToBuffer(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  const sheetName = opts?.sheetName ?? sheetNames[0];
  const worksheet = workbook.getWorksheet(sheetName);

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const rows: DataRow[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1); // index 0 is always null in exceljs
    if (rowNumber === 1) {
      headers = values.map((v) => (v == null ? '' : String(v)));
    } else {
      const dataRow: DataRow = {};
      headers.forEach((h, i) => {
        const cell = values[i];
        if (cell == null) {
          dataRow[h] = '';
        } else if (cell instanceof Date) {
          dataRow[h] = cell.toISOString().slice(0, 10);
        } else if (typeof cell === 'object' && 'text' in (cell as object)) {
          dataRow[h] = String((cell as { text: string }).text);
        } else {
          dataRow[h] = String(cell);
        }
      });
      rows.push(dataRow);
    }
  });

  return { fileName: file.name, headers, rows, sheetName };
}

export function parseFile(file: File, opts?: ExcelParseOptions): Promise<ParsedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    return parseCSV(file);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file, opts);
  }
  return Promise.reject(new Error(`Unsupported file type: .${ext}`));
}
