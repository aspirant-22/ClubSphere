/**
 * @FILE: AccountingNavHeader.jsx
 * @RESPONSIBILITY: Shared sub-navigation hub across General Ledger, Expense Claims, and Financial Reports.
 * @DEPENDENCIES: react, react-router-dom, lucide-react, AuthenticationContext.jsx.
 * @MODIFICATION_HOTSPOT: Accounting sub-tabs and RBAC visibility.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Landmark, Receipt, BarChart3 } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const AccountingNavHeader = () => {
  const { currentUser, isAdminOrOperations } = useAuthentication();
  const isAdmin = currentUser?.userRoleTier === 'ADMIN';

  return (
    <div
      data-component="AccountingNavHeader"
      data-purpose="accounting-sub-nav-hub"
      className="bg-white border-b border-slate-200 px-6 pt-2.5 flex space-x-6 text-xs font-bold"
    >
      {isAdmin && (
        <NavLink
          to="/accounting/ledger"
          className={({ isActive }) =>
            `pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${
              isActive
                ? 'border-odoo-primary text-odoo-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>General Ledger</span>
        </NavLink>
      )}

      <NavLink
        to="/accounting/reimbursements"
        className={({ isActive }) =>
          `pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${
            isActive
              ? 'border-odoo-primary text-odoo-primary'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`
        }
      >
        <Receipt className="w-3.5 h-3.5" />
        <span>Expense Reimbursements</span>
      </NavLink>

      {isAdminOrOperations() && (
        <NavLink
          to="/accounting/reports"
          className={({ isActive }) =>
            `pb-2 border-b-2 transition-colors flex items-center space-x-1.5 ${
              isActive
                ? 'border-odoo-primary text-odoo-primary'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Financial Reports (P&L)</span>
        </NavLink>
      )}
    </div>
  );
};
