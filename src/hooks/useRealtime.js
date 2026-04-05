import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

/**
 * Generic hook to fetch data from a Supabase table and subscribe to real-time updates.
 * @param {string} table - Table name
 * @param {object} options - { select, orderBy, orderAsc, limit, filter }
 */
export function useRealtime(table, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        let query = supabase.from(table).select(options.select || '*');

        if (options.filter) {
          for (const [col, op, val] of options.filter) {
            query = query.filter(col, op, val);
          }
        }

        if (options.orderBy) {
          query = query.order(options.orderBy, { ascending: options.orderAsc ?? false });
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        if (isMounted) {
          setData(result || []);
          setLoading(false);
        }
      } catch (err) {
        console.error(`useRealtime(${table}) fetch error:`, err);
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel(`${table}_realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          if (!isMounted) return;

          if (payload.eventType === 'INSERT') {
            setData(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev =>
              prev.map(item => (item.id === payload.new.id ? payload.new : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [table]);

  return { data, loading, error, setData };
}

export default useRealtime;
