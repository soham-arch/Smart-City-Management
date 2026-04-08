/**
 * db.js — JSONL File-Based Database Engine
 *
 * This module provides a simple database layer using JSONL (JSON Lines) text files.
 * Each "table" is a .txt file in the server/db/ directory where each line = one JSON row.
 *
 * TABLES (auto-created on startup):
 *   hospitals.txt       — Hospital records (beds, ICU, ambulances)
 *   incidents.txt       — Dispatch incidents (ambulance, fire, police)
 *   patients.txt        — Patient records (ward, severity, healing status)
 *   wards.txt           — Ward knapsack snapshots (ICU allocation results)
 *   police_stations.txt — Police station data
 *   patrol_units.txt    — Individual patrol unit assignments
 *   crime_queue.txt     — Crime priority queue entries
 *   crime_incidents.txt — Resolved crime incident history
 *   fire_stations.txt   — Fire station data
 *
 * Each row gets an auto-generated ID (timestamp + random) and created_at timestamp.
 *
 * FUNCTIONS:
 *   readTable(name)         — Read all rows from a table as an array
 *   writeTable(name, rows)  — Overwrite entire table with new rows
 *   insertRow(name, obj)    — Append a new row with auto-ID
 *   updateRow(name, id, patch) — Merge fields into an existing row
 *   deleteRow(name, id)     — Remove a row by ID
 */
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'db');

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Ensure all table files exist
const TABLES = ['hospitals', 'incidents', 'patients', 'wards', 'police_stations', 'patrol_units', 'crime_queue', 'crime_incidents', 'fire_stations'];
TABLES.forEach((table) => {
  const filePath = path.join(DB_DIR, `${table}.txt`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf-8');
  }
});

function getTablePath(tableName) {
  return path.join(DB_DIR, `${tableName}.txt`);
}

/**
 * Read all rows from a JSONL table file
 * @param {string} tableName - Table name (without .txt)
 * @returns {Array} Array of parsed JSON objects
 */
function readTable(tableName) {
  const filePath = getTablePath(tableName);
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8').trim();
  if (!content) return [];

  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.warn(`[DB] Skipping malformed line in ${tableName}:`, line);
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Write an entire array of rows to a JSONL table file
 * @param {string} tableName - Table name (without .txt)
 * @param {Array} rows - Array of objects to write
 */
function writeTable(tableName, rows) {
  const filePath = getTablePath(tableName);
  const content = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, content ? content + '\n' : '', 'utf-8');
}

/**
 * Insert a single row into a table with auto-generated id and created_at
 * @param {string} tableName - Table name (without .txt)
 * @param {object} obj - Object to insert
 * @returns {object} The inserted row (with id and created_at)
 */
function insertRow(tableName, obj) {
  const rows = readTable(tableName);
  const newRow = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...obj,
    created_at: obj.created_at || new Date().toISOString(),
  };
  rows.push(newRow);
  writeTable(tableName, rows);
  return newRow;
}

/**
 * Update a single row by id, merging a patch object
 * @param {string} tableName - Table name (without .txt)
 * @param {string} id - Row ID to update
 * @param {object} patch - Fields to merge into the row
 * @returns {object|null} The updated row, or null if not found
 */
function updateRow(tableName, id, patch) {
  const rows = readTable(tableName);
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;

  rows[index] = { ...rows[index], ...patch };
  writeTable(tableName, rows);
  return rows[index];
}

/**
 * Delete a single row by id
 * @param {string} tableName - Table name (without .txt)
 * @param {string} id - Row ID to delete
 * @returns {boolean} True if row was found and deleted
 */
function deleteRow(tableName, id) {
  const rows = readTable(tableName);
  const filtered = rows.filter((row) => row.id !== id);
  if (filtered.length === rows.length) return false;

  writeTable(tableName, filtered);
  return true;
}

module.exports = {
  DB_DIR,
  readTable,
  writeTable,
  insertRow,
  updateRow,
  deleteRow,
  getTablePath,
};
