/**
 * @FILE: DuesPaymentConfirmationModal.jsx
 * @RESPONSIBILITY: Officer dues payment verification and audit wizard with Cash/Online toggle and animated celebration state.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Payment audit inputs and celebration view.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Banknote, Sparkles, AlertCircle } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const DuesPaymentConfirmationModal = ({
  isOpen,
  membership,
  membershipRecord,
  officerUser,
  onClose,
  onSuccess,
  onDuesPaidSuccess
}) => {
  const activeRecord = membership || membershipRecord;
  const activeSuccess = onSuccess || onDuesPaidSuccess || (() => {});
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [isCelebration, setIsCelebration] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { runWithProcessingLock } = useSystemProcessing();

  if (!isOpen || !activeRecord) return null;

  const officerTitle = officerUser?.fullName
    ? (officerUser?.userRoleTier === 'ADMIN'
        ? `${officerUser.fullName} — Club Executive / Treasurer`
        : `${officerUser.fullName} — Operations Lead`)
    : 'System Officer — Operations Lead';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (paymentMode === 'ONLINE' && !transactionId.trim()) {
      setErrorMessage('Transaction ID is strictly required for Online payment.');
      return;
    }

    try {
      await runWithProcessingLock(async () => {
        const payload = {
          paymentMode,
          paymentMethod: paymentMode === 'CASH' ? 'CASH_PAYMENT' : 'ONLINE_GATEWAY',
          transactionId: paymentMode === 'ONLINE' ? transactionId.trim() : 'CASH_RECEIPT',
          paidAmount: activeRecord.duesAmountPayable || 500,
          paidAt: new Date(paidAt).toISOString()
        };
        await apiNetworkClient.post(`/memberships/${activeRecord._id}/pay-dues`, payload);
        setIsCelebration(true);
      }, 'Verifying payment & elevating membership...');
    } catch (err) {
      setErrorMessage(err.response?.data?.errorSummaryMessage || 'Payment confirmation failed.');
    }
  };

  const handleCloseAfterCelebration = () => {
    setIsCelebration(false);
    activeSuccess();
    onClose();
  };

  return (
    <div
      data-component="DuesPaymentConfirmationModal"
      data-purpose="dues-audit-and-elevation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {isCelebration ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-md">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-2xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Audit Verified</span>
              </span>
              <h2 className="text-lg font-bold text-slate-900">Successfully! 1 new member added</h2>
              <p className="text-xs text-slate-500 font-mono">
                {activeRecord.associatedUserId?.fullName} ({activeRecord.membershipSequenceCode})
              </p>
            </div>
            <p className="text-2xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Role elevated to <strong>MEMBER</strong>. Balanced dues journal <code>JRN/2026/XXXX</code> posted to the General Ledger. Digital QR Card is now active!
            </p>
            <button
              onClick={handleCloseAfterCelebration}
              className="btn-primary-action w-full py-2 font-semibold"
            >
              Continue to Directory
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-odoo-primary" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Confirm Dues & Elevate</h3>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mx-4 mt-3 p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Approved By (Auditor)</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={officerTitle}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Student Applicant</label>
                  <p className="text-xs font-bold text-slate-900 truncate">{activeRecord.associatedUserId?.fullName}</p>
                  <p className="text-2xs font-mono text-slate-500">{activeRecord.membershipSequenceCode}</p>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Dues Amount</label>
                  <p className="text-sm font-bold text-emerald-700">₹{activeRecord.duesAmountPayable}</p>
                  <p className="text-2xs text-purple-700 font-medium">{activeRecord.membershipTier}</p>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1.5">Mode of Payment</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded border text-xs font-semibold transition-all ${
                      paymentMode === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('ONLINE')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded border text-xs font-semibold transition-all ${
                      paymentMode === 'ONLINE'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Online / UPI / Transfer</span>
                  </button>
                </div>
              </div>

              {paymentMode === 'ONLINE' && (
                <div>
                  <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                    Transaction ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. UPI/2026/88492041 or TXN-99824"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Date & Time of Payment</label>
                <input
                  type="datetime-local"
                  required
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={onClose} className="btn-secondary-action">
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action font-semibold">
                  Confirm Dues & Payment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
