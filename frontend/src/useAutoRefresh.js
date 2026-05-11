import { useEffect, useRef } from 'react';

/**
 * Subscribes to the backend SSE stream (/api/events).
 * Calls `onRefresh()` whenever the Excel file changes on disk.
 * Falls back to polling if SSE is not supported.
 */
export function useAutoRefresh(onRefresh) {
  const versionRef = useRef(null);

  useEffect(() => {
    let es;
    let pollTimer;

    function handleVersionChange(newVersion) {
      if (versionRef.current !== null && newVersion !== versionRef.current) {
        console.log('[auto-refresh] Excel changed → refetching data…');
        onRefresh();
      }
      versionRef.current = newVersion;
    }

    if (typeof EventSource !== 'undefined') {
      // ── SSE (primary) ───────────────────────────────────
      es = new EventSource('/api/events');

      es.onmessage = (e) => {
        try {
          const { version } = JSON.parse(e.data);
          handleVersionChange(version);
        } catch (_) {}
      };

      es.onerror = () => {
        // SSE dropped — fall back to polling
        es.close();
        startPolling();
      };
    } else {
      startPolling();
    }

    function startPolling() {
      pollTimer = setInterval(async () => {
        try {
          const r = await fetch('/api/version');
          const { version } = await r.json();
          handleVersionChange(version);
        } catch (_) {}
      }, 5000);
    }

    return () => {
      es?.close();
      clearInterval(pollTimer);
    };
  }, []); // run once on mount
}
