/**
 * @FILE: SalesOrderCheckoutModal.jsx
 * @RESPONSIBILITY: Streamlined apparel POS checkout modal with post-checkout celebration view and delivery status pill.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Delivery method selection, celebration view, and order checkout dispatch.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { X, ShoppingBag, Truck, CheckCircle, PackageCheck, Sparkles, Receipt } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const SalesOrderCheckoutModal = ({ isOpen, product, selectedSize, isMember, onClose, onOrderPlaced }) => {
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('CAMPUS_TABLE_PICKUP');
  const [specialDeliveryNotes, setSpecialDeliveryNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const { runWithProcessingLock } = useSystemProcessing();

  if (!isOpen || !product) return null;

  const unitPrice = isMember ? product.memberPriceAmount : product.nonMemberPriceAmount;
  const totalAmount = unitPrice * orderQuantity;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await runWithProcessingLock(async () => {
        const payload = {
          orderItems: [
            {
              productId: product._id,
              selectedSizeVariant: selectedSize,
              orderQuantity: Number(orderQuantity)
            }
          ],
          deliveryMethod,
          specialDeliveryNotes
        };
        const response = await apiNetworkClient.post('/merchandise/orders', payload);
        if (response.data?.successIndicator) {
          setConfirmedOrder(response.data.salesOrderRecord);
        }
      }, 'Processing double-entry stock move & posting order...');
    } catch (err) {
      setErrorMessage(err.response?.data?.errorSummaryMessage || 'Order failed. Insufficient inventory.');
    }
  };

  const handleFinishCelebration = () => {
    onOrderPlaced(confirmedOrder);
    setConfirmedOrder(null);
    onClose();
  };

  const renderCelebrationView = () => (
    <div className="p-6 text-center space-y-4">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Thanks for buying!</h2>
        <p className="text-xs text-slate-500 mt-0.5">Your official club apparel order is reserved.</p>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-left space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Order Tracking Code:</span>
          <span className="font-mono font-bold text-odoo-primary">{confirmedOrder.salesOrderSequenceCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Item:</span>
          <span className="font-semibold text-slate-800">{product.productName} ({selectedSize})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Quantity & Total:</span>
          <span className="font-bold text-emerald-700">{orderQuantity}x • ₹{confirmedOrder.grossTotalAmount}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-slate-500">Delivery Status:</span>
          <span className="px-2 py-0.5 rounded text-2xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            RESERVED
          </span>
        </div>
      </div>

      <button
        onClick={handleFinishCelebration}
        className="btn-primary-action w-full py-2 flex items-center justify-center space-x-1.5"
      >
        <PackageCheck className="w-4 h-4" />
        <span>View in Your Orders</span>
      </button>
    </div>
  );

  return (
    <div
      data-component="SalesOrderCheckoutModal"
      data-purpose="merchandise-checkout-pos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-odoo-primary" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {confirmedOrder ? 'Order Confirmation' : 'Merchandise POS Checkout'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-3 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
            {errorMessage}
          </div>
        )}

        {confirmedOrder ? (
          renderCelebrationView()
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="p-4 space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{product.productName}</span>
                <span className="text-xs font-mono font-bold text-odoo-primary">Size: {selectedSize}</span>
              </div>
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span>SKU: {product.skuIdentifier}</span>
                <span className="font-semibold text-slate-700">₹{unitPrice} per unit</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                  Order Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                  Fulfillment Mode
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
                >
                  <option value="CAMPUS_TABLE_PICKUP">Campus Booth Pickup</option>
                  <option value="DORM_DELIVERY">Dorm Delivery (+Campus)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">
                Delivery / Size Notes
              </label>
              <input
                type="text"
                value={specialDeliveryNotes}
                onChange={(e) => setSpecialDeliveryNotes(e.target.value)}
                placeholder="e.g. Leave with dorm hall receptionist"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>

            <div className="p-3 bg-odoo-surface border border-odoo-border rounded flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Total Purchase Value:</span>
              <span className="text-base font-bold text-odoo-primary">₹{totalAmount}</span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={onClose} className="btn-secondary-action">
                Cancel
              </button>
              <button type="submit" className="btn-primary-action">
                Confirm & Pay
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
