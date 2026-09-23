import { ApiError } from './errors.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';

// Anything echoed back to the client is truncated and stripped of control characters,
// so a 2 KB junk parameter cannot be reflected into the response or the log line.
export const echo = (value) => String(value).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 40);

export function assertKnownParams(query, allowed) {
  const unknown = Object.keys(query).filter((key) => !allowed.includes(key));
  // A typo'd `pagesize=100` that silently returns 24 rows is the classic half-hour bug.
  if (unknown.length) {
    throw new ApiError(400, `Unknown query parameter: ${unknown.map(echo).join(', ')}`);
  }
}

// Express 5 parses the query string with `querystring`, so a repeated key arrives as an
// array. Coercing it would pick a value the client did not ask for.
function single(query, name) {
  const value = query[name];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be given once`);
  }
  return value;
}

export function readString(query, name) {
  return single(query, name);
}

export function readSearch(query, name = 'search') {
  const value = single(query, name)?.trim();
  // A cleared search box sends `?search=` and must not 400.
  return value ? value : undefined;
}

export function readEnum(query, name, allowed, label) {
  const value = single(query, name);
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) {
    throw new ApiError(400, `Unknown ${label}: ${echo(value)}`);
  }
  return value;
}

// Well beyond 904 pokemon or 934 items at any page size, and small enough that
// (page - 1) * pageSize can never leave the safe-integer range.
const MAX_PAGE = 1_000_000;

const parseDecimal = (raw) => (/^\d+$/.test(raw) ? Number(raw) : null);

export function readPaging(query) {
  const rawPage = single(query, 'page');
  const rawPageSize = single(query, 'pageSize');

  // Plain decimal digits only. Number() would also accept '0x10' and '1e3', so ?page=0x10
  // silently served page 16, and a huge page made offset overflow bigint - a 500 from a
  // query string, which is a client error wearing a server error's clothes.
  const page = rawPage === undefined ? 1 : parseDecimal(rawPage);
  if (page === null || page < 1 || page > MAX_PAGE) {
    throw new ApiError(400, `page must be an integer between 1 and ${MAX_PAGE}`);
  }

  const pageSize = rawPageSize === undefined ? DEFAULT_PAGE_SIZE : parseDecimal(rawPageSize);
  if (pageSize === null || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new ApiError(400, `pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}`);
  }

  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}
