/**
 * @FILE: PublicPortalLayout.jsx
 * @RESPONSIBILITY: Clean, distraction-free layout for unauthenticated or public student-facing portals.
 * @DEPENDENCIES: react, react-router-dom.
 * @MODIFICATION_HOTSPOT: Header branding and portal container styles.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const PublicPortalLayout = () => {
  return (
    <div
      data-component="PublicPortalLayout"
      data-purpose="public-student-portal"
      className="min-h-screen bg-slate-50 flex flex-col font-sans"
    >
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-odoo-primary flex items-center justify-center text-white font-bold text-xs shadow-xs">
            CS
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-800 tracking-tight">ClubSphere</h1>
            <p className="text-2xs text-slate-500">Skyline Student Association</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-medium text-odoo-primary hover:text-odoo-plumLight transition-colors"
          >
            ERP Sign In
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Outlet />
      </main>

      <footer className="py-4 text-center text-2xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 Skyline Student Association • ClubSphere Enterprise Platform
      </footer>
    </div>
  );
};

export default PublicPortalLayout;

