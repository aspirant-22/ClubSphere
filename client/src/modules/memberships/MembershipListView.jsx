/**
 * @FILE: MembershipListView.jsx
 * @RESPONSIBILITY: Dense Odoo multi-column member directory with tier badges, dues filters, and QR inspection triggers.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx, MemberCardModal.jsx, TableSignupModal.jsx, AuthenticationContext.jsx.
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
  DollarSign
} from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { MemberCardModal } from './MemberCardModal.jsx';
import { TableSignupModal } from './TableSignupModal.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const MembershipListView = () => {
  const [memberships, setMemberships] = useState([]);
  const [filteredMemberships, setFilteredMemberships] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedMemberForCard, setSelectedMemberForCard] = useState(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdminOrOperations } = useAuthentication();

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

  const actionButtons = (
    <div className="flex items-center space-x-2">
      {isAdminOrOperations() && (
        <button
          onClick={() => setIsSignupModalOpen(true)}
          className="btn-primary-action flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Table Sign-up</span>
        </button>
      )}
    </div>
  );

  return (
    <div
      data-component="MembershipListView"
      data-purpose="members-directory"
      className="flex flex-col h-full bg-white"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      {/* Filter Toolbar */}
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
          Total Members: {filteredMemberships.length}
        </div>
      </div>

      {/* Dense Multi-Column Table View */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-dense-header">Code</th>
              <th className="table-dense-header">Student Name</th>
              <th className="table-dense-header">Student ID</th>
              <th className="table-dense-header">Department</th>
              <th className="table-dense-header">Tier</th>
              <th className="table-dense-header">Dues Status</th>
              <th className="table-dense-header">Valid Thru</th>
              <th className="table-dense-header text-right">Card</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-xs text-slate-400">Loading memberships...</td>
              </tr>
            ) : filteredMemberships.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-xs text-slate-400">No members matched filter.</td>
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
                      <span className="inline-flex items-center text-2xs font-bold text-emerald-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid (₹{m.duesAmountPayable})
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-2xs font-bold text-amber-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending (₹{m.duesAmountPayable})
                      </span>
                    )}
                  </td>
                  <td className="table-dense-cell text-slate-500 text-2xs">
                    {m.membershipExpirationDate ? new Date(m.membershipExpirationDate).toLocaleDateString() : 'Pending Dues'}
                  </td>
                  <td className="table-dense-cell text-right">
                    <button
                      onClick={() => setSelectedMemberForCard(m)}
                      className="p-1 text-slate-400 hover:text-odoo-primary hover:bg-slate-100 rounded transition-colors"
                      title="Inspect Member QR Card"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MemberCardModal
        membership={selectedMemberForCard}
        onClose={() => setSelectedMemberForCard(null)}
      />

      <TableSignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSignupSuccess={() => loadMembershipsData()}
      />
    </div>
  );
};
