# Smart City Management

This project is a Smart City emergency response simulator built with React on the frontend and a Node/Express dispatch layer on the backend.

The important part of the project is now the algorithm pipeline:

- Ambulance dispatch uses C++ Dijkstra for shortest paths and C++ Knapsack for hospital selection.
- Fire dispatch uses C++ Dijkstra for route discovery and C++ Knapsack for station/resource selection.
- Police dispatch uses C++ Dijkstra for path computation and C++ sorting for nearest-station ordering.
- Priority scoring uses a native C++ priority computation executable.

## Project Structure

- `src/pages/` contains the main application screens.
- `src/components/` contains shared UI building blocks.
- `src/algorithms/` contains the JavaScript fallback logic only.
- `src/lib/` contains shared frontend helpers and the local storage shim.
- `server/cppServer.js` contains the backend orchestration that calls the native C++ programs.
- `cpp/native/` contains the active C++ implementations.
- `server/bin/` contains compiled native executables generated from the C++ files.

Unused WASM bridge files, sample/demo folders, duplicate project folders, and the legacy server entrypoint were removed so the structure now matches the actual runtime flow.

## How It Works

1. The React page collects emergency input.
2. The page sends the graph and service data to the backend API.
3. The backend runs the matching C++ executable for the algorithm step.
4. The backend returns the selected route, station, or hospital to the UI.
5. The UI renders the result and sends incident updates to the local backend.

This gives the project a clean explanation for viva or demo:

- Frontend for visualization
- Backend for orchestration
- C++ for the actual algorithm execution

## Run Locally

Install frontend dependencies at the root and backend dependencies in `server/`.

Compile the native C++ executables:

```bash
npm run build:cpp-native
```

Start the backend:

```bash
cd server
npm start
```

Start the frontend:

```bash
npm run dev
```

The frontend expects the C++ API server at `http://localhost:3001`.
