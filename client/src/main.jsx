/**
 * @file main.jsx
 * @module root
 * @description React 19 DOM entry-point. Mounts the application root with
 *              StrictMode enabled and global Tailwind theme stylesheet.
 * @author Garima Mittal
 */

import { StrictMode }   from 'react';
import { createRoot }   from 'react-dom/client';
import './assets/theme.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

