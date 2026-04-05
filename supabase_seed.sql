-- ═══════════════════════════════════════════
-- NEXUS Smart City EMS — Seed Data
-- Run this AFTER supabase_schema.sql
-- ═══════════════════════════════════════════

-- ── System Status ──
INSERT INTO system_status (status, active_incident_count) VALUES ('all_clear', 0);

-- ── Map Nodes (47 nodes) ──
INSERT INTO map_nodes (id, label, type, x, y) VALUES
  -- Incident / Landmark Nodes
  ('kothrud_depot', 'Kothrud Depot', 'incident', 280, 300),
  ('bhumgaon', 'Bhumgaon', 'incident', 160, 340),
  ('chandni_chowk', 'Chandni Chowk', 'incident', 320, 260),
  ('warje', 'Warje', 'incident', 230, 380),
  ('paud_road', 'Paud Road', 'incident', 200, 280),
  ('karve_nagar', 'Karve Nagar', 'incident', 310, 350),
  ('bavdhan', 'Bavdhan', 'incident', 140, 270),
  ('shivajinagar', 'Shivajinagar', 'incident', 490, 220),
  ('deccan', 'Deccan Gymkhana', 'incident', 450, 280),
  ('swargate', 'Swargate', 'incident', 500, 360),
  ('katraj', 'Katraj', 'incident', 480, 450),
  ('hadapsar', 'Hadapsar', 'incident', 640, 380),
  ('erandwane', 'Erandwane', 'incident', 400, 270),
  ('baner', 'Baner', 'incident', 380, 150),
  ('lavale', 'Lavale', 'incident', 240, 160),
  -- Junction Nodes
  ('paud_rd_junction', 'Paud Rd Junction', 'junction', 260, 240),
  ('karve_road', 'Karve Road', 'junction', 380, 310),
  ('university_road', 'University Road', 'junction', 460, 200),
  ('symbiosis_jn', 'Symbiosis Junction', 'junction', 340, 200),
  ('mumbai_highway', 'Mumbai-Bangalore Hwy', 'junction', 180, 200),
  -- Hospital Nodes
  ('ruby_hall', 'Ruby Hall Clinic', 'hospital', 500, 210),
  ('kem_hospital', 'KEM Hospital', 'hospital', 540, 310),
  ('sahyadri_kothrud', 'Sahyadri Hospital', 'hospital', 300, 320),
  ('deenanath', 'Deenanath Mangeshkar', 'hospital', 420, 260),
  ('jupiter_baner', 'Jupiter Hospital', 'hospital', 400, 140),
  ('aditya_birla', 'Aditya Birla Hospital', 'hospital', 180, 120),
  ('poona_hospital', 'Poona Hospital', 'hospital', 470, 300),
  ('jehangir', 'Jehangir Hospital', 'hospital', 520, 340),
  ('noble_hadapsar', 'Noble Hospital', 'hospital', 650, 370),
  ('symbiosis_hospital', 'Symbiosis Hospital', 'hospital', 250, 155),
  -- Police Station Nodes
  ('kothrud_ps', 'Kothrud Police Station', 'police_station', 270, 315),
  ('deccan_ps', 'Deccan Police Station', 'police_station', 445, 285),
  ('swargate_ps', 'Swargate Police Station', 'police_station', 505, 365),
  ('shivajinagar_ps', 'Shivajinagar Police Stn', 'police_station', 495, 215),
  ('warje_ps', 'Warje-Malwadi Police Stn', 'police_station', 225, 385),
  ('chandni_ps', 'Chandani Chowk Chowky', 'police_station', 325, 255),
  ('bavdhan_ps', 'Bavdhan Police Chowky', 'police_station', 135, 265),
  ('katraj_ps', 'Katraj Police Station', 'police_station', 475, 455),
  ('hadapsar_ps', 'Hadapsar Police Station', 'police_station', 645, 385),
  ('karvenagar_ps', 'Karve Nagar Chowky', 'police_station', 315, 355),
  -- Fire Station Nodes
  ('karvenagar_fs', 'Karve Nagar Fire Station', 'fire_station', 305, 345),
  ('kothrud_fs', 'Kothrud Fire Station', 'fire_station', 275, 295),
  ('swargate_fs', 'Swargate Fire Station', 'fire_station', 510, 355),
  ('shivajinagar_fs', 'Shivajinagar Fire Station', 'fire_station', 485, 205),
  ('hadapsar_fs', 'Hadapsar Fire Station', 'fire_station', 635, 375),
  ('baner_fs', 'Baner Fire Station', 'fire_station', 390, 145),
  ('katraj_fs', 'Katraj Fire Station', 'fire_station', 470, 445);

