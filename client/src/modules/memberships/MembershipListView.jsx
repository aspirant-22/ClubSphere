/**
 * @FILE: MembershipListView.jsx
 * @RESPONSIBILITY: Dense Odoo multi-column member directory with tier badges, dues filters, QR inspection triggers, and role elevation actions.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx, MemberCardModal.jsx, TableSignupModal.jsx, MembershipApplyModal.jsx, DuesPaymentConfirmationModal.jsx, PaymentDetailsModal.jsx, AuthenticationContext.jsx, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Table filtering and dues action triggers.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  QrCode,
  CheckCircle,
  Clock,
  Filter,
  DollarSign,
  UserCheck,
  Award,
  Lock,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { MemberCardModal } from './MemberCardModal.jsx';
import { TableSignupModal } from './TableSignupModal.jsx';
import { MembershipApplyModal } from './MembershipApplyModal.jsx';
import { DuesPaymentConfirmationModal } from './DuesPaymentConfirmationModal.jsx';
import { PaymentDetailsModal } from './PaymentDetailsModal.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const MembershipListView = () => {
  const [memberships, setMemberships] = useState([]);
  const [filteredMemberships, setFilteredMemberships] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedMemberForCard, setSelectedMemberForCard] = useState(null);
  const [confirmingMembership, setConfirmingMembership] = useState(null);
  const [viewingPaymentRecord, setViewingPaymentRecord] = useState(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdminOrOperations, hydrateUserSession } = useAuthentication();

  const loadMembershipsData = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/memberships');
      if (response.data?.successIndicator) {
        setMemberships(response.data.membershipsList);
        setFilteredMemberships(response.data.membershipsList);
      }
    } catch (err) {
      console.error('Failed to load memberships:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembershipsData();
  }, []);

  const handleDuesSuccess = async () => {
    await loadMembershipsData();
    await hydrateUserSession();
  };

  useEffect(() => {
    let result = memberships;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.membershipSequenceCode.toLowerCase().includes(q) ||
          m.associatedUserId?.fullName?.toLowerCase().includes(q) ||
          m.associatedUserId?.studentIdentificationNumber?.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== 'ALL') {
      result = result.filter((m) => m.membershipTier === tierFilter);
    }
    setFilteredMemberships(result);
  }, [searchQuery, tierFilter, memberships]);

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Memberships', path: '/memberships' },
    { label: 'Directory' }
  ];

  const userMembership = memberships.find(
    (m) => (m.associatedUserId?._id || m.associatedUserId) === currentUser?.userId ||
           (m.associatedUserId?._id || m.associatedUserId) === currentUser?._id
  );

  const actionButtons = [];
  if (currentUser?.userRoleTier === 'CUSTOMER' && !userMembership) {
    actionButtons.push({
      label: 'Apply for Membership',
      variant: 'primary',
      icon: Plus,
      onClick: () => setIsApplyModalOpen(true)
    });
  }

  const renderCustomerView = () => (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center space-y-4">
        <div className="inline-flex p-3 bg-amber-50 rounded-full border border-amber-200">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Membership Application Status</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track your official club registration and dues payment status
          </p>
        </div>
        {userMembership ? (
          <div className="p-4 bg-slate-50 rounded border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Code:</span>
              <span className="font-mono font-bold text-odoo-primary">
                {userMembership.membershipSequenceCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tier Selected:</span>
              <span className="font-semibold text-slate-800">{userMembership.membershipTier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dues Amount:</span>
              <span className="font-bold text-slate-900">₹{userMembership.duesAmountPayable}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Current Status:</span>
              <span className="px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                PENDING ADMIN CONFIRMATION
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-600">
              You haven't submitted a club membership application yet. Unlock member discounts and voting rights!
            </p>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="btn-primary-action px-6 py-2 inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Membership Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveMemberView = () => (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center space-y-4">
        <div className="inline-flex p-3 bg-emerald-50 rounded-full border border-emerald-200">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Active Membership Card</h2>
          <p className="text-xs text-slate-500 mt-1">
            You are a verified active member in good standing
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Member ID:</span>
            <span className="font-mono font-bold text-odoo-primary">
              {userMembership?.membershipSequenceCode || 'MEM/2026/0001'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tier:</span>
            <span className="font-semibold text-slate-800">
              {userMembership?.membershipTier || 'STANDARD_ANNUAL'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Valid Through:</span>
            <span className="text-slate-700">
              {userMembership?.membershipExpirationDate
                ? new Date(userMembership.membershipExpirationDate).toLocaleDateString()
                : 'Active 2026 Season'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-slate-500">Dues Status:</span>
            <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              PAID & ACTIVE
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {userMembership && (
            <button
              onClick={() => setViewingPaymentRecord(userMembership)}
              className="btn-secondary-action flex-1 py-2 flex items-center justify-center space-x-1.5 font-semibold text-xs"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>View Payment Receipt</span>
            </button>
          )}
          <button
            onClick={() => setSelectedMemberForCard(userMembership || { membershipSequenceCode: 'MEM/2026/0001', isDuesPaid: true, associatedUserId: currentUser })}
            className="btn-primary-action flex-1 py-2 flex items-center justify-center space-x-1.5 font-semibold text-xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Digital QR ID Card</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdminDirectoryTable = () => (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="table-dense-header">Code</th>
            <th className="table-dense-header">Student Name</th>
            <th className="table-dense-header">Student ID</th>
            <th className="table-dense-header">Department</th>
            <th className="table-dense-header">Tier</th>
            <th className="table-dense-header">Status</th>
            <th className="table-dense-header">Dues</th>
            <th className="table-dense-header">Valid Thru</th>
            <th className="table-dense-header text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan="9" className="p-8 text-center text-xs text-slate-400">Loading memberships...</td>
            </tr>
          ) : filteredMemberships.length === 0 ? (
            <tr>
              <td colSpan="9" className="p-8 text-center text-xs text-slate-400">No members matched filter.</td>
            </tr>
          ) : (
            filteredMemberships.map((m) => (
              <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="table-dense-cell font-mono font-bold text-odoo-primary">
                  {m.membershipSequenceCode}
                </td>
                <td className="table-dense-cell font-semibold text-slate-900">
                  {m.associatedUserId?.fullName || 'Anonymous'}
                </td>
                <td className="table-dense-cell font-mono text-slate-500">
                  {m.associatedUserId?.studentIdentificationNumber || 'N/A'}
                </td>
                <td className="table-dense-cell text-slate-600">
                  {m.academicDepartment} ({m.academicYear})
                </td>
                <td className="table-dense-cell">
                  <span className="px-1.5 py-0.5 text-2xs font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">
                    {m.membershipTier}
                  </span>
                </td>
                <td className="table-dense-cell">
                  {m.isDuesPaid ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                      ACTIVE MEMBER
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3 mr-1 text-amber-600" />
                      APPLICANT (CUSTOMER)
                    </span>
                  )}
                </td>
                <td className="table-dense-cell text-2xs font-medium text-slate-700">
                  {m.isDuesPaid ? `Paid (₹${m.duesAmountPayable})` : `Pending (₹${m.duesAmountPayable})`}
                </td>
                <td className="table-dense-cell text-slate-500 text-2xs">
                  {m.membershipExpirationDate ? new Date(m.membershipExpirationDate).toLocaleDateString() : 'Pending Dues'}
                </td>
                <td className="table-dense-cell text-right">
                  <div className="inline-flex items-center space-x-1.5">
                    {isAdminOrOperations() && !m.isDuesPaid && (
                      <button
                        onClick={() => setConfirmingMembership(m)}
                        className="px-2 py-0.5 text-2xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs inline-flex items-center space-x-1 transition-colors"
                        title="Confirm Dues & Elevate to Member"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Confirm Dues & Elevate</span>
                      </button>
                    )}
                    {m.isDuesPaid ? (
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => setViewingPaymentRecord(m)}
                          className="px-1.5 py-0.5 text-2xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 inline-flex items-center space-x-1 transition-colors"
                          title="Show Payment Details"
                        >
                          <Receipt className="w-3 h-3 text-emerald-600" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => setSelectedMemberForCard(m)}
                          className="p-1 text-slate-500 hover:text-odoo-primary hover:bg-slate-100 rounded transition-colors"
                          title="Inspect Member QR Card"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="p-1 text-slate-300 cursor-not-allowed rounded"
                        title="Pay dues to unlock QR ID"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      data-component="MembershipListView"
      data-purpose="members-directory"
      className="flex flex-col h-full bg-white"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      {currentUser?.userRoleTier === 'CUSTOMER' && userMembership && !userMembership.isDuesPaid && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Customer Tier Account:</strong> Your application (<strong>{userMembership.membershipSequenceCode}</strong>) is currently <strong>WAITING</strong> dues payment confirmation by an Admin/Operations officer.
            </span>
          </div>
        </div>
      )}

      {currentUser?.userRoleTier === 'CUSTOMER' ? (
        renderCustomerView()
      ) : currentUser?.userRoleTier === 'MEMBER' ? (
        renderActiveMemberView()
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-odoo-border text-xs">
            <div className="flex items-center space-x-3 w-1/2">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search member name, ID, or MEM code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-1 text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="ALL">All Tiers</option>
                  <option value="STANDARD_ANNUAL">Standard Annual</option>
                  <option value="LIFETIME">Lifetime</option>
                  <option value="ALUMNI_SUPPORTER">Alumni Supporter</option>
                </select>
              </div>
            </div>
            <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
              Total Records: {filteredMemberships.length}
            </div>
          </div>

          {renderAdminDirectoryTable()}
        </>
      )}

      <MemberCardModal
        membership={selectedMemberForCard}
        onClose={() => setSelectedMemberForCard(null)}
      />

      <TableSignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSuccess={() => loadMembershipsData()}
      />

      <MembershipApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onApplySuccess={() => loadMembershipsData()}
      />

      <DuesPaymentConfirmationModal
        isOpen={!!confirmingMembership}
        onClose={() => setConfirmingMembership(null)}
        membershipRecord={confirmingMembership}
        onDuesPaidSuccess={handleDuesSuccess}
      />

      <PaymentDetailsModal
        isOpen={!!viewingPaymentRecord}
        onClose={() => setViewingPaymentRecord(null)}
        membershipRecord={viewingPaymentRecord}
      />
    </div>
  );
};
