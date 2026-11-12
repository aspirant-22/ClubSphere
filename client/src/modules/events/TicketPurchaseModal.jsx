/**
 * @FILE: TicketPurchaseModal.jsx
 * @RESPONSIBILITY: Spring Gala ticket checkout modal dynamically verifying member discounts vs guest pricing and locking capacity slots.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, SystemProcessingContext.jsx, AuthenticationContext.jsx.
 * @MODIFICATION_HOTSPOT: Tier selection, pricing calculations, and checkout post.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { X, Ticket, ShieldCheck, CheckCircle } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const TicketPurchaseModal = ({ isOpen, event, onClose, onPurchaseSuccess }) => {
  const [selectedTierId, setSelectedTierId] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_PAYMENT');
  const [errorFeedback, setErrorFeedback] = useState('');
  const { runWithProcessingLock } = useSystemProcessing();
  const { currentUser } = useAuthentication();

  if (!isOpen || !event) return null;

  const currentTier = event.ticketTiers?.find(
    (tier) => tier.tierIdentifier === (selectedTierId || event.ticketTiers[0]?.tierIdentifier)
  ) || event.ticketTiers?.[0];

  const totalCalculatedAmount = (currentTier?.priceAmount || 0) * ticketQuantity;

  const executePurchase = async (e) => {
    e.preventDefault();
    setErrorFeedback('');
    try {
      await runWithProcessingLock(async () => {
        const payload = {
          ticketTierIdentifier: currentTier.tierIdentifier,
          ticketQuantity: Number(ticketQuantity),
          paymentMethod
        };
        const response = await apiNetworkClient.post(`/events/${event._id}/tickets/purchase`, payload);
        if (response.data?.successIndicator) {
          onPurchaseSuccess(response.data.purchaseSummary);
          onClose();
        }
      }, 'Securing seat quota & issuing tickets...');
    } catch (err) {
      setErrorFeedback(err.response?.data?.errorSummaryMessage || 'Failed to complete ticket reservation.');
    }
  };

  return (
    <div
      data-component="TicketPurchaseModal"
      data-purpose="spring-gala-ticket-pos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Ticket className="w-4 h-4 text-odoo-primary" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Spring Gala Ticket Checkout</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorFeedback && (
          <div className="mx-4 mt-3 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
            {errorFeedback}
          </div>
        )}

        <form onSubmit={executePurchase} className="p-4 space-y-4">
          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase block mb-1">Event Title</span>
            <p className="text-xs font-bold text-slate-900">{event.eventTitle}</p>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1.5">Select Admission Tier</label>
            <div className="space-y-2">
              {event.ticketTiers?.map((tier) => (
                <label
                  key={tier.tierIdentifier}
                  className={`flex items-center justify-between p-2.5 border rounded cursor-pointer transition-all ${
                    (selectedTierId || event.ticketTiers[0]?.tierIdentifier) === tier.tierIdentifier
                      ? 'border-odoo-primary bg-odoo-primary/5 ring-1 ring-odoo-primary'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tierChoice"
                      value={tier.tierIdentifier}
                      checked={(selectedTierId || event.ticketTiers[0]?.tierIdentifier) === tier.tierIdentifier}
                      onChange={() => setSelectedTierId(tier.tierIdentifier)}
                      className="text-odoo-primary focus:ring-odoo-primary"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{tier.tierName}</span>
                      {tier.isMemberExclusive && (
                        <span className="inline-flex items-center text-2xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                          Member Exclusive
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">₹{tier.priceAmount}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Tickets Count</label>
              <input
                type="number"
                min="1"
                max="10"
                value={ticketQuantity}
                onChange={(e) => setTicketQuantity(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              >
                <option value="ONLINE_PAYMENT">Online / Campus Card</option>
                <option value="CASH_AT_DOOR">Cash At Door Admission</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Charged:</span>
            <span className="text-sm font-bold text-odoo-primary">₹{totalCalculatedAmount}</span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-secondary-action">
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              Lock Seats & Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
