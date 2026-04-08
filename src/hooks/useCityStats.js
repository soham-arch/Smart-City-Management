import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_CPP_API_URL || 'http://localhost:3001';

/**
 * Hook to get aggregated city-wide statistics.
 * Pulls from local file DB via Express API polling.
 * Fetches hospitals, incidents, police, fire stations, crime queue for accurate real-time stats.
 * Fully crash-safe — catches all errors and returns defaults.
 */
export function useCityStats() {
  const [stats, setStats] = useState({
    activeIncidents: 0,
    unitsDeployed: 0,
    avgResponseTime: '0 min',
    bedsAvailable: 0,
    icuBedsAvailable: 0,
    systemStatus: 'all_clear',
    ambulanceUnits: 0,
    policeUnits: 0,
    fireUnits: 0,
    totalHospitals: 0,
    totalPoliceStations: 0,
    totalFireStations: 0,
    totalPatients: 0,
    activeCrimes: 0,
    resolvedCrimes: 0,
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all data sources in parallel for accurate real-time stats
      const [hospitalsRes, incidentsRes, policeRes, fireRes, crimeQueueRes, patientsRes, patrolRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/db/hospitals`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/db/incidents`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/db/police_stations`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/db/fire_stations`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/db/crime_queue`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/db/patients`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE_URL}/api/db/patrol_units`).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);

      const hospitals = Array.isArray(hospitalsRes) ? hospitalsRes : [];
      const incidents = Array.isArray(incidentsRes) ? incidentsRes : [];
      const policeStations = Array.isArray(policeRes) ? policeRes : [];
      const fireStations = Array.isArray(fireRes) ? fireRes : [];
      const crimeQueue = Array.isArray(crimeQueueRes) ? crimeQueueRes : [];
      const patients = Array.isArray(patientsRes) ? patientsRes : [];
      const patrolUnits = Array.isArray(patrolRes) ? patrolRes : [];

      // Active incidents (from incidents table)
      const activeIncidents = incidents.filter(
        (i) => i.status === 'dispatched' || i.status === 'en_route'
      ).length;

      // Active crimes from crime queue
      const activeCrimes = crimeQueue.filter(
        (c) => c.status === 'pending' || c.status === 'active'
      ).length;
      const resolvedCrimes = crimeQueue.filter(c => c.status === 'resolved').length;

      // Beds available (real-time from DB)
      const bedsAvailable = hospitals.reduce((sum, h) => sum + (h.beds_available || 0), 0);
      const icuBedsAvailable = hospitals.reduce((sum, h) => sum + (h.icu_beds_available || 0), 0);

      // Units by type — count from incidents AND active crimes
      const ambulanceUnits = incidents.filter(
        (i) => i.type === 'ambulance' && (i.status === 'dispatched' || i.status === 'en_route')
      ).length;

      // Police units: count dispatched patrol units (most accurate)
      const policeUnits = patrolUnits.filter(u => u.status === 'dispatched').length;

      const fireUnits = incidents.filter(
        (i) => i.type === 'fire' && (i.status === 'dispatched' || i.status === 'en_route')
      ).length;

      // Total patients currently admitted
      const totalPatients = patients.filter(p => p.status !== 'discharged').length;

      // Avg response time
      let avgResponseTime = '0 min';
      const allWithResponse = [
        ...incidents.filter(i => i.response_time_seconds),
        ...crimeQueue.filter(c => c.response_time_seconds),
      ];
      if (allWithResponse.length > 0) {
        const avg = allWithResponse.reduce((sum, i) => sum + (i.response_time_seconds || 0), 0) / allWithResponse.length;
        avgResponseTime = `${(avg / 60).toFixed(1)} min`;
      }

      // System status (based on all active situations)
      const totalActive = activeIncidents + activeCrimes;
      const systemStatus = totalActive > 5 ? 'critical' : totalActive > 0 ? 'active_emergency' : 'all_clear';

      if (mountedRef.current) {
        setStats({
          activeIncidents: activeIncidents + activeCrimes,
          unitsDeployed: ambulanceUnits + policeUnits + fireUnits,
          avgResponseTime,
          bedsAvailable,
          icuBedsAvailable,
          systemStatus,
          ambulanceUnits,
          policeUnits,
          fireUnits,
          totalHospitals: hospitals.length,
          totalPoliceStations: policeStations.length,
          totalFireStations: fireStations.length,
          totalPatients,
          activeCrimes,
          resolvedCrimes,
          lastUpdated: new Date().toISOString(),
        });
        setLoading(false);
      }
    } catch (err) {
      console.warn('[NEXUS] useCityStats error:', err);
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();

    // Poll every 3 seconds for more responsive real-time updates
    const interval = setInterval(() => {
      if (mountedRef.current) fetchStats();
    }, 3000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export default useCityStats;
