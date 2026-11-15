/**
 * @FILE: MembershipApplyModal.jsx
 * @RESPONSIBILITY: Online application modal allowing CUSTOMER students to submit membership requests for admin approval.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: handleApplicationSubmit and form inputs.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { X, Award, CheckCircle } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const MembershipApplyModal = ({ isOpen, onClose, onApplySuccess }) => {
  const [formData, setFormData] = useState({
    membershipTier: 'STANDARD_ANNUAL',
    academicDepartment: 'Computer Science',
    academicYear: 'FRESHMAN',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  const [errorText, setErrorText] = useState('');
  const { runWithProcessingLock } = useSystemProcessing();

  if (!isOpen) return null;

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    try {
      await runWithProcessingLock(async () => {
        const response = await apiNetworkClient.post('/memberships/apply', formData);
        if (response.data?.successIndicator) {
          onApplySuccess(response.data.membershipRecord);
          onClose();
        }
      }, 'Submitting membership application...');
    } catch (err) {
      setErrorText(err.response?.data?.errorSummaryMessage || 'Application failed.');
    }
  };

  return (
    <div
      data-component="MembershipApplyModal"
      data-purpose="student-membership-application"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-odoo-primary" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Apply for Club Membership</h3>
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

        <form onSubmit={handleApplicationSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Tier Plan</label>
              <select
                value={formData.membershipTier}
                onChange={(e) => handleFieldChange('membershipTier', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              >
                <option value="STANDARD_ANNUAL">Standard Annual (₹500)</option>
                <option value="LIFETIME">Lifetime Supporter (₹1,500)</option>
                <option value="ALUMNI_SUPPORTER">Alumni Supporter (₹1,000)</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Academic Year</label>
              <select
                value={formData.academicYear}
                onChange={(e) => handleFieldChange('academicYear', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              >
                <option value="FRESHMAN">Freshman</option>
                <option value="SOPHOMORE">Sophomore</option>
                <option value="JUNIOR">Junior</option>
                <option value="SENIOR">Senior</option>
                <option value="GRADUATE">Graduate</option>
                <option value="ALUMNI">Alumni</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Academic Department</label>
            <input
              type="text"
              required
              value={formData.academicDepartment}
              onChange={(e) => handleFieldChange('academicDepartment', e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Emergency Contact</label>
              <input
                type="text"
                required
                value={formData.emergencyContactName}
                onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
                placeholder="Guardian Name"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={formData.emergencyContactPhone}
                onChange={(e) => handleFieldChange('emergencyContactPhone', e.target.value)}
                placeholder="+1-555-0199"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-2xs text-blue-800 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>Upon submission, your application will be marked <strong>WAITING</strong>. An admin can confirm dues and elevate you to <strong>MEMBER</strong>!</span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-secondary-action">
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
