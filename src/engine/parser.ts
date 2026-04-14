import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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

export function getExcelSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseExcel(file: File, opts?: ExcelParseOptions): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = opts?.sheetName ?? workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          reject(new Error(`Sheet "${sheetName}" not found`));
          return;
        }
        const jsonData = XLSX.utils.sheet_to_json<DataRow>(sheet, { defval: '' });
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        resolve({ fileName: file.name, headers, rows: jsonData, sheetName });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
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
