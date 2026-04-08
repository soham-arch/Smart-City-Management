/**
 * puneNodes.js — City Map Node Definitions
 *
 * Defines all nodes on the Pune city graph used for SVG map rendering.
 * Each node has: id, label, type (incident/hospital/police_station/fire_station/junction), x, y.
 *
 * Node types:
 *   - incident        — User-selectable emergency locations (15 locations)
 *   - hospital        — Hospital nodes linked to hospital DB records (10 hospitals)
 *   - police_station  — Police station nodes (10 stations)
 *   - fire_station    — Fire station nodes (7 stations)
 *   - junction        — Non-selectable road intersections for routing
 *
 * Coordinate system: SVG viewBox 0 0 1400 900
 * This data is used by: NodeMap component, all dispatch pages, puneEdges.js
 */
export const puneNodes = [
  // ── Incident / Landmark Nodes ──
  { id: 'bhugaon', label: 'Bhugaon', type: 'incident', x: 70, y: 480 },
  { id: 'bavdhan', label: 'Bavdhan', type: 'incident', x: 120, y: 300 },
  { id: 'lavale', label: 'Lavale', type: 'incident', x: 220, y: 140 },
  { id: 'paud_road', label: 'Paud Road', type: 'incident', x: 170, y: 410 },
  { id: 'chandni_chowk', label: 'Chandni Chowk', type: 'incident', x: 340, y: 340 },
  { id: 'kothrud_depot', label: 'Kothrud Depot', type: 'incident', x: 400, y: 430 },
  { id: 'karve_nagar', label: 'Karve Nagar', type: 'incident', x: 450, y: 540 },
  { id: 'warje', label: 'Warje', type: 'incident', x: 280, y: 600 },
  { id: 'erandwane', label: 'Erandwane', type: 'incident', x: 580, y: 320 },
  { id: 'deccan', label: 'Deccan Gymkhana', type: 'incident', x: 660, y: 380 },
  { id: 'shivajinagar', label: 'Shivajinagar', type: 'incident', x: 760, y: 280 },
  { id: 'baner', label: 'Baner', type: 'incident', x: 600, y: 140 },
  { id: 'swargate', label: 'Swargate', type: 'incident', x: 740, y: 530 },
  { id: 'katraj', label: 'Katraj', type: 'incident', x: 720, y: 700 },
  { id: 'hadapsar', label: 'Hadapsar', type: 'incident', x: 1020, y: 540 },

  // ── Junction Nodes (intermediate, non-selectable) ──
  { id: 'mumbai_highway', label: 'Mumbai-Hwy Jn', type: 'junction', x: 150, y: 200 },
  { id: 'paud_rd_junction', label: 'Paud Rd Jn', type: 'junction', x: 260, y: 350 },
  { id: 'symbiosis_jn', label: 'Symbiosis Jn', type: 'junction', x: 370, y: 230 },
  { id: 'karve_road', label: 'Karve Road Jn', type: 'junction', x: 560, y: 460 },
  { id: 'university_road', label: 'University Rd Jn', type: 'junction', x: 700, y: 220 },

  // ── Hospital Nodes ──
  { id: 'aditya_birla', label: 'Aditya Birla Hospital', type: 'hospital', x: 160, y: 90 },
  { id: 'symbiosis_hospital', label: 'Symbiosis Hospital', type: 'hospital', x: 320, y: 140 },
  { id: 'jupiter_baner', label: 'Jupiter Hospital', type: 'hospital', x: 640, y: 70 },
  { id: 'ruby_hall', label: 'Ruby Hall Clinic', type: 'hospital', x: 860, y: 230 },
  { id: 'deenanath', label: 'Deenanath Mangeshkar', type: 'hospital', x: 620, y: 250 },
  { id: 'sahyadri_kothrud', label: 'Sahyadri Hospital', type: 'hospital', x: 440, y: 350 },
  { id: 'poona_hospital', label: 'Poona Hospital', type: 'hospital', x: 700, y: 440 },
  { id: 'kem_hospital', label: 'KEM Hospital', type: 'hospital', x: 830, y: 430 },
  { id: 'jehangir', label: 'Jehangir Hospital', type: 'hospital', x: 840, y: 540 },
  { id: 'noble_hadapsar', label: 'Noble Hospital', type: 'hospital', x: 1080, y: 480 },

  // ── Police Station Nodes ──
  { id: 'kothrud_ps', label: 'Kothrud PS', type: 'police_station', x: 420, y: 500 },
  { id: 'deccan_ps', label: 'Deccan PS', type: 'police_station', x: 660, y: 310 },
  { id: 'swargate_ps', label: 'Swargate PS', type: 'police_station', x: 760, y: 600 },
  { id: 'shivajinagar_ps', label: 'Shivajinagar PS', type: 'police_station', x: 820, y: 310 },
  { id: 'warje_ps', label: 'Warje PS', type: 'police_station', x: 260, y: 670 },
  { id: 'chandni_ps', label: 'Chandni Chowk PS', type: 'police_station', x: 360, y: 270 },
  { id: 'bavdhan_ps', label: 'Bavdhan PS', type: 'police_station', x: 80, y: 370 },
  { id: 'katraj_ps', label: 'Katraj PS', type: 'police_station', x: 730, y: 770 },
  { id: 'hadapsar_ps', label: 'Hadapsar PS', type: 'police_station', x: 1040, y: 610 },
  { id: 'karvenagar_ps', label: 'Karve Nagar PS', type: 'police_station', x: 470, y: 610 },

  // ── Fire Station Nodes ──
  { id: 'karvenagar_fs', label: 'Karve Nagar FS', type: 'fire_station', x: 500, y: 530 },
  { id: 'kothrud_fs', label: 'Kothrud FS', type: 'fire_station', x: 360, y: 420 },
  { id: 'swargate_fs', label: 'Swargate FS', type: 'fire_station', x: 790, y: 530 },
  { id: 'shivajinagar_fs', label: 'Shivajinagar FS', type: 'fire_station', x: 780, y: 210 },
  { id: 'hadapsar_fs', label: 'Hadapsar FS', type: 'fire_station', x: 1080, y: 560 },
  { id: 'baner_fs', label: 'Baner FS', type: 'fire_station', x: 560, y: 100 },
  { id: 'katraj_fs', label: 'Katraj FS', type: 'fire_station', x: 680, y: 760 },
];

// Helper: get nodes by type
export const getNodesByType = (type) => puneNodes.filter(n => n.type === type);
export const hospitalNodes = getNodesByType('hospital');
export const policeStationNodes = getNodesByType('police_station');
export const fireStationNodes = getNodesByType('fire_station');
export const incidentNodes = getNodesByType('incident');
export const junctionNodes = getNodesByType('junction');

// Build a lookup map by id
export const nodeMap = {};
puneNodes.forEach(n => { nodeMap[n.id] = n; });

export default puneNodes;