-- ── Map Edges (36 roads) ──
INSERT INTO map_edges (from_node, to_node, distance_km, road_name) VALUES
  ('bhumgaon', 'bavdhan', 2.1, 'Bhumgaon-Bavdhan Rd'),
  ('bavdhan', 'mumbai_highway', 3.4, 'Mumbai-Bangalore Hwy'),
  ('bavdhan', 'paud_road', 4.2, 'Paud Road'),
  ('paud_road', 'paud_rd_junction', 1.8, 'Paud Road'),
  ('paud_rd_junction', 'chandni_chowk', 1.2, 'Paud Road'),
  ('paud_rd_junction', 'lavale', 3.5, 'Lavale Road'),
  ('chandni_chowk', 'kothrud_depot', 2.3, 'Kothrud Main Road'),
  ('chandni_chowk', 'symbiosis_jn', 2.8, 'Chandni Chowk Road'),
  ('kothrud_depot', 'karve_nagar', 1.4, 'Karve Road'),
  ('kothrud_depot', 'sahyadri_kothrud', 0.6, 'Kothrud Road'),
  ('karve_nagar', 'warje', 2.2, 'Warje Road'),
  ('karve_nagar', 'karve_road', 1.1, 'Karve Road'),
  ('karve_road', 'erandwane', 1.5, 'Karve Road'),
  ('karve_road', 'deccan', 2.0, 'Karve Road'),
  ('karve_road', 'swargate', 3.2, 'Satara Road'),
  ('erandwane', 'deenanath', 0.5, 'Erandwane Road'),
  ('erandwane', 'deccan', 1.3, 'Law College Road'),
  ('deccan', 'shivajinagar', 2.1, 'Jangli Maharaj Road'),
  ('deccan', 'university_road', 1.6, 'University Road'),
  ('shivajinagar', 'ruby_hall', 0.8, 'Sassoon Road'),
  ('shivajinagar', 'university_road', 1.2, 'University Road'),
  ('university_road', 'baner', 4.0, 'Baner Road'),
  ('baner', 'jupiter_baner', 0.4, 'Baner Road'),
  ('baner', 'lavale', 3.2, 'Lavale-Baner Road'),
  ('symbiosis_jn', 'baner', 3.8, 'Symbiosis Road'),
  ('symbiosis_jn', 'deenanath', 3.1, 'Karve Road'),
  ('swargate', 'kem_hospital', 2.4, 'Nana Peth Road'),
  ('swargate', 'katraj', 4.5, 'Satara Road'),
  ('swargate', 'jehangir', 2.1, 'Sassoon Road'),
  ('katraj', 'hadapsar', 7.2, 'Katraj-Hadapsar Bypass'),
  ('hadapsar', 'noble_hadapsar', 0.5, 'Hadapsar Road'),
  ('kem_hospital', 'jehangir', 1.8, 'Sassoon Road'),
  ('kem_hospital', 'poona_hospital', 2.0, 'Sadashiv Peth Road'),
  ('mumbai_highway', 'aditya_birla', 5.1, 'Mumbai-Bangalore Hwy'),
  ('lavale', 'symbiosis_hospital', 1.2, 'Lavale Road'),
  ('warje', 'swargate', 4.8, 'Warje-Swargate Road');

