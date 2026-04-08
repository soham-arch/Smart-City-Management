// supabase.js — REMOVED
// This project no longer uses Supabase.
// All data is managed via local .txt file database through the Express server.
// See: src/hooks/usePolling.js and server/db.js

const noop = () => ({
  select: () => noop(),
  insert: () => Promise.resolve({ data: null, error: null }),
  update: () => Promise.resolve({ data: null, error: null }),
  delete: () => Promise.resolve({ data: null, error: null }),
  eq: () => noop(),
  filter: () => noop(),
  order: () => noop(),
  limit: () => noop(),
  single: () => Promise.resolve({ data: null, error: null }),
  then: (cb) => Promise.resolve({ data: [], error: null }).then(cb),
});

const supabase = {
  from: () => noop(),
  channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  removeChannel: () => {},
};

export default supabase;
