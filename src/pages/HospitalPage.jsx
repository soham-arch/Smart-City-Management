/**
 * HospitalPage.jsx — Hospital Management / Ward Allocation
 *
 * Displays all hospitals with real-time bed tracking:
 *   - Summary stats (total beds, ICU beds, patients, occupancy %)
 *   - Hospital cards with General/ICU ward progress bars
 *   - Patient list per hospital (injury type, severity, ward, days admitted)
 *   - Healing Tick button → simulates patient healing/discharge
 *   - Rebalance ICU button → runs C++ Ward Knapsack (0/1 Knapsack DP)
 *   - Knapsack explainer panel with injury type table + DP table snapshot
 *
 * Bed model: 1 patient = 1 bed consumed (ICU patients use 1 ICU + 1 total bed)
 * C++ algorithms used: Ward Knapsack (0/1 Knapsack DP), Bed Manager
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import AnimatedCounter from '../components/AnimatedCounter';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import { usePolling } from '../hooks/usePolling';

const API_BASE = import.meta.env.VITE_CPP_API_URL || 'http://localhost:3001';

const injuryColors = {
  cardiac: '#ff2d55',
  stroke: '#ff6b8a',
  trauma: '#ffb800',
  accident: '#ff8c00',
  other: '#3d8fff',
};

const HospitalPage = () => {
  const { data: hospitals, refetch: refetchHospitals } = usePolling('hospitals');
  const { data: patients, refetch: refetchPatients } = usePolling('patients');
  const [healingLoading, setHealingLoading] = useState({});
  const [rebalanceLoading, setRebalanceLoading] = useState({});
  const [lastDpResult, setLastDpResult] = useState(null);
  const [expandedHospital, setExpandedHospital] = useState(null);

  // Compute summary stats
  const summaryStats = useMemo(() => {
    const totalBeds = hospitals.reduce((s, h) => s + (h.beds_available || 0), 0);
    const icuBeds = hospitals.reduce((s, h) => s + (h.icu_beds_available || 0), 0);
    const admittedPatients = patients.filter(p => p.status !== 'discharged').length;
    const totalBedCapacity = hospitals.reduce((s, h) => s + (h.beds_total || 0), 0);
    const occupancy = totalBedCapacity > 0 ? Math.round(((totalBedCapacity - totalBeds) / totalBedCapacity) * 100) : 0;

    return [
      { label: 'Total Beds Available', value: totalBeds, color: '#3d8fff' },
      { label: 'ICU Beds Available', value: icuBeds, color: '#ff2d55' },
      { label: 'Patients Admitted', value: admittedPatients, color: '#39ff8f' },
      { label: 'Avg Occupancy %', value: occupancy, suffix: '%', color: '#ffb800' },
    ];
  }, [hospitals, patients]);

  // Get patients for a specific hospital
  const getHospitalPatients = (hospital) => {
    return patients.filter(
      p => p.hospital_id === hospital.map_node_id && p.status !== 'discharged'
    );
  };

  // Run healing tick
  const handleHealingTick = async (hospitalId) => {
    setHealingLoading(prev => ({ ...prev, [hospitalId]: true }));
    try {
      await fetch(`${API_BASE}/api/healing-tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId }),
      });
      refetchHospitals();
      refetchPatients();
    } catch (err) {
      console.error('[NEXUS] Healing tick failed:', err);
    } finally {
      setHealingLoading(prev => ({ ...prev, [hospitalId]: false }));
    }
  };

  // Run ward knapsack rebalance
  const handleRebalance = async (hospitalId) => {
    setRebalanceLoading(prev => ({ ...prev, [hospitalId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/ward-knapsack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId }),
      });
      const data = await res.json();
      setLastDpResult(data);
      setExpandedHospital(hospitalId);
      refetchHospitals();
      refetchPatients();
    } catch (err) {
      console.error('[NEXUS] Rebalance failed:', err);
    } finally {
      setRebalanceLoading(prev => ({ ...prev, [hospitalId]: false }));
    }
  };

  return (
    <section className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🏥</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              <span className="text-white">Hospital</span>{' '}
              <span className="neon-text">Management</span>
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
            Ward Management • ICU Allocation • 0/1 Knapsack Dynamic Programming
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryStats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-5 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold" style={{ color: stat.color }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} duration={1.5} />
              </div>
              <div className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hospital Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {hospitals.map((hospital, idx) => {
            const hPatients = getHospitalPatients(hospital);
            const icuPatients = hPatients.filter(p => p.ward === 'icu');
            const generalPatients = hPatients.filter(p => p.ward === 'general');
            const icuOccupied = (hospital.icu_beds_total || 0) - (hospital.icu_beds_available || 0);
            const generalOccupied = (hospital.beds_total || 0) - (hospital.beds_available || 0) - icuOccupied;
            const isExpanded = expandedHospital === hospital.map_node_id;

            return (
              <motion.div
                key={hospital.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassPanel className="h-full">
                  {/* Hospital Name */}
                  <div className="flex items-start gap-2 mb-3 pb-3 border-b border-white/5">
                    <span className="text-xl">🏥</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-heading font-bold text-white truncate">{hospital.name}</h3>
                      <div className="text-[10px] font-mono text-white/40">{hospital.location}</div>
                    </div>
                  </div>

                  {/* Ward Status */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-mono text-white/50 uppercase mb-1">General Ward</div>
                      <ProgressBar
                        value={Math.max(0, generalOccupied)}
                        max={hospital.beds_total || 1}
                        label={`${hospital.beds_available || 0}/${hospital.beds_total || 0}`}
                        variant="blue"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-white/50 uppercase mb-1">ICU Ward</div>
                      <ProgressBar
                        value={icuOccupied}
                        max={hospital.icu_beds_total || 1}
                        label={`${hospital.icu_beds_available || 0}/${hospital.icu_beds_total || 0}`}
                        variant="danger"
                      />
                    </div>
                  </div>

                  {/* Patients */}
                  <div className="mb-3 pb-3 border-b border-white/5">
                    <div className="text-[10px] font-mono text-white/50 uppercase mb-2">
                      Current Patients: {hPatients.length}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {hPatients.slice(0, 8).map(p => (
                        <div
                          key={p.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-mono border"
                          style={{
                            borderColor: `${injuryColors[p.injury_type] || '#3d8fff'}30`,
                            background: `${injuryColors[p.injury_type] || '#3d8fff'}08`,
                            color: injuryColors[p.injury_type] || '#3d8fff',
                          }}
                        >
                          <span className="capitalize">{p.injury_type}</span>
                          <span className="font-bold">S{p.severity}</span>
                          <span className={`px-1 rounded text-[8px] font-bold ${
                            p.ward === 'icu' ? 'bg-[#ff2d55]/20 text-[#ff2d55]' : 'bg-[#3d8fff]/20 text-[#3d8fff]'
                          }`}>
                            {p.ward === 'icu' ? 'ICU' : 'GEN'}
                          </span>
                          <span className="text-white/30">D{p.days_admitted || 0}</span>
                        </div>
                      ))}
                      {hPatients.length > 8 && (
                        <div className="px-2 py-1 text-[9px] font-mono text-white/30">
                          +{hPatients.length - 8} more
                        </div>
                      )}
                      {hPatients.length === 0 && (
                        <div className="text-[10px] font-mono text-white/20 py-2">No patients admitted</div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <NeonButton
                      onClick={() => handleHealingTick(hospital.map_node_id)}
                      variant="neon"
                      size="sm"
                      className="flex-1 text-[10px]"
                      loading={healingLoading[hospital.map_node_id]}
                    >
                      ⏱ Healing Tick
                    </NeonButton>
                    <NeonButton
                      onClick={() => handleRebalance(hospital.map_node_id)}
                      variant="blue"
                      size="sm"
                      className="flex-1 text-[10px]"
                      loading={rebalanceLoading[hospital.map_node_id]}
                    >
                      ⚖ Rebalance ICU
                    </NeonButton>
                  </div>

                  {/* Expanded rebalance result */}
                  <AnimatePresence>
                    {isExpanded && lastDpResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-white/5"
                      >
                        <div className="text-[10px] font-mono text-[#39ff8f] mb-1">
                          ICU: {lastDpResult.icu_admitted?.length || 0} patients |
                          General: {lastDpResult.general_ward?.length || 0} |
                          Severity served: {lastDpResult.total_severity_served || 0}
                        </div>
                        {lastDpResult.evicted_from_icu?.length > 0 && (
                          <div className="text-[10px] font-mono text-[#ffb800]">
                            ⚠ Evicted from ICU: {lastDpResult.evicted_from_icu.length} patient(s)
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>

        {/* Knapsack Explainer Panel */}
        <GlassPanel className="mb-8">
          <h3 className="text-sm font-mono text-[#39ff8f] mb-4 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
            How ICU Allocation Works — 0/1 Knapsack DP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-mono text-white/70 leading-6 space-y-3">
                <p>
                  Each patient has a <span className="text-[#3d8fff] font-bold">severity score</span> (profit) 
                  and an injury-specific <span className="text-[#ffb800] font-bold">resource weight</span>.
                </p>
                <p>
                  The ICU has a fixed <span className="text-[#ff2d55] font-bold">resource capacity</span> (= ICU beds × 2 units).
                </p>
                <p>
                  The <span className="text-[#39ff8f] font-bold">0/1 Knapsack DP</span> finds the subset of patients 
                  that maximizes total severity served without exceeding ICU resource capacity.
                </p>
                <p className="text-white/40 text-xs">
                  When a new patient arrives or a patient heals, the DP table is recomputed 
                  and patients may be moved between wards.
                </p>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-white/50 uppercase mb-2">Injury Type Table</div>
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="text-white/40">
                      <th className="text-left py-1">Type</th>
                      <th className="text-center py-1">Heal Days</th>
                      <th className="text-center py-1">Weight</th>
                      <th className="text-center py-1">Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Cardiac', 7, 3, 2],
                      ['Stroke', 10, 3, 2],
                      ['Trauma', 5, 2, 1],
                      ['Accident', 6, 2, 1],
                      ['Other', 3, 1, 0],
                    ].map(([type, days, weight, bonus]) => (
                      <tr key={type} className="border-t border-white/5">
                        <td className="py-1 text-white/70">{type}</td>
                        <td className="py-1 text-center text-[#3d8fff]">{days}</td>
                        <td className="py-1 text-center text-[#ffb800]">{weight}</td>
                        <td className="py-1 text-center text-[#39ff8f]">+{bonus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              {/* Last DP result */}
              {lastDpResult && lastDpResult.dp_table_snapshot ? (
                <div>
                  <div className="text-[10px] font-mono text-[#ffb800] uppercase mb-2">
                    Last DP Table Snapshot
                  </div>
                  <div className="overflow-x-auto max-h-48 overflow-y-auto rounded border border-white/10 mb-3">
                    <table className="text-[9px] font-mono">
                      <tbody>
                        {lastDpResult.dp_table_snapshot.slice(0, 15).map((row, i) => (
                          <tr key={i}>
                            {(Array.isArray(row) ? row : []).slice(0, 25).map((cell, j) => (
                              <td
                                key={j}
                                className={`px-1 py-0.5 border border-white/5 text-center ${
                                  cell > 0 ? 'text-[#39ff8f] bg-[#39ff8f]/5' : 'text-white/15'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="text-[#39ff8f]">
                      Total severity served: {lastDpResult.total_severity_served}
                    </div>
                    <div className="text-[#3d8fff]">
                      ICU admitted: {lastDpResult.icu_admitted?.length || 0} patients
                    </div>
                    <div className="text-white/50">
                      General ward: {lastDpResult.general_ward?.length || 0} patients
                    </div>
                    {lastDpResult.evicted_from_icu?.length > 0 && (
                      <div className="text-[#ffb800]">
                        ⚠ Evicted from ICU: {lastDpResult.evicted_from_icu.length}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/20 font-mono text-sm">
                  <div className="text-center">
                    <div className="text-4xl mb-3">⚖️</div>
                    <div>Click "Rebalance ICU" on any hospital</div>
                    <div className="text-[10px] mt-1">to see the DP table result here</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassPanel>
      </div>
    </section>
  );
};

export default HospitalPage;
