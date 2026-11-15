/**
 * @FILE: PaymentDetailsModal.jsx
 * @RESPONSIBILITY: Modal displaying verified payment audit receipt details for active club members.
 * @DEPENDENCIES: react, lucide-react.
 * @MODIFICATION_HOTSPOT: modal layout and audit field rendering.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { X, Receipt, CheckCircle, ShieldCheck } from 'lucide-react';

export const PaymentDetailsModal = ({ isOpen, onClose, membershipRecord }) => {
  if (!isOpen || !membershipRecord) return null;

  const payment = membershipRecord.paymentDetails || {};
  const paidDateFormatted = payment.paidAt
    ? new Date(payment.paidAt).toLocaleString()
    : membershipRecord.paymentDate
    ? new Date(membershipRecord.paymentDate).toLocaleString()
    : 'Recorded at Registration';

  return (
    <div
      data-component="PaymentDetailsModal"
      data-purpose="view-payment-receipt"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Membership Dues Payment Receipt
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900">
                Payment Verified & Elevating Complete
              </div>
              <div className="text-2xs text-emerald-700">
                Member ID: {membershipRecord.membershipSequenceCode}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Member Name</span>
              <span className="font-semibold text-slate-800">
                {membershipRecord.associatedUserId?.userFullName || 'Active Member'}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Membership Tier</span>
              <span className="font-semibold text-slate-800">
                {membershipRecord.membershipTier}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-emerald-700">
                ₹{membershipRecord.duesAmountPayable || 500}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Payment Mode</span>
              <span className="inline-block px-2 py-0.5 text-2xs font-bold rounded bg-slate-100 text-slate-800">
                {payment.paymentMode || 'CASH'}
              </span>
            </div>

            {payment.paymentMode === 'ONLINE' && (
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono text-xs font-semibold text-blue-700">
                  {payment.transactionId || 'N/A'}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Date & Time</span>
              <span className="text-slate-700">{paidDateFormatted}</span>
            </div>

            <div className="flex justify-between py-1.5 items-start">
              <span className="text-slate-500">Approved By</span>
              <div className="text-right">
                <div className="font-semibold text-slate-800">
                  {payment.approvedByName || 'System Executive'}
                </div>
                <div className="text-2xs text-slate-500 flex items-center justify-end space-x-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-odoo-primary" />
                  <span>{payment.approvedByDesignation || 'Club Officer'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end">
            <button type="button" onClick={onClose} className="btn-secondary-action">
              Close Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
