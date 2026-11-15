/**
 * @FILE: MembershipListView.jsx
 * @RESPONSIBILITY: Dense Odoo multi-column member directory with tier badges, dues filters, QR inspection triggers, and role elevation actions.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx, MemberCardModal.jsx, TableSignupModal.jsx, MembershipApplyModal.jsx, AuthenticationContext.jsx, SystemProcessingContext.jsx.
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
  CreditCard
} from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { MemberCardModal } from './MemberCardModal.jsx';
import { TableSignupModal } from './TableSignupModal.jsx';
import { MembershipApplyModal } from './MembershipApplyModal.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const MembershipListView = () => {
  const [memberships, setMemberships] = useState([]);
  const [filteredMemberships, setFilteredMemberships] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedMemberForCard, setSelectedMemberForCard] = useState(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdminOrOperations, hydrateUserSession } = useAuthentication();
  const { runWithProcessingLock } = useSystemProcessing();

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

  const handleElevateToMember = async (membershipRecord) => {
    await runWithProcessingLock(async () => {
      await apiNetworkClient.post(`/memberships/${membershipRecord._id}/pay-dues`, {
        paymentMethod: 'CASH_PAYMENT',
        paymentReferenceIdentifier: `ELEVATE_CASH_${membershipRecord.membershipSequenceCode}`,
        paidAmount: membershipRecord.duesAmountPayable || 500
      });
      await loadMembershipsData();
      await hydrateUserSession();
    }, 'Confirming dues & elevating student to Member...');
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

  const actionButtons = (
    <div className="flex items-center space-x-2">
      {currentUser?.userRoleTier === 'CUSTOMER' && !userMembership && (
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="btn-accent-action flex items-center space-x-1"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Apply for Membership</span>
        </button>
      )}
    </div>
  );

  const renderCustomerView = () => (
    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-odoo-surface">
      <div className="w-full max-w-md bg-white border border-odoo-border rounded-xl shadow-sm p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 text-amber-800 rounded-full mb-1">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Student Applicant Portal</h2>
        {userMembership ? (
          <div className="space-y-3 text-left bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Application Code:</span>
              <span className="font-mono font-bold text-odoo-primary">{userMembership.membershipSequenceCode}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Plan Tier:</span>
              <span className="font-semibold text-slate-800">{userMembership.membershipTier}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Dues Amount:</span>
              <span className="font-semibold text-slate-800">₹{userMembership.duesAmountPayable}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Dues Status:</span>
              <span className="px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                PENDING CONFIRMATION
              </span>
            </div>
            <p className="text-2xs text-slate-500 pt-2 border-t border-slate-200 leading-normal">
              Your application is under review. Once an Admin or Operations officer confirms dues collection, your role elevates to Member and unlocks your digital QR badge!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              You currently have guest access as a Customer. Apply for club membership to unlock discounted Gala passes, merchandise pricing, and your digital membership card!
            </p>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="btn-primary-action w-full py-2 flex items-center justify-center space-x-1 font-semibold"
            >
              <Award className="w-4 h-4 mr-1" />
              <span>Apply for Club Membership</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveMemberView = () => (
    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-odoo-surface">
      <div className="w-full max-w-md bg-white border border-odoo-border rounded-xl shadow-sm p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full mb-1">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Active Club Membership</h2>
          <p className="text-xs text-slate-500">Skyline Student Association Verified Member</p>
        </div>
        <div className="space-y-3 text-left bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Membership Code:</span>
            <span className="font-mono font-bold text-odoo-primary">
              {userMembership?.membershipSequenceCode || 'MEM/2026/0001'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Member Name:</span>
            <span className="font-semibold text-slate-800">{currentUser?.fullName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Tier:</span>
            <span className="font-semibold text-purple-700">{userMembership?.membershipTier || 'STANDARD_ANNUAL'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Valid Through:</span>
            <span className="font-semibold text-slate-800">
              {userMembership?.membershipExpirationDate ? new Date(userMembership.membershipExpirationDate).toLocaleDateString() : 'Active 2026-27'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Dues Status:</span>
            <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              PAID & ACTIVE
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedMemberForCard(userMembership || { membershipSequenceCode: 'MEM/2026/0001', isDuesPaid: true, associatedUserId: currentUser })}
          className="btn-primary-action w-full py-2 flex items-center justify-center space-x-1.5 font-semibold"
        >
          <QrCode className="w-4 h-4" />
          <span>View Digital QR ID Card</span>
        </button>
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
                        onClick={() => handleElevateToMember(m)}
                        className="px-2 py-0.5 text-2xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs inline-flex items-center space-x-1 transition-colors"
                        title="Confirm Dues & Elevate to Member"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Confirm Dues & Elevate</span>
                      </button>
                    )}
                    {m.isDuesPaid ? (
                      <button
                        onClick={() => setSelectedMemberForCard(m)}
                        className="p-1 text-slate-500 hover:text-odoo-primary hover:bg-slate-100 rounded transition-colors"
                        title="Inspect Member QR Card"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
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

      {/* Customer Status Alert Banner only when Customer has an unpaid membership */}
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

      {/* Render appropriate view based on role */}
      {currentUser?.userRoleTier === 'CUSTOMER' ? (
        renderCustomerView()
      ) : currentUser?.userRoleTier === 'MEMBER' ? (
        renderActiveMemberView()
      ) : (
        <>
          {/* Admin / Operations Filter Toolbar */}
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
    </div>
  );
};
