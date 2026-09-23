import { useEffect, useState } from 'react';

// The typed value drives the input so it is never laggy; the debounced value drives the
// fetch. 300ms is what 04-api/contract.md specifies, and it is what keeps a 12-character
// query to one or two requests against a 120/min bucket instead of twelve.
export function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
