/**
 * @FILE: MemberCardModal.jsx
 * @RESPONSIBILITY: Digital student membership ID card modal displaying MEM/2026/XXXX tracking code and scannable QR badge.
 * @DEPENDENCIES: react, lucide-react, qrcode.
 * @MODIFICATION_HOTSPOT: Card layout and QR rendering.
 * @AUTHOR: Garima Mittal
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle, ShieldCheck, Calendar, Award } from 'lucide-react';

export const MemberCardModal = ({ membership, onClose }) => {
  const [qrImageUrl, setQrImageUrl] = useState('');

  useEffect(() => {
    if (membership) {
      const qrPayload = membership.digitalQrTokenPayload || membership.membershipSequenceCode;
      QRCode.toDataURL(qrPayload, { width: 180, margin: 1 })
        .then(setQrImageUrl)
        .catch(console.error);
    }
  }, [membership]);

  if (!membership) return null;

  return (
    <div
      data-component="MemberCardModal"
      data-purpose="digital-membership-id-card"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Card Header */}
        <div className="bg-odoo-primary text-white p-4 text-center">
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <Award className="w-4 h-4 text-amber-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Skyline Student Association</h3>
          </div>
          <p className="text-2xs text-white/80">Official Digital Membership Identity</p>
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {qrImageUrl ? (
            <img src={qrImageUrl} alt="Member QR" className="w-36 h-36 border border-slate-200 p-1.5 rounded-lg shadow-xs" />
          ) : (
            <div className="w-36 h-36 bg-slate-100 animate-pulse rounded-lg" />
          )}

          <div>
            <span className="text-2xs font-mono font-bold text-odoo-primary bg-odoo-primary/10 px-2 py-0.5 rounded border border-odoo-primary/20">
              {membership.membershipSequenceCode}
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-2">
              {membership.associatedUserId?.fullName || 'Active Student'}
            </h2>
            <p className="text-2xs text-slate-500 font-mono">
              ID: {membership.associatedUserId?.studentIdentificationNumber || 'SKY-2026'}
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-left bg-slate-50 p-2.5 rounded-md border border-slate-200 text-2xs">
            <div>
              <span className="text-slate-400 block font-semibold">Tier</span>
              <span className="text-slate-700 font-bold">{membership.membershipTier}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Valid Thru</span>
              <span className="text-slate-700 font-bold">
                {membership.membershipExpirationDate ? new Date(membership.membershipExpirationDate).toLocaleDateString() : 'Active 2026-27'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-emerald-700 text-2xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verified Active Club Status</span>
          </div>
        </div>
      </div>
    </div>
  );
};

