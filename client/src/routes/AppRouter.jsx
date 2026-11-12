/**
 * @file AppRouter.jsx
 * @module routes
 * @description Complete protected routing matrix binding all ClubSphere
 *              subdomains with RBAC-aware ProtectedRoute guards.
 * @author Garima Mittal
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthentication } from '../context/AuthenticationContext.jsx';

/* ─── Lazy page imports ─────────────────────────────────────── */
import { LoginView }                from '../modules/auth/LoginView.jsx';
import { EnterpriseAppLayout }      from '../layouts/EnterpriseAppLayout.jsx';
import { PublicPortalLayout }        from '../layouts/PublicPortalLayout.jsx';

import { MembershipListView }       from '../modules/memberships/MembershipListView.jsx';

import { EventListView }            from '../modules/events/EventListView.jsx';
import { DoorScannerView }          from '../modules/events/DoorScannerView.jsx';

import { MerchandiseCatalogView }   from '../modules/merchandise/MerchandiseCatalogView.jsx';
import { StockLedgerView }          from '../modules/merchandise/StockLedgerView.jsx';

import { VolunteerKanbanView }      from '../modules/activities/VolunteerKanbanView.jsx';

import { GeneralLedgerView }        from '../modules/accounting/GeneralLedgerView.jsx';
import { ReimbursementsListView }   from '../modules/accounting/ReimbursementsListView.jsx';
import { FinancialReportView }      from '../modules/accounting/FinancialReportView.jsx';

import { BroadcastsView }           from '../modules/broadcasts/BroadcastsView.jsx';
import SystemLogsView               from '../modules/diagnostics/SystemLogsView.jsx';

/* ─── Role constants ────────────────────────────────────────── */
const ROLE = { ADMIN: 'ADMIN', OPERATIONS: 'OPERATIONS', CUSTOMER: 'CUSTOMER' };

/* ─── ProtectedRoute ────────────────────────────────────────── */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isAuthResolving, currentUser } = useAuthentication();

  if (isAuthResolving) {
    return (
      <div data-component="AuthResolvingSpinner" className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-odoo-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(currentUser?.userRoleTier)) {
    return <Navigate to="/memberships" replace />;
  }

  return children;
}

/* ─── RootRedirect ──────────────────────────────────────────── */
function RootRedirect() {
  const { isAuthenticated, isAuthResolving } = useAuthentication();
  if (isAuthResolving) return null;
  return <Navigate to={isAuthenticated ? '/memberships' : '/login'} replace />;
}

/* ─── AppRouter ─────────────────────────────────────────────── */
export default function AppRouter() {
  return (
    <Routes>

      {/* Public */}
      <Route element={<PublicPortalLayout />}>
        <Route path="/login" element={<LoginView />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected: all roles */}
      <Route element={
        <ProtectedRoute>
          <EnterpriseAppLayout />
        </ProtectedRoute>
      }>

        {/* Memberships */}
        <Route path="/memberships" element={<MembershipListView />} />

        {/* Events */}
        <Route path="/events" element={<EventListView />} />
        <Route path="/events/scanner" element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.OPERATIONS]}>
            <DoorScannerView />
          </ProtectedRoute>
        } />

        {/* Merchandise */}
        <Route path="/merchandise" element={<MerchandiseCatalogView />} />
        <Route path="/merchandise/stock-ledger" element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.OPERATIONS]}>
            <StockLedgerView />
          </ProtectedRoute>
        } />

        {/* Activities / Kanban */}
        <Route path="/activities" element={<VolunteerKanbanView />} />

        {/* Accounting */}
        <Route path="/accounting/ledger" element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
            <GeneralLedgerView />
          </ProtectedRoute>
        } />
        <Route path="/accounting/reimbursements" element={<ReimbursementsListView />} />
        <Route path="/accounting/report" element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.OPERATIONS]}>
            <FinancialReportView />
          </ProtectedRoute>
        } />
        <Route path="/accounting/reports" element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.OPERATIONS]}>
            <FinancialReportView />
          </ProtectedRoute>
        } />
        <Route path="/merchandise/ledger" element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN, ROLE.OPERATIONS]}>
            <StockLedgerView />
          </ProtectedRoute>
        } />

        {/* Broadcasts */}
        <Route path="/broadcasts" element={<BroadcastsView />} />

        {/* Admin diagnostics */}
        <Route path="/admin/system-logs" element={
          <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
            <SystemLogsView />
          </ProtectedRoute>
        } />

      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

