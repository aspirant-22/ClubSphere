/**
 * @FILE: Navbar.jsx
 * @RESPONSIBILITY: Top enterprise navigation bar rendering branding, Ctrl+K search prompt, user persona badge, and logout trigger.
 * @DEPENDENCIES: react, lucide-react, AuthenticationContext.jsx, NavigationPaletteContext.jsx.
 * @MODIFICATION_HOTSPOT: User badge display and quick action icons.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { Search, LogOut, Shield, User, Bell } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';
import { useNavigationPalette } from '../../context/NavigationPaletteContext.jsx';

export const Navbar = () => {
  const { currentUser, logoutCurrentSession } = useAuthentication();
  const { setIsPaletteOpen } = useNavigationPalette();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OPERATIONS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CUSTOMER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header
      data-component="Navbar"
      data-purpose="top-navigation-bar"
      className="h-12 bg-white border-b border-odoo-border flex items-center justify-between px-4 shrink-0 shadow-xs z-10"
    >
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsPaletteOpen(true)}
          className="flex items-center space-x-2 px-2.5 py-1 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded border border-slate-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick Find...</span>
          <kbd className="px-1 py-0.5 text-2xs font-mono bg-white border border-slate-300 rounded text-slate-400">Ctrl K</kbd>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        {currentUser ? (
          <>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 text-2xs font-bold uppercase rounded border ${getRoleBadgeColor(currentUser.userRoleTier)}`}>
                {currentUser.userRoleTier}
              </span>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.fullName}</p>
                <p className="text-2xs text-slate-400 font-mono leading-tight">{currentUser.studentIdentificationNumber}</p>
              </div>
            </div>
            <button
              onClick={logoutCurrentSession}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Public Visitor</span>
          </div>
        )}
      </div>
    </header>
  );
};

