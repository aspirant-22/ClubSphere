/**
 * @FILE: CommandPaletteModal.jsx
 * @RESPONSIBILITY: Standalone modal component for Ctrl+K global navigation search palette.
 * @DEPENDENCIES: react, lucide-react, react-router-dom, NavigationPaletteContext.jsx.
 * @MODIFICATION_HOTSPOT: Search input filter and keyboard navigation styling.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { Search, CornerDownLeft, Sparkles } from 'lucide-react';
import { useNavigationPalette, PALETTE_NAVIGATION_ROUTES } from '../../context/NavigationPaletteContext.jsx';
import { useNavigate } from 'react-router-dom';

export const CommandPaletteModal = () => {
  const { isPaletteOpen, setIsPaletteOpen, searchQuery, setSearchQuery } = useNavigationPalette();
  const navigate = useNavigate();

  if (!isPaletteOpen) return null;

  const handleRouteSelect = (targetPath) => {
    setIsPaletteOpen(false);
    setSearchQuery('');
    navigate(targetPath);
  };

  const filteredRoutes = PALETTE_NAVIGATION_ROUTES.filter((route) =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      data-component="CommandPaletteModal"
      data-purpose="ctrl-k-palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-950/40 backdrop-blur-xs p-4"
      onClick={() => setIsPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50/70">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a module name or jump command..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-medium"
          />
          <span className="text-2xs font-mono text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-white shrink-0">ESC</span>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 py-1">
          {filteredRoutes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No matching enterprise routes found.</div>
          ) : (
            filteredRoutes.map((route) => (
              <button
                key={route.path}
                onClick={() => handleRouteSelect(route.path)}
                className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-odoo-primary transition-colors" />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">{route.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xs font-bold text-odoo-primary/80 uppercase tracking-wider">{route.group}</span>
                  <CornerDownLeft className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
