// Pune map nodes with SVG coordinates for viewBox 0 0 900 600
// These are used as hardcoded fallback when Supabase is not available

export const puneNodes = [
  // ── Incident / Landmark Nodes ──
  { id: 'kothrud_depot', label: 'Kothrud Depot', type: 'incident', x: 280, y: 300 },
  { id: 'bhumgaon', label: 'Bhumgaon', type: 'incident', x: 160, y: 340 },
  { id: 'chandni_chowk', label: 'Chandni Chowk', type: 'incident', x: 320, y: 260 },
  { id: 'warje', label: 'Warje', type: 'incident', x: 230, y: 380 },
  { id: 'paud_road', label: 'Paud Road', type: 'incident', x: 200, y: 280 },
  { id: 'karve_nagar', label: 'Karve Nagar', type: 'incident', x: 310, y: 350 },
  { id: 'bavdhan', label: 'Bavdhan', type: 'incident', x: 140, y: 270 },
  { id: 'shivajinagar', label: 'Shivajinagar', type: 'incident', x: 490, y: 220 },
  { id: 'deccan', label: 'Deccan Gymkhana', type: 'incident', x: 450, y: 280 },
  { id: 'swargate', label: 'Swargate', type: 'incident', x: 500, y: 360 },
  { id: 'katraj', label: 'Katraj', type: 'incident', x: 480, y: 450 },
  { id: 'hadapsar', label: 'Hadapsar', type: 'incident', x: 640, y: 380 },
  { id: 'erandwane', label: 'Erandwane', type: 'incident', x: 400, y: 270 },
  { id: 'baner', label: 'Baner', type: 'incident', x: 380, y: 150 },
  { id: 'lavale', label: 'Lavale', type: 'incident', x: 240, y: 160 },

  // ── Junction Nodes (intermediate, non-selectable) ──
  { id: 'paud_rd_junction', label: 'Paud Rd Junction', type: 'junction', x: 260, y: 240 },
  { id: 'karve_road', label: 'Karve Road', type: 'junction', x: 380, y: 310 },
  { id: 'university_road', label: 'University Road', type: 'junction', x: 460, y: 200 },
  { id: 'symbiosis_jn', label: 'Symbiosis Junction', type: 'junction', x: 340, y: 200 },
  { id: 'mumbai_highway', label: 'Mumbai-Bangalore Hwy', type: 'junction', x: 180, y: 200 },

  // ── Hospital Nodes ──
  { id: 'ruby_hall', label: 'Ruby Hall Clinic', type: 'hospital', x: 500, y: 210 },
  { id: 'kem_hospital', label: 'KEM Hospital', type: 'hospital', x: 540, y: 310 },
  { id: 'sahyadri_kothrud', label: 'Sahyadri Hospital', type: 'hospital', x: 300, y: 320 },
  { id: 'deenanath', label: 'Deenanath Mangeshkar', type: 'hospital', x: 420, y: 260 },
  { id: 'jupiter_baner', label: 'Jupiter Hospital', type: 'hospital', x: 400, y: 140 },
  { id: 'aditya_birla', label: 'Aditya Birla Hospital', type: 'hospital', x: 180, y: 120 },
  { id: 'poona_hospital', label: 'Poona Hospital', type: 'hospital', x: 470, y: 300 },
  { id: 'jehangir', label: 'Jehangir Hospital', type: 'hospital', x: 520, y: 340 },
  { id: 'noble_hadapsar', label: 'Noble Hospital', type: 'hospital', x: 650, y: 370 },
  { id: 'symbiosis_hospital', label: 'Symbiosis Hospital', type: 'hospital', x: 250, y: 155 },

  // ── Police Station Nodes ──
  { id: 'kothrud_ps', label: 'Kothrud Police Stn', type: 'police_station', x: 270, y: 315 },
  { id: 'deccan_ps', label: 'Deccan Police Stn', type: 'police_station', x: 445, y: 285 },
  { id: 'swargate_ps', label: 'Swargate Police Stn', type: 'police_station', x: 505, y: 365 },
  { id: 'shivajinagar_ps', label: 'Shivajinagar Police Stn', type: 'police_station', x: 495, y: 215 },
  { id: 'warje_ps', label: 'Warje-Malwadi Police Stn', type: 'police_station', x: 225, y: 385 },
  { id: 'chandni_ps', label: 'Chandani Chowk Chowky', type: 'police_station', x: 325, y: 255 },
  { id: 'bavdhan_ps', label: 'Bavdhan Police Chowky', type: 'police_station', x: 135, y: 265 },
  { id: 'katraj_ps', label: 'Katraj Police Stn', type: 'police_station', x: 475, y: 455 },
  { id: 'hadapsar_ps', label: 'Hadapsar Police Stn', type: 'police_station', x: 645, y: 385 },
  { id: 'karvenagar_ps', label: 'Karve Nagar Chowky', type: 'police_station', x: 315, y: 355 },

  // ── Fire Station Nodes ──
  { id: 'karvenagar_fs', label: 'Karve Nagar Fire Stn', type: 'fire_station', x: 305, y: 345 },
  { id: 'kothrud_fs', label: 'Kothrud Fire Stn', type: 'fire_station', x: 275, y: 295 },
  { id: 'swargate_fs', label: 'Swargate Fire Stn', type: 'fire_station', x: 510, y: 355 },
  { id: 'shivajinagar_fs', label: 'Shivajinagar Fire Stn', type: 'fire_station', x: 485, y: 205 },
  { id: 'hadapsar_fs', label: 'Hadapsar Fire Stn', type: 'fire_station', x: 635, y: 375 },
  { id: 'baner_fs', label: 'Baner Fire Stn', type: 'fire_station', x: 390, y: 145 },
  { id: 'katraj_fs', label: 'Katraj Fire Stn', type: 'fire_station', x: 470, y: 445 },
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
