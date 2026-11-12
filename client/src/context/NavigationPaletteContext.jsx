/**
 * @FILE: NavigationPaletteContext.jsx
 * @RESPONSIBILITY: React context and global Ctrl+K / Cmd+K keyboard shortcut listener for instant zero-click navigation.
 * @DEPENDENCIES: react, react-router-dom.
 * @MODIFICATION_HOTSPOT: PALETTE_NAVIGATION_ROUTES and hotkey event listener.
 * @AUTHOR: Garima Mittal
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationPaletteContext = createContext(null);

export const PALETTE_NAVIGATION_ROUTES = [
  { label: 'Memberships / Directory', path: '/memberships', group: 'CRM & Members' },
  { label: 'My Digital Membership Card', path: '/memberships/my-card', group: 'CRM & Members' },
  { label: 'Campus Table Sign-up POS', path: '/memberships/table-signup', group: 'CRM & Members' },
  { label: 'Spring Gala Events & Tickets', path: '/events', group: 'Events' },
  { label: 'Door Scanner Ticket Check-in', path: '/events/scanner', group: 'Events' },
  { label: 'Apparel Store / Club Hoodies', path: '/merchandise', group: 'Merchandise POS' },
  { label: 'Stock Movement Ledger', path: '/merchandise/stock-ledger', group: 'Merchandise POS' },
  { label: 'Bake Sale Volunteer Kanban', path: '/activities', group: 'Fundraiser Activities' },
  { label: 'General Accounting Ledger', path: '/accounting/ledger', group: 'Treasury & Finances' },
  { label: 'Volunteer Expense Claims', path: '/accounting/reimbursements', group: 'Treasury & Finances' },
  { label: 'Semester P&L Financial Report', path: '/accounting/report', group: 'Treasury & Finances' },
  { label: 'Club Announcements & Broadcasts', path: '/broadcasts', group: 'Communications' },
  { label: 'Live Infrastructure Logs', path: '/admin/system-logs', group: 'Diagnostics' }
];

export const NavigationPaletteProvider = ({ children }) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (event.key === 'Escape' && isPaletteOpen) {
        setIsPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen]);

  const selectRoute = (path) => {
    setIsPaletteOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const filteredRoutes = PALETTE_NAVIGATION_ROUTES.filter((route) =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <NavigationPaletteContext.Provider value={{ isPaletteOpen, setIsPaletteOpen, searchQuery, setSearchQuery }}>
      {children}
      {isPaletteOpen && (
        <div
          data-component="CommandPaletteModal"
          data-purpose="ctrl-k-navigation"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setIsPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-slate-400 text-sm mr-2 font-mono">⌘/Ctrl + K</span>
              <input
                type="text"
                autoFocus
                placeholder="Type a module name or shortcut to jump..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
              {filteredRoutes.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No matching enterprise routes found.</div>
              ) : (
                filteredRoutes.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => selectRoute(route.path)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-slate-700">{route.label}</span>
                    <span className="text-2xs font-semibold text-odoo-primary uppercase tracking-wider">{route.group}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </NavigationPaletteContext.Provider>
  );
};

export const useNavigationPalette = () => {
  const context = useContext(NavigationPaletteContext);
  if (!context) {
    throw new Error('useNavigationPalette must be used within a NavigationPaletteProvider');
  }
  return context;
};
