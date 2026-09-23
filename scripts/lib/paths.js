import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Lives here rather than in workbook.js so that apply-schema.js, smoke-api.js and
// explain-api.js can resolve a directory without statically importing exceljs. The
// migration runner has no business loading a spreadsheet parser to find a file path.
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
