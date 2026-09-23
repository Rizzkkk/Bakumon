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

// Trims members, drops empties and de-duplicates, matching readSearch's rule that an empty
// string is "no filter" rather than a 400. Cap is enforced here, before any per-member check,
// so an oversized list is rejected on shape alone rather than paying for a DB round trip.
function parseList(raw, cap, label) {
  if (raw === undefined) return undefined;
  const seen = new Set();
  const members = [];
  for (const part of raw.split(',')) {
    const member = part.trim();
    if (!member || seen.has(member)) continue;
    seen.add(member);
    members.push(member);
  }
  if (members.length === 0) return undefined;
  if (members.length > cap) {
    throw new ApiError(400, `Too many ${label} values: max ${cap}`);
  }
  return members;
}

// A repeated `?bucket=a&bucket=b` still goes through single() first, so it is rejected the
// same way a repeated single-value bucket always was, rather than being read as a second
// way to write a list.
export function readEnumList(query, name, allowed, cap, label = name) {
  const members = parseList(single(query, name), cap, label);
  if (members === undefined) return undefined;
  for (const member of members) {
    if (!allowed.includes(member)) {
      throw new ApiError(400, `Unknown ${label}: ${echo(member)}`);
    }
  }
  return members;
}

export function readStringList(query, name, cap) {
  return parseList(single(query, name), cap, name);
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
