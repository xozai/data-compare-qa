import { compare } from './comparator';
import type { DataRow, ComparisonConfig } from '../types';

interface WorkerRequest {
  sourceRows: DataRow[];
  targetRows: DataRow[];
  config: ComparisonConfig;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const result = compare(e.data.sourceRows, e.data.targetRows, e.data.config);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
