/**
 * @FILE: TableSignupModal.jsx
 * @RESPONSIBILITY: Rapid campus table student onboarding modal with cash dues collection toggle triggering double-entry ledger postings.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Table sign-up form fields and post submission.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const TableSignupModal = ({ isOpen, onClose, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    studentIdentificationNumber: '',
    emailAddress: '',
    phoneNumber: '',
    membershipTier: 'STANDARD_ANNUAL',
    academicDepartment: 'Computer Science',
    academicYear: 'FRESHMAN',
    emergencyContactName: '',
    emergencyContactPhone: '',
    isImmediateCashCollected: true
  });
  const [errorText, setErrorText] = useState('');
  const { runWithProcessingLock } = useSystemProcessing();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    try {
      await runWithProcessingLock(async () => {
        const response = await apiNetworkClient.post('/memberships/table-signup', formData);
        if (response.data?.successIndicator) {
          onSignupSuccess(response.data.membershipRecord);
          onClose();
        }
      }, 'Registering member & posting ledger...');
    } catch (err) {
      setErrorText(err.response?.data?.errorSummaryMessage || 'Failed to complete registration.');
    }
  };

  return (
    <div
      data-component="TableSignupModal"
      data-purpose="campus-table-onboarding"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-odoo-primary" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Campus Table Sign-up POS</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorText && (
          <div className="mx-4 mt-3 p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
            {errorText}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Full Student Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Jordan Hayes"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Student ID #</label>
              <input
                type="text"
                required
                value={formData.studentIdentificationNumber}
                onChange={(e) => setFormData({ ...formData, studentIdentificationNumber: e.target.value })}
                placeholder="e.g. SKY-2026-88"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                placeholder="jordan@skyline.edu"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1-555-0199"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Membership Tier</label>
              <select
                value={formData.membershipTier}
                onChange={(e) => setFormData({ ...formData, membershipTier: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              >
                <option value="STANDARD_ANNUAL">Standard Annual (₹500)</option>
                <option value="LIFETIME">Lifetime Supporter (₹1,500)</option>
                <option value="ALUMNI_SUPPORTER">Alumni Pass (₹1,000)</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Academic Year</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              >
                <option value="FRESHMAN">Freshman</option>
                <option value="SOPHOMORE">Sophomore</option>
                <option value="JUNIOR">Junior</option>
                <option value="SENIOR">Senior</option>
                <option value="GRADUATE">Graduate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Emergency Contact Name</label>
              <input
                type="text"
                required
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="Guardian Name"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Emergency Phone</label>
              <input
                type="text"
                required
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+1-555-9000"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Cash Collection Toggle */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-900 block">Collect Dues Now in Cash</span>
              <span className="text-2xs text-emerald-700">Instantly activates membership card & credits General Ledger</span>
            </div>
            <input
              type="checkbox"
              checked={formData.isImmediateCashCollected}
              onChange={(e) => setFormData({ ...formData, isImmediateCashCollected: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-secondary-action">
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              Complete Onboarding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
