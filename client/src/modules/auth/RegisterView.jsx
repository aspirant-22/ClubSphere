/**
 * @FILE: RegisterView.jsx
 * @RESPONSIBILITY: Self-registration view for students registering as CUSTOMER accounts with instant authentication.
 * @DEPENDENCIES: react, react-router-dom, lucide-react, AuthenticationContext.jsx, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: handleFormSubmit and form input state.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const RegisterView = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    emailAddress: '',
    studentIdentificationNumber: '',
    passwordCredential: '',
    phoneNumber: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const { registerUserWithCredentials } = useAuthentication();
  const { runWithProcessingLock } = useSystemProcessing();
  const navigate = useNavigate();

  const handleInputChange = (fieldKey, fieldValue) => {
    setFormData((prevData) => ({ ...prevData, [fieldKey]: fieldValue }));
  };

  const executeRegistration = async (registrationData) => {
    await runWithProcessingLock(async () => {
      await registerUserWithCredentials(registrationData);
      navigate('/memberships');
    }, 'Creating student profile...');
  };

  const handleFormSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setErrorMessage('');
    try {
      await executeRegistration(formData);
    } catch (apiError) {
      const summaryMsg = apiError.response?.data?.errorSummaryMessage || 'Registration failed.';
      setErrorMessage(summaryMsg);
    }
  };

  return (
    <div
      data-component="RegisterView"
      data-purpose="student-self-registration"
      className="min-h-screen w-full flex items-center justify-center bg-odoo-surface p-4"
    >
      <div className="w-full max-w-md bg-white border border-odoo-border rounded-lg shadow-sm p-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-odoo-primary rounded-xl text-white shadow-sm mb-2">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Student Self-Registration</h1>
          <p className="text-xs text-slate-500">Create your ClubSphere account (Guest / Customer Tier)</p>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Full Student Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Student ID #</label>
            <input
              type="text"
              required
              value={formData.studentIdentificationNumber}
              onChange={(e) => handleInputChange('studentIdentificationNumber', e.target.value)}
              placeholder="e.g. SKY-2026-99"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Campus Email</label>
            <input
              type="email"
              required
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
              placeholder="e.g. rahul@skyline.edu"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.passwordCredential}
              onChange={(e) => handleInputChange('passwordCredential', e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Phone Number (Optional)</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+1-555-0188"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-2xs text-amber-800 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Registers as <strong>CUSTOMER</strong>. You can buy Gala tickets and Merch at guest prices, and apply for full membership anytime!</span>
          </div>

          <button type="submit" className="w-full btn-primary-action py-2 font-semibold">
            Complete Registration
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-200">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs text-odoo-primary hover:underline font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Already have an account? Sign in here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
