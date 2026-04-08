/**
 * main.jsx — Application Entry Point
 *
 * Mounts the React app into the DOM. Wraps the App component with:
 *   - StrictMode for development warnings
 *   - ErrorBoundary for crash safety
 *   - BrowserRouter for client-side routing
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