-- ── Hospitals (10) ──
INSERT INTO hospitals (name, location_name, map_node_id, beds_total, beds_available, icu_beds_total, icu_beds_available, ambulances_stationed, ambulances_available) VALUES
  ('Ruby Hall Clinic', 'Shivajinagar', 'ruby_hall', 650, 142, 40, 8, 6, 4),
  ('KEM Hospital', 'Rasta Peth', 'kem_hospital', 1200, 310, 80, 18, 8, 5),
  ('Sahyadri Hospital Kothrud', 'Kothrud', 'sahyadri_kothrud', 350, 87, 28, 6, 4, 3),
  ('Deenanath Mangeshkar Hospital', 'Erandwane', 'deenanath', 750, 198, 60, 12, 7, 5),
  ('Jupiter Hospital', 'Baner', 'jupiter_baner', 300, 74, 20, 5, 3, 2),
  ('Aditya Birla Memorial Hospital', 'Chinchwad', 'aditya_birla', 650, 155, 50, 11, 5, 4),
  ('Poona Hospital', 'Sadashiv Peth', 'poona_hospital', 400, 93, 30, 7, 4, 3),
  ('Jehangir Hospital', 'Sassoon Road', 'jehangir', 550, 121, 45, 9, 6, 4),
  ('Noble Hospital', 'Hadapsar', 'noble_hadapsar', 280, 66, 18, 4, 3, 2),
  ('Symbiosis Hospital', 'Lavale', 'symbiosis_hospital', 200, 51, 14, 3, 2, 2);

-- ── Police Stations (10) ──
INSERT INTO police_stations (name, location_name, map_node_id, units_total, units_available, officers_total, officers_on_duty, response_vehicles, vehicles_available) VALUES
  ('Kothrud Police Station', 'Kothrud', 'kothrud_ps', 8, 5, 60, 38, 6, 4),
  ('Deccan Police Station', 'Deccan Gymkhana', 'deccan_ps', 10, 7, 75, 52, 8, 6),
  ('Swargate Police Station', 'Swargate', 'swargate_ps', 12, 8, 90, 61, 10, 7),
  ('Shivajinagar Police Station', 'Shivajinagar', 'shivajinagar_ps', 15, 11, 110, 78, 12, 9),
  ('Warje-Malwadi Police Station', 'Warje', 'warje_ps', 6, 4, 45, 30, 5, 3),
  ('Chandani Chowk Chowky', 'Chandni Chowk', 'chandni_ps', 4, 3, 28, 19, 3, 2),
  ('Bavdhan Police Chowky', 'Bavdhan', 'bavdhan_ps', 4, 2, 25, 16, 3, 2),
  ('Katraj Police Station', 'Katraj', 'katraj_ps', 7, 5, 52, 35, 6, 4),
  ('Hadapsar Police Station', 'Hadapsar', 'hadapsar_ps', 9, 6, 68, 46, 7, 5),
  ('Karve Nagar Chowky', 'Karve Nagar', 'karvenagar_ps', 5, 3, 35, 23, 4, 3);

-- ── Fire Stations (7) ──
INSERT INTO fire_stations (name, location_name, map_node_id, trucks_total, trucks_available, firefighters_total, firefighters_on_duty, water_tankers_total, water_tankers_available) VALUES
  ('Karve Nagar Fire Station', 'Karve Nagar', 'karvenagar_fs', 5, 3, 40, 26, 4, 3),
  ('Kothrud Fire Station', 'Kothrud', 'kothrud_fs', 4, 2, 32, 21, 3, 2),
  ('Swargate Fire Station', 'Swargate', 'swargate_fs', 6, 4, 48, 33, 5, 4),
  ('Shivajinagar Fire Station', 'Shivajinagar', 'shivajinagar_fs', 8, 6, 64, 44, 6, 5),
  ('Hadapsar Fire Station', 'Hadapsar', 'hadapsar_fs', 4, 3, 30, 20, 3, 2),
  ('Baner Fire Station', 'Baner', 'baner_fs', 3, 2, 24, 16, 2, 2),
  ('Katraj Fire Station', 'Katraj', 'katraj_fs', 4, 3, 32, 22, 3, 2);
