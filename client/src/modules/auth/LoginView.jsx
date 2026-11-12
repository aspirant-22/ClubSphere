/**
 * @FILE: LoginView.jsx
 * @RESPONSIBILITY: Enterprise sign-in view featuring a 1-click Demo Persona Switcher for President, Treasurer, Operations, and Student Member.
 * @DEPENDENCIES: react, react-router-dom, lucide-react, AuthenticationContext.jsx, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: DEMO_PERSONAS array and handlePersonaLogin.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Shield, UserCheck, KeyRound, Sparkles } from 'lucide-react';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

const DEMO_PERSONAS = [
  {
    roleName: 'Club President',
    holderName: 'Garima Mittal',
    email: 'president@skyline.edu',
    badge: 'ADMIN',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    roleName: 'Club Treasurer',
    holderName: 'Alex Vance',
    email: 'treasurer@skyline.edu',
    badge: 'ADMIN',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    roleName: 'Operations Lead',
    holderName: 'Samantha Reed',
    email: 'operations@skyline.edu',
    badge: 'OPERATIONS',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    roleName: 'Active Member',
    holderName: 'Student Member 1',
    email: 'member1@skyline.edu',
    badge: 'CUSTOMER',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
];

export const LoginView = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [passwordCredential, setPasswordCredential] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { loginUserWithCredentials } = useAuthentication();
  const { runWithProcessingLock } = useSystemProcessing();
  const navigate = useNavigate();

  const executeLogin = async (email, password) => {
    setErrorMessage('');
    try {
      await runWithProcessingLock(async () => {
        await loginUserWithCredentials(email, password);
        navigate('/memberships');
      }, 'Authenticating session...');
    } catch (err) {
      setErrorMessage(err.response?.data?.errorSummaryMessage || 'Invalid credentials.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    executeLogin(emailAddress, passwordCredential);
  };

  const handlePersonaSelect = (personaEmail) => {
    setEmailAddress(personaEmail);
    setPasswordCredential('SkylineClub2026!');
    executeLogin(personaEmail, 'SkylineClub2026!');
  };

  return (
    <div
      data-component="LoginView"
      data-purpose="user-authentication"
      className="min-h-screen w-full flex items-center justify-center bg-odoo-surface p-4"
    >
      <div className="w-full max-w-md bg-white border border-odoo-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-odoo-primary rounded-xl text-white shadow-sm mb-2">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">ClubSphere ERP</h1>
          <p className="text-xs text-slate-500">Skyline Student Association Portal</p>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Campus Email</label>
            <input
              type="email"
              required
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="e.g. president@skyline.edu"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={passwordCredential}
              onChange={(e) => setPasswordCredential(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full btn-primary-action py-2 font-semibold">
            Sign In to Workspace
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-1.5 mb-3 text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-odoo-accent" />
            <span className="text-2xs font-bold uppercase tracking-wider">1-Click Demo Persona Switcher</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.email}
                type="button"
                onClick={() => handlePersonaSelect(persona.email)}
                className="flex flex-col items-start p-2.5 text-left border border-slate-200 rounded hover:bg-slate-50 hover:border-odoo-primary/40 transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-2xs font-bold text-slate-800 group-hover:text-odoo-primary">{persona.roleName}</span>
                  <span className={`px-1 py-0.2 text-2xs font-bold uppercase rounded border ${persona.badgeClass}`}>
                    {persona.badge}
                  </span>
                </div>
                <span className="text-2xs text-slate-500 font-medium">{persona.holderName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

