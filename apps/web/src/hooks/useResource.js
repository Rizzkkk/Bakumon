import { useEffect, useRef, useState } from 'react';

// The loading / error / abort / stale-response block, once. It is needed by WikiHome,
// PokemonDetail and ItemDetail - exactly three call sites, which conventions.md names as
// the point to extract rather than the point to notice.
export function useResource(run, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const latest = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const id = ++latest.current;

    // Keeps the previous data while the next request is in flight, so a results grid does
    // not blink empty on every keystroke.
    setState((previous) => ({ status: 'loading', data: previous.data, error: null }));

    run(controller.signal)
      .then((data) => {
        // Abort is a request to stop, not a guarantee the response never lands. Without
        // this id check a slow early response can overwrite a fast later one.
        if (id === latest.current) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (id === latest.current) setState({ status: 'error', data: null, error });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
