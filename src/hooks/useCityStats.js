import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

/**
 * Hook to get aggregated city-wide statistics. 
 * Pulls from incidents, units, hospitals, and system_status tables.
 */
export function useCityStats() {
  const [stats, setStats] = useState({
    activeIncidents: 0,
    unitsDeployed: 0,
    avgResponseTime: '0 min',
    bedsAvailable: 0,
    systemStatus: 'all_clear',
    ambulanceUnits: 0,
    policeUnits: 0,
    fireUnits: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Active incidents
      const { count: activeIncidents } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .in('status', ['dispatched', 'en_route']);

      // Beds available
      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('beds_available');
      const bedsAvailable = hospitals?.reduce((sum, h) => sum + (h.beds_available || 0), 0) || 0;

      // Avg response time
      const { data: resolvedIncidents } = await supabase
        .from('incidents')
        .select('response_time_seconds')
        .not('response_time_seconds', 'is', null);
      
      let avgResponseTime = '0 min';
      if (resolvedIncidents && resolvedIncidents.length > 0) {
        const avg = resolvedIncidents.reduce((sum, i) => sum + i.response_time_seconds, 0) / resolvedIncidents.length;
        avgResponseTime = `${(avg / 60).toFixed(1)} min`;
      }

      // Units deployed by type
      const { count: ambulanceUnits } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'ambulance')
        .in('status', ['dispatched', 'en_route']);

      const { count: policeUnits } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'police')
        .in('status', ['dispatched', 'en_route']);

      const { count: fireUnits } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'fire')
        .in('status', ['dispatched', 'en_route']);

      // System status
      const { data: sysStatus } = await supabase
        .from('system_status')
        .select('status')
        .limit(1)
        .single();

      setStats({
        activeIncidents: activeIncidents || 0,
        unitsDeployed: (ambulanceUnits || 0) + (policeUnits || 0) + (fireUnits || 0),
        avgResponseTime,
        bedsAvailable,
        systemStatus: sysStatus?.status || 'all_clear',
        ambulanceUnits: ambulanceUnits || 0,
        policeUnits: policeUnits || 0,
        fireUnits: fireUnits || 0,
      });
      setLoading(false);
    } catch (err) {
      console.error('useCityStats error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Subscribe to incidents + system_status for live updates
    const channel = supabase
      .channel('city_stats_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_status' }, () => fetchStats())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { stats, loading, refetch: fetchStats };
}

export default useCityStats;
