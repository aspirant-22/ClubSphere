/**
 * @FILE: EnterpriseAppLayout.jsx
 * @RESPONSIBILITY: Master Odoo multi-column enterprise layout containing dark slate app-rail, navbar, offline banner, and viewports.
 * @DEPENDENCIES: react, react-router-dom, lucide-react, Navbar.jsx, OfflineAlertBanner.jsx, CommandPaletteModal.jsx.
 * @MODIFICATION_HOTSPOT: PRIMARY_APP_MODULES navigation array.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Users,
  Calendar,
  ShoppingBag,
  CheckSquare,
  Landmark,
  Radio,
  Terminal,
  Layers
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar.jsx';
import { OfflineAlertBanner } from '../components/common/OfflineAlertBanner.jsx';
import { CommandPaletteModal } from '../components/common/CommandPaletteModal.jsx';
import { useAuthentication } from '../context/AuthenticationContext.jsx';

const PRIMARY_APP_MODULES = [
  { label: 'Members', icon: Users, path: '/memberships' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Shop / POS', icon: ShoppingBag, path: '/merchandise' },
  { label: 'Activities', icon: CheckSquare, path: '/activities' },
  { label: 'Accounting', icon: Landmark, path: '/accounting' },
  { label: 'Bulletins', icon: Radio, path: '/broadcasts' }
];

export const EnterpriseAppLayout = () => {
  const { currentUser } = useAuthentication();
  const isAdmin = currentUser?.userRoleTier === 'ADMIN';

  return (
    <div
      data-component="EnterpriseAppLayout"
      data-purpose="odoo-multi-column-shell"
      className="flex h-screen w-screen overflow-hidden bg-odoo-surface"
    >
      {/* Odoo Left App Rail */}
      <aside className="w-16 bg-odoo-sidebar flex flex-col items-center py-3 shrink-0 select-none z-30">
        <div className="w-10 h-10 rounded-lg bg-odoo-primary flex items-center justify-center text-white mb-6 shadow-md">
          <Layers className="w-6 h-6" />
        </div>

        <nav className="flex-1 flex flex-col space-y-3 w-full px-2">
          {PRIMARY_APP_MODULES.map((module) => {
            const IconComponent = module.icon;
            return (
              <NavLink
                key={module.path}
                to={module.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors ${
                    isActive
                      ? 'bg-odoo-primary text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`
                }
              >
                <IconComponent className="w-5 h-5 mb-1 shrink-0" />
                <span className="text-2xs font-medium tracking-tight text-center leading-none">
                  {module.label}
                </span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <NavLink
              to="/admin/system-logs"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors mt-auto ${
                  isActive
                    ? 'bg-odoo-primary text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
              title="System Diagnostics & Telemetry"
            >
              <Terminal className="w-5 h-5 mb-1 shrink-0" />
              <span className="text-2xs font-medium tracking-tight leading-none">Logs</span>
            </NavLink>
          )}
        </nav>
      </aside>

      {/* Main Enterprise Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OfflineAlertBanner />
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CommandPaletteModal />
    </div>
  );
};

