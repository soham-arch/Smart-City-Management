/**
 * usePolling.js — Real-time data polling hook
 *
 * Replaces Supabase realtime subscriptions with HTTP polling.
 * Fetches data from the Express server's JSONL database at regular intervals.
 *
 * HOW IT WORKS:
 *   1. On mount, immediately fetches data from /api/db/<tableName>
 *   2. Sets up a setInterval to re-fetch every intervalMs (default: 5 seconds)
 *   3. Cleans up interval on unmount to prevent memory leaks
 *
 * USAGE:
 *   const { data, loading, error, refetch } = usePolling('hospitals');
 *   const { data: patients } = usePolling('patients', 3000); // poll faster
 *
 * RETURNS:
 *   - data     {Array}    The fetched rows from the table
 *   - loading  {boolean}  True until first fetch completes
 *   - error    {Error}    Any fetch error, or null
 *   - refetch  {Function} Call manually to force an immediate refresh
 *   - setData  {Function} Override data locally (optimistic updates)
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_CPP_API_URL || 'http://localhost:3001';

/**
 * Polling-based hook that replaces Supabase realtime subscriptions.
 * Fetches data from the local file-based DB via the Express server.
 *
 * @param {string} tableName - Table name to poll (e.g. 'hospitals', 'incidents')
 * @param {number} intervalMs - Polling interval in milliseconds (default 5000)
 * @returns {{ data: Array, loading: boolean, error: Error|null, refetch: Function, setData: Function }}
 */
export function usePolling(tableName, intervalMs = 5000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/db/${tableName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${tableName}: ${response.status}`);
      }
      const result = await response.json();
      if (mountedRef.current) {
        setData(Array.isArray(result) ? result : []);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      console.warn(`[NEXUS] usePolling(${tableName}) error:`, err);
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [tableName]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    const interval = setInterval(() => {
      if (mountedRef.current) fetchData();
    }, intervalMs);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [tableName, intervalMs, fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}

export default usePolling;
