/**
 * @FILE: DoorScannerView.jsx
 * @RESPONSIBILITY: High-velocity door admission scanner terminal supporting TKT/2026/XXXX input, instant verification, and duplicate entry alerts.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: handleScanAdmission and scanner gate settings.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useRef, useEffect } from 'react';
import { QrCode, CheckCircle2, AlertOctagon, RotateCcw, ScanLine } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const DoorScannerView = () => {
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [gateLocation, setGateLocation] = useState('MAIN_ENTRANCE_DOOR');
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const inputRef = useRef(null);
  const { runWithProcessingLock } = useSystemProcessing();

  useEffect(() => {
    inputRef.current?.focus();
  }, [scanResult]);

  const handleScanAdmission = async (e) => {
    e?.preventDefault();
    if (!ticketCodeInput.trim()) return;

    const codeToVerify = ticketCodeInput.trim().toUpperCase();
    try {
      await runWithProcessingLock(async () => {
        const response = await apiNetworkClient.post('/events/tickets/validate-qr', {
          ticketTrackingCode: codeToVerify,
          gateScannerLocation: gateLocation
        });

        const resultData = response.data?.admissionResult || { isAdmitted: true, message: 'Admitted' };
        setScanResult(resultData);
        setScanHistory((prev) => [resultData, ...prev.slice(0, 9)]);
        setTicketCodeInput('');
      }, 'Validating ticket at door...');
    } catch (err) {
      const errorResult = err.response?.data?.admissionResult || {
        isAdmitted: false,
        validationVerdict: 'ERROR',
        message: err.response?.data?.errorSummaryMessage || 'Invalid ticket code presented.'
      };
      setScanResult(errorResult);
      setScanHistory((prev) => [errorResult, ...prev.slice(0, 9)]);
      setTicketCodeInput('');
    }
  };

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Events', path: '/events' },
    { label: 'Gate Scanner Terminal' }
  ];

  return (
    <div
      data-component="DoorScannerView"
      data-purpose="door-admission-scanner"
      className="flex flex-col h-full bg-slate-100"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} />

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Scanner Input Panel */}
        <div className="bg-white border border-odoo-border rounded-lg shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ScanLine className="w-5 h-5 text-odoo-primary" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Rapid Gate Scanner Terminal</h2>
            </div>
            <select
              value={gateLocation}
              onChange={(e) => setGateLocation(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 font-semibold text-slate-700"
            >
              <option value="MAIN_ENTRANCE_DOOR">Main Entrance Door</option>
              <option value="VIP_EXECUTIVE_GATE">VIP Executive Gate</option>
              <option value="QUAD_NORTH_ENTRANCE">Quad North Entrance</option>
            </select>
          </div>

          <form onSubmit={handleScanAdmission} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={ticketCodeInput}
              onChange={(e) => setTicketCodeInput(e.target.value)}
              placeholder="Scan QR or enter tracking code (e.g. TKT/2026/0001)..."
              className="flex-1 px-3.5 py-2 text-sm font-mono border-2 border-slate-300 rounded-md focus:border-odoo-primary focus:outline-none"
            />
            <button type="submit" className="btn-primary-action px-6 font-bold text-xs">
              Verify Admission
            </button>
          </form>
        </div>

        {/* Live Admission Feedback Screen */}
        {scanResult && (
          <div
            className={`p-6 rounded-lg border shadow-sm transition-all text-center space-y-2 ${
              scanResult.isAdmitted
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 animate-in zoom-in-95'
                : 'bg-rose-50 border-rose-300 text-rose-950 animate-in shake'
            }`}
          >
            <div className="flex justify-center">
              {scanResult.isAdmitted ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-bounce" />
              ) : (
                <AlertOctagon className="w-16 h-16 text-rose-600" />
              )}
            </div>
            <h3 className="text-lg font-bold">
              {scanResult.isAdmitted ? 'ADMISSION GRANTED' : 'ENTRY REJECTED'}
            </h3>
            <p className="text-xs font-medium max-w-md mx-auto">{scanResult.message}</p>
            {scanResult.targetTicket && (
              <div className="pt-2 text-2xs font-mono text-slate-600">
                Ticket: {scanResult.targetTicket.ticketTrackingCode} | Tier: {scanResult.targetTicket.tierName}
              </div>
            )}
          </div>
        )}

        {/* Recent Scan Audit Ledger */}
        <div className="bg-white border border-odoo-border rounded-lg shadow-sm p-4 space-y-3">
          <h4 className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Recent Gate Scans (Session Audit)</h4>
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {scanHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No scans recorded in current terminal session.</p>
            ) : (
              scanHistory.map((scan, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center space-x-2">
                    {scan.isAdmitted ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800">{scan.targetTicket?.ticketTrackingCode || 'SCAN'}</span>
                  </div>
                  <span className="text-2xs text-slate-500 truncate max-w-xs">{scan.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

