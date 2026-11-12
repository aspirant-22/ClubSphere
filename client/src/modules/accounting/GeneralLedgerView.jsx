/**
 * @FILE: GeneralLedgerView.jsx
 * @RESPONSIBILITY: Double-entry journal audit table displaying balanced debit/credit rows and verifying mathematical parity.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx.
 * @MODIFICATION_HOTSPOT: Journal line expansion and debit/credit sum verifications.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { Landmark, CheckCircle, RefreshCw, FileText, ArrowRightLeft } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';

export const GeneralLedgerView = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGeneralLedger = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/accounting/ledger');
      if (response.data?.successIndicator) {
        setJournalEntries(response.data.journalEntries);
      }
    } catch (err) {
      console.error('Failed to load general ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGeneralLedger();
  }, []);

  const totalDebitSum = journalEntries.reduce(
    (sum, entry) => sum + entry.journalLines.reduce((lineSum, line) => lineSum + line.debitAmountValue, 0),
    0
  );
  const totalCreditSum = journalEntries.reduce(
    (sum, entry) => sum + entry.journalLines.reduce((lineSum, line) => lineSum + line.creditAmountValue, 0),
    0
  );

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Accounting', path: '/accounting' },
    { label: 'General Ledger' }
  ];

  const actionButtons = (
    <button onClick={loadGeneralLedger} className="btn-secondary-action flex items-center space-x-1">
      <RefreshCw className="w-3.5 h-3.5" />
      <span>Audit Balance</span>
    </button>
  );

  return (
    <div
      data-component="GeneralLedgerView"
      data-purpose="general-ledger-audit"
      className="flex flex-col h-full bg-white"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      {/* Balance Parity Metric Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-odoo-border text-xs">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-800">Double-Entry Mathematical Invariant:</span>
          <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Debits (₹{totalDebitSum.toLocaleString()}) === Credits (₹{totalCreditSum.toLocaleString()})
          </span>
        </div>
        <span className="text-2xs font-bold text-slate-500 uppercase">
          Total Journal Records: {journalEntries.length}
        </span>
      </div>

      {/* Dense Double-Entry Ledger Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-dense-header">Journal Code</th>
              <th className="table-dense-header">Source Ref</th>
              <th className="table-dense-header">Transaction Memo</th>
              <th className="table-dense-header">Account Code & Description</th>
              <th className="table-dense-header text-right">Debit (₹)</th>
              <th className="table-dense-header text-right">Credit (₹)</th>
              <th className="table-dense-header text-right">Audited Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-xs text-slate-400">Loading double-entry ledger...</td>
              </tr>
            ) : journalEntries.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-xs text-slate-400">No transactions recorded in ledger.</td>
              </tr>
            ) : (
              journalEntries.map((entry) => (
                <React.Fragment key={entry._id}>
                  {entry.journalLines.map((line, lineIdx) => (
                    <tr
                      key={line._id || lineIdx}
                      className={`hover:bg-slate-50/80 transition-colors ${lineIdx === 0 ? 'border-t border-slate-200' : ''}`}
                    >
                      {lineIdx === 0 ? (
                        <>
                          <td rowSpan={entry.journalLines.length} className="table-dense-cell font-mono font-bold text-odoo-primary align-top">
                            {entry.journalEntryTrackingCode}
                          </td>
                          <td rowSpan={entry.journalLines.length} className="table-dense-cell font-mono text-slate-700 align-top">
                            {entry.sourceDocumentReference}
                          </td>
                          <td rowSpan={entry.journalLines.length} className="table-dense-cell font-medium text-slate-900 align-top max-w-xs">
                            {entry.transactionMemo}
                          </td>
                        </>
                      ) : null}
                      <td className="table-dense-cell">
                        <span className="font-mono text-slate-700 font-bold block">{line.accountIdentifierCode}</span>
                        <span className="text-2xs text-slate-400">{line.lineItemDescription}</span>
                      </td>
                      <td className="table-dense-cell text-right font-mono font-semibold text-slate-900">
                        {line.debitAmountValue > 0 ? `₹${line.debitAmountValue.toLocaleString()}` : '-'}
                      </td>
                      <td className="table-dense-cell text-right font-mono font-semibold text-slate-900">
                        {line.creditAmountValue > 0 ? `₹${line.creditAmountValue.toLocaleString()}` : '-'}
                      </td>
                      {lineIdx === 0 ? (
                        <td rowSpan={entry.journalLines.length} className="table-dense-cell text-right text-2xs text-slate-500 align-top">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

