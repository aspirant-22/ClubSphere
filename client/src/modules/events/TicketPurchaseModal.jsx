/**
 * @FILE: TicketPurchaseModal.jsx
 * @RESPONSIBILITY: Multi-step Spring Gala ticket checkout modal verifying member discounts, payment proofs, and booking approval.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, SystemProcessingContext.jsx, AuthenticationContext.jsx.
 * @MODIFICATION_HOTSPOT: Step transitions, payment proofs, and booking submission.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { X, Ticket, ShieldCheck, CheckCircle, ArrowRight, ArrowLeft, UploadCloud, CreditCard, Banknote } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const TicketPurchaseModal = ({ isOpen, event, onClose, onPurchaseSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTierId, setSelectedTierId] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');
  const { runWithProcessingLock } = useSystemProcessing();

  if (!isOpen || !event) return null;

  const currentTier = event.ticketTiers?.find(
    (tier) => tier.tierIdentifier === (selectedTierId || event.ticketTiers[0]?.tierIdentifier)
  ) || event.ticketTiers?.[0];

  const totalCalculatedAmount = (currentTier?.priceAmount || 0) * ticketQuantity;

  const validateStepOne = (e) => {
    e.preventDefault();
    if (!currentTier) return setErrorFeedback('Please select a valid admission tier.');
    setErrorFeedback('');
    setCurrentStep(2);
  };

  const executePurchase = async (e) => {
    e.preventDefault();
    if (paymentMode === 'ONLINE' && (!transactionId.trim() || !paymentScreenshotUrl.trim())) {
      return setErrorFeedback('Transaction ID and Payment Screenshot URL are required for online payments.');
    }
    setErrorFeedback('');
    try {
      await runWithProcessingLock(async () => {
        const payload = {
          ticketTierIdentifier: currentTier.tierIdentifier,
          ticketQuantity: Number(ticketQuantity),
          paymentMethod: paymentMode === 'ONLINE' ? 'ONLINE_PAYMENT' : 'CASH_AT_DOOR',
          paymentMode,
          transactionId: paymentMode === 'ONLINE' ? transactionId.trim() : undefined,
          paymentScreenshotUrl: paymentMode === 'ONLINE' ? paymentScreenshotUrl.trim() : undefined
        };
        const response = await apiNetworkClient.post(`/events/${event._id}/tickets/purchase`, payload);
        if (response.data?.successIndicator) {
          onPurchaseSuccess(response.data.purchaseSummary);
          onClose();
        }
      }, 'Securing seat quota & submitting booking proof...');
    } catch (err) {
      setErrorFeedback(err.response?.data?.errorSummaryMessage || 'Failed to submit ticket reservation.');
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
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {currentStep === 1 ? 'Step 1: Select Admission Tier' : 'Step 2: Payment & Verification'}
            </h3>
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

        {currentStep === 1 ? (
          <form onSubmit={validateStepOne} className="p-4 space-y-4">
            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase block mb-1">Event</span>
              <p className="text-xs font-bold text-slate-900">{event.eventTitle}</p>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1.5">
                Select Admission Tier
              </label>
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
                          <span className="inline-flex items-center text-3xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
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

            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                Number of Tickets
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={ticketQuantity}
                onChange={(e) => setTicketQuantity(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Total Payable:</span>
              <span className="text-sm font-bold text-odoo-primary">₹{totalCalculatedAmount}</span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={onClose} className="btn-secondary-action">
                Cancel
              </button>
              <button type="submit" className="btn-primary-action flex items-center space-x-1">
                <span>Continue to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={executePurchase} className="p-4 space-y-4">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1.5">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('ONLINE')}
                  className={`p-2.5 border rounded-lg flex items-center space-x-2 text-left ${
                    paymentMode === 'ONLINE'
                      ? 'border-odoo-primary bg-purple-50/50 ring-1 ring-odoo-primary'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-odoo-primary shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Online Payment</div>
                    <div className="text-3xs text-slate-500">UPI / NetBanking / Card</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`p-2.5 border rounded-lg flex items-center space-x-2 text-left ${
                    paymentMode === 'CASH'
                      ? 'border-odoo-primary bg-purple-50/50 ring-1 ring-odoo-primary'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Cash At Gate</div>
                    <div className="text-3xs text-slate-500">Pay at event booth</div>
                  </div>
                </button>
              </div>
            </div>

            {paymentMode === 'ONLINE' ? (
              <div className="space-y-3 p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                <div className="text-2xs font-semibold text-blue-900">
                  Pay <strong>₹{totalCalculatedAmount}</strong> to UPI ID: <span className="font-mono bg-blue-100 px-1 py-0.5 rounded">gala2026@skyline</span>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                    Transaction / UTR Reference ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TXN9876543210"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">
                    Payment Screenshot Proof URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://imgur.com/... or https://drive.google.com/..."
                    value={paymentScreenshotUrl}
                    onChange={(e) => setPaymentScreenshotUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-2xs text-amber-900">
                You selected <strong>Cash at Gate</strong>. Please carry exact change of <strong>₹{totalCalculatedAmount}</strong> to the registration desk on the event day.
              </div>
            )}

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-3xs text-slate-600">
              Note: After submission, your ticket will be placed in <strong>PENDING_APPROVAL</strong>. Officers will verify your payment and activate your scannable QR pass.
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-secondary-action flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button type="submit" className="btn-primary-action">
                Submit Booking & Proof
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
