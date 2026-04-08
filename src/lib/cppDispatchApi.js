/**
 * cppDispatchApi.js — Frontend API client for the C++ dispatch server
 *
 * Provides named functions for calling each dispatch endpoint on the Express backend.
 * All functions return Promises that resolve to JSON responses from the server.
 *
 * Functions:
 *   requestAmbulanceDispatch(payload)  → POST /api/ambulance-dispatch
 *   requestFireDispatch(payload)       → POST /api/fire-dispatch
 *   requestPoliceDispatch(payload)     → POST /api/police-dispatch
 *   requestCrimeQueueInsert(payload)   → POST /api/crime-queue/insert
 *   fetchCrimeQueue()                  → GET  /api/crime-queue
 *   resolveCrime(crimeId, edges)       → POST /api/crime-queue/resolve/:id
 *   fetchCrimeTypes()                  → GET  /api/crime-types
 */
const API_BASE_URL = import.meta.env.VITE_CPP_API_URL || 'http://localhost:3001';

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

export function requestAmbulanceDispatch(payload) {
  return postJson('/api/ambulance-dispatch', payload);
}

export function requestFireDispatch(payload) {
  return postJson('/api/fire-dispatch', payload);
}

export function requestPoliceDispatch(payload) {
  return postJson('/api/police-dispatch', payload);
}

export function requestCrimeQueueInsert(payload) {
  return postJson('/api/crime-queue/insert', payload);
}

export function fetchCrimeQueue() {
  return getJson('/api/crime-queue');
}

export function resolveCrime(crimeId, edges) {
  return postJson(`/api/crime-queue/resolve/${crimeId}`, { edges });
}

export function fetchCrimeTypes() {
  return getJson('/api/crime-types');
}
