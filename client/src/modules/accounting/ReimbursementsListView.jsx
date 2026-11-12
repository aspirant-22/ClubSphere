/**
 * @FILE: ReimbursementsListView.jsx
 * @RESPONSIBILITY: Volunteer expense claims queue with cloud receipt preview modal, claim form, and 1-click Treasurer sign-off.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx, SystemProcessingContext.jsx, AuthenticationContext.jsx.
 * @MODIFICATION_HOTSPOT: Treasurer review triggers and receipt modal.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { Landmark, FileText, Check, X, Plus, ExternalLink, Clock, ShieldCheck } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const ReimbursementsListView = () => {
  const [claims, setClaims] = useState([]);
  const [activeReceiptPreview, setActiveReceiptPreview] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newClaim, setNewClaim] = useState({
    expenseCategory: 'BAKE_SALE_SUPPLIES',
    claimAmount: 250,
    vendorMerchantName: '',
    expenseDate: new Date().toISOString(),
    receiptDocumentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
    businessPurposeJustification: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const { runWithProcessingLock } = useSystemProcessing();
  const { currentUser, isAdminOrOperations } = useAuthentication();

  const isTreasurer = currentUser?.userRoleTier === 'ADMIN';

  const loadClaimsData = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/accounting/reimbursements');
      if (response.data?.successIndicator) {
        setClaims(response.data.claimsList);
      }
    } catch (err) {
      console.error('Failed to load reimbursements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaimsData();
  }, []);

  const handleTreasurerAction = async (claimId, approvalStatus) => {
    try {
      await runWithProcessingLock(async () => {
        await apiNetworkClient.put(`/accounting/reimbursements/${claimId}/review`, {
          approvalStatus,
          treasurerNotes: approvalStatus === 'APPROVED' ? 'Disbursed via campus bank account' : 'Receipt rejected'
        });
        await loadClaimsData();
      }, `${approvalStatus === 'APPROVED' ? 'Disbursing funds & posting ledger...' : 'Rejecting claim...'}`);
    } catch (err) {
      console.error('Treasurer action failed:', err);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      await runWithProcessingLock(async () => {
        await apiNetworkClient.post('/accounting/reimbursements', newClaim);
        setIsSubmitModalOpen(false);
        await loadClaimsData();
      }, 'Submitting receipt claim to Treasurer...');
    } catch (err) {
      console.error('Claim submission failed:', err);
    }
  };

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Accounting', path: '/accounting' },
    { label: 'Volunteer Expense Claims' }
  ];

  const actionButtons = (
    <button
      onClick={() => setIsSubmitModalOpen(true)}
      className="btn-primary-action flex items-center space-x-1"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>Submit Expense Receipt</span>
    </button>
  );

  return (
    <div
      data-component="ReimbursementsListView"
      data-purpose="volunteer-reimbursements"
      className="flex flex-col h-full bg-white"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-dense-header">Claim Code</th>
              <th className="table-dense-header">Volunteer</th>
              <th className="table-dense-header">Category</th>
              <th className="table-dense-header">Merchant</th>
              <th className="table-dense-header text-right">Amount</th>
              <th className="table-dense-header">Receipt</th>
              <th className="table-dense-header">Status</th>
              <th className="table-dense-header text-right">Treasurer Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-xs text-slate-400">Loading expense claims...</td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-xs text-slate-400">No expense claims logged.</td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="table-dense-cell font-mono font-bold text-odoo-primary">
                    {claim.reimbursementTrackingCode}
                  </td>
                  <td className="table-dense-cell font-semibold text-slate-900">
                    {claim.claimantUserId?.fullName || 'Volunteer'}
                  </td>
                  <td className="table-dense-cell">
                    <span className="px-1.5 py-0.2 text-2xs font-bold uppercase rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {claim.expenseCategory.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="table-dense-cell text-slate-600">
                    {claim.vendorMerchantName}
                  </td>
                  <td className="table-dense-cell text-right font-mono font-bold text-slate-900">
                    ₹{claim.claimAmount}
                  </td>
                  <td className="table-dense-cell">
                    <button
                      onClick={() => setActiveReceiptPreview(claim.receiptDocumentUrl)}
                      className="inline-flex items-center text-2xs font-semibold text-odoo-primary hover:underline"
                    >
                      <span>View Receipt</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                  </td>
                  <td className="table-dense-cell">
                    {claim.lifecycleState === 'DONE' ? (
                      <span className="inline-flex items-center text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 mr-1" />
                        Disbursed
                      </span>
                    ) : claim.lifecycleState === 'CANCELLED' ? (
                      <span className="inline-flex items-center text-2xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <X className="w-3 h-3 mr-1" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-2xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </span>
                    )}
                  </td>
                  <td className="table-dense-cell text-right">
                    {claim.lifecycleState === 'WAITING' && isTreasurer ? (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleTreasurerAction(claim._id, 'APPROVED')}
                          className="px-2 py-1 text-2xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleTreasurerAction(claim._id, 'REJECTED')}
                          className="px-2 py-1 text-2xs font-bold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-2xs text-slate-400 font-mono">Immutable</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cloud Receipt Preview Modal */}
      {activeReceiptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setActiveReceiptPreview(null)}
        >
          <div className="bg-white rounded-lg p-3 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <img src={activeReceiptPreview} alt="Expense Receipt Evidence" className="w-full h-auto rounded border" />
            <button
              onClick={() => setActiveReceiptPreview(null)}
              className="mt-3 w-full btn-secondary-action"
            >
              Close Evidence Window
            </button>
          </div>
        </div>
      )}

      {/* Submit Claim Modal */}
      {isSubmitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setIsSubmitModalOpen(false)}
        >
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Submit Expense Reimbursement</h3>
            <form onSubmit={handleClaimSubmit} className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Expense Category</label>
                <select
                  value={newClaim.expenseCategory}
                  onChange={(e) => setNewClaim({ ...newClaim, expenseCategory: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="BAKE_SALE_SUPPLIES">Bake Sale Supplies</option>
                  <option value="EVENT_DECOR">Event Decor</option>
                  <option value="PRINTING_SIGNAGE">Printing & Signage</option>
                  <option value="FOOD_BEVERAGE">Food & Beverage</option>
                  <option value="EQUIPMENT_RENTAL">Equipment Rental</option>
                  <option value="MISCELLANEOUS">Miscellaneous</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newClaim.claimAmount}
                    onChange={(e) => setNewClaim({ ...newClaim, claimAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Merchant Name</label>
                  <input
                    type="text"
                    required
                    value={newClaim.vendorMerchantName}
                    onChange={(e) => setNewClaim({ ...newClaim, vendorMerchantName: e.target.value })}
                    placeholder="e.g. Costco Wholesale"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Business Justification</label>
                <input
                  type="text"
                  required
                  value={newClaim.businessPurposeJustification}
                  onChange={(e) => setNewClaim({ ...newClaim, businessPurposeJustification: e.target.value })}
                  placeholder="e.g. Flour and parchment paper for bake sale"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Cloud Receipt URL</label>
                <input
                  type="url"
                  required
                  value={newClaim.receiptDocumentUrl}
                  onChange={(e) => setNewClaim({ ...newClaim, receiptDocumentUrl: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded text-slate-600"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="btn-secondary-action">
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

