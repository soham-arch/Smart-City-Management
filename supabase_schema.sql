-- ═══════════════════════════════════════════
-- NEXUS Smart City EMS — Supabase Schema
-- Run this FIRST in the Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_name text NOT NULL,
  map_node_id text NOT NULL,
  beds_total integer DEFAULT 0,
  beds_available integer DEFAULT 0,
  icu_beds_total integer DEFAULT 0,
  icu_beds_available integer DEFAULT 0,
  ambulances_stationed integer DEFAULT 0,
  ambulances_available integer DEFAULT 0,
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now()
);

-- Police Stations table
CREATE TABLE IF NOT EXISTS police_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_name text,
  map_node_id text,
  units_total integer DEFAULT 0,
  units_available integer DEFAULT 0,
  officers_total integer DEFAULT 0,
  officers_on_duty integer DEFAULT 0,
  response_vehicles integer DEFAULT 0,
  vehicles_available integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Fire Stations table
CREATE TABLE IF NOT EXISTS fire_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_name text,
  map_node_id text,
  trucks_total integer DEFAULT 0,
  trucks_available integer DEFAULT 0,
  firefighters_total integer DEFAULT 0,
  firefighters_on_duty integer DEFAULT 0,
  water_tankers_total integer DEFAULT 0,
  water_tankers_available integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text CHECK (type IN ('ambulance', 'police', 'fire')),
  location_name text,
  map_node_id text,
  severity integer,
  priority_score integer,
  route jsonb,
  route_distance_km numeric,
  eta text,
  resources_allocated jsonb,
  algorithm_used text,
  status text DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'en_route', 'resolved')),
  response_time_seconds integer,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text CHECK (service_type IN ('ambulance', 'police', 'fire')),
  unit_name text,
  status text DEFAULT 'available',
  incident_id uuid REFERENCES incidents(id),
  station_id uuid,
  created_at timestamptz DEFAULT now()
);

-- System Status table
CREATE TABLE IF NOT EXISTS system_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text DEFAULT 'all_clear' CHECK (status IN ('all_clear', 'active_emergency', 'critical')),
  active_incident_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Map Nodes table
CREATE TABLE IF NOT EXISTS map_nodes (
  id text PRIMARY KEY,
  label text,
  type text CHECK (type IN ('incident', 'hospital', 'police_station', 'fire_station', 'junction')),
  x numeric,
  y numeric,
  service_id uuid
);

-- Map Edges table
CREATE TABLE IF NOT EXISTS map_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node text REFERENCES map_nodes(id),
  to_node text REFERENCES map_nodes(id),
  distance_km numeric,
  road_name text
);

-- ═══════════════════════════════════════════
-- Enable Row Level Security (allow all for anon for now)
-- ═══════════════════════════════════════════
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE police_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_edges ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write on all tables (for demo purposes)
CREATE POLICY "Allow all on hospitals" ON hospitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on police_stations" ON police_stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fire_stations" ON fire_stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on units" ON units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on system_status" ON system_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on map_nodes" ON map_nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on map_edges" ON map_edges FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════
-- Enable Realtime publication
-- ═══════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE police_stations;
ALTER PUBLICATION supabase_realtime ADD TABLE fire_stations;
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE system_status;
