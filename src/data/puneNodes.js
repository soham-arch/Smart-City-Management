// Pune map nodes with SVG coordinates for viewBox 0 0 1100 750
// Corrected V2 coordinates — minimum 80px between adjacent nodes

export const puneNodes = [
  // ── Incident / Landmark Nodes ──
  { id: 'bhumgaon', label: 'Bhumgaon', type: 'incident', x: 80, y: 420 },
  { id: 'bavdhan', label: 'Bavdhan', type: 'incident', x: 110, y: 280 },
  { id: 'lavale', label: 'Lavale', type: 'incident', x: 200, y: 170 },
  { id: 'paud_road', label: 'Paud Road', type: 'incident', x: 160, y: 360 },
  { id: 'chandni_chowk', label: 'Chandni Chowk', type: 'incident', x: 300, y: 310 },
  { id: 'kothrud_depot', label: 'Kothrud Depot', type: 'incident', x: 340, y: 390 },
  { id: 'karve_nagar', label: 'Karve Nagar', type: 'incident', x: 380, y: 460 },
  { id: 'warje', label: 'Warje', type: 'incident', x: 260, y: 510 },
  { id: 'erandwane', label: 'Erandwane', type: 'incident', x: 480, y: 310 },
  { id: 'deccan', label: 'Deccan Gymkhana', type: 'incident', x: 530, y: 360 },
  { id: 'shivajinagar', label: 'Shivajinagar', type: 'incident', x: 600, y: 270 },
  { id: 'baner', label: 'Baner', type: 'incident', x: 500, y: 160 },
  { id: 'swargate', label: 'Swargate', type: 'incident', x: 590, y: 460 },
  { id: 'katraj', label: 'Katraj', type: 'incident', x: 580, y: 570 },
  { id: 'hadapsar', label: 'Hadapsar', type: 'incident', x: 780, y: 460 },

  // ── Junction Nodes (intermediate, non-selectable) ──
  { id: 'mumbai_highway', label: 'Mumbai-Hwy Jn', type: 'junction', x: 140, y: 210 },
  { id: 'paud_rd_junction', label: 'Paud Rd Jn', type: 'junction', x: 240, y: 310 },
  { id: 'symbiosis_jn', label: 'Symbiosis Jn', type: 'junction', x: 310, y: 220 },
  { id: 'karve_road', label: 'Karve Road Jn', type: 'junction', x: 460, y: 400 },
  { id: 'university_road', label: 'University Rd Jn', type: 'junction', x: 560, y: 240 },

  // ── Hospital Nodes ──
  { id: 'aditya_birla', label: 'Aditya Birla Hospital', type: 'hospital', x: 160, y: 120 },
  { id: 'symbiosis_hospital', label: 'Symbiosis Hospital', type: 'hospital', x: 290, y: 165 },
  { id: 'jupiter_baner', label: 'Jupiter Hospital', type: 'hospital', x: 520, y: 110 },
  { id: 'ruby_hall', label: 'Ruby Hall Clinic', type: 'hospital', x: 650, y: 240 },
  { id: 'deenanath', label: 'Deenanath Mangeshkar', type: 'hospital', x: 510, y: 270 },
  { id: 'sahyadri_kothrud', label: 'Sahyadri Hospital', type: 'hospital', x: 370, y: 350 },
  { id: 'poona_hospital', label: 'Poona Hospital', type: 'hospital', x: 560, y: 380 },
  { id: 'kem_hospital', label: 'KEM Hospital', type: 'hospital', x: 650, y: 390 },
  { id: 'jehangir', label: 'Jehangir Hospital', type: 'hospital', x: 660, y: 440 },
  { id: 'noble_hadapsar', label: 'Noble Hospital', type: 'hospital', x: 800, y: 430 },

  // ── Police Station Nodes ──
  { id: 'kothrud_ps', label: 'Kothrud Police Stn', type: 'police_station', x: 355, y: 405 },
  { id: 'deccan_ps', label: 'Deccan Police Stn', type: 'police_station', x: 540, y: 370 },
  { id: 'swargate_ps', label: 'Swargate Police Stn', type: 'police_station', x: 600, y: 470 },
  { id: 'shivajinagar_ps', label: 'Shivajinagar Police', type: 'police_station', x: 610, y: 260 },
  { id: 'warje_ps', label: 'Warje-Malwadi Police', type: 'police_station', x: 250, y: 525 },
  { id: 'chandni_ps', label: 'Chandni Chowk Chowky', type: 'police_station', x: 310, y: 295 },
  { id: 'bavdhan_ps', label: 'Bavdhan Police', type: 'police_station', x: 100, y: 290 },
  { id: 'katraj_ps', label: 'Katraj Police Stn', type: 'police_station', x: 590, y: 580 },
  { id: 'hadapsar_ps', label: 'Hadapsar Police Stn', type: 'police_station', x: 790, y: 470 },
  { id: 'karvenagar_ps', label: 'Karve Nagar Chowky', type: 'police_station', x: 390, y: 475 },

  // ── Fire Station Nodes ──
  { id: 'karvenagar_fs', label: 'Karve Nagar Fire Stn', type: 'fire_station', x: 400, y: 450 },
  { id: 'kothrud_fs', label: 'Kothrud Fire Stn', type: 'fire_station', x: 330, y: 375 },
  { id: 'swargate_fs', label: 'Swargate Fire Stn', type: 'fire_station', x: 615, y: 455 },
  { id: 'shivajinagar_fs', label: 'Shivajinagar Fire Stn', type: 'fire_station', x: 625, y: 255 },
  { id: 'hadapsar_fs', label: 'Hadapsar Fire Stn', type: 'fire_station', x: 810, y: 450 },
  { id: 'baner_fs', label: 'Baner Fire Stn', type: 'fire_station', x: 510, y: 145 },
  { id: 'katraj_fs', label: 'Katraj Fire Stn', type: 'fire_station', x: 565, y: 560 },
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
