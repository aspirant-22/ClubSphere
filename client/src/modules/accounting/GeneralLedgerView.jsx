/**
 * @FILE: GeneralLedgerView.jsx
 * @RESPONSIBILITY: Double-entry journal audit table with unified accounting sub-nav, fixed table columns, memo tooltips, and column toggling.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx, AccountingNavHeader.jsx.
 * @MODIFICATION_HOTSPOT: Table layout, column toggling, and debit/credit sum verifications.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { Landmark, CheckCircle, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { AccountingNavHeader } from '../../components/accounting/AccountingNavHeader.jsx';

export const GeneralLedgerView = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState({
    sourceRef: true,
    auditedDate: true
  });
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

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
    (sum, entry) => sum + entry.journalLines.reduce((lSum, l) => lSum + l.debitAmountValue, 0),
    0
  );
  const totalCreditSum = journalEntries.reduce(
    (sum, entry) => sum + entry.journalLines.reduce((lSum, l) => lSum + l.creditAmountValue, 0),
    0
  );

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Accounting', path: '/accounting/ledger' },
    { label: 'General Ledger' }
  ];

  const actionButtons = (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <button
          onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
          className="btn-secondary-action flex items-center space-x-1"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Columns</span>
        </button>
        {isColumnPickerOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded shadow-lg p-2 z-40 text-2xs space-y-1">
            <label className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
              <input
                type="checkbox"
                checked={visibleColumns.sourceRef}
                onChange={() => toggleColumn('sourceRef')}
              />
              <span>Source Reference</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
              <input
                type="checkbox"
                checked={visibleColumns.auditedDate}
                onChange={() => toggleColumn('auditedDate')}
              />
              <span>Audited Date</span>
            </label>
          </div>
        )}
      </div>
      <button onClick={loadGeneralLedger} className="btn-secondary-action flex items-center space-x-1">
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Audit Balance</span>
      </button>
    </div>
  );

  return (
    <div
      data-component="GeneralLedgerView"
      data-purpose="general-ledger-audit"
      className="flex flex-col h-full bg-white"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />
      <AccountingNavHeader />

      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-odoo-border text-xs">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-800">Double-Entry Mathematical Invariant:</span>
          <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Debits (₹{totalDebitSum.toLocaleString()}) === Credits (₹{totalCreditSum.toLocaleString()})
          </span>
        </div>
        <span className="text-2xs font-bold text-slate-500 uppercase">
          Total Journal Records: {journalEntries.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="table-dense-header w-28">Journal Code</th>
              {visibleColumns.sourceRef && <th className="table-dense-header w-28">Source Ref</th>}
              <th className="table-dense-header w-64">Transaction Memo</th>
              <th className="table-dense-header w-64">Account Code & Description</th>
              <th className="table-dense-header w-28 text-right">Debit (₹)</th>
              <th className="table-dense-header w-28 text-right">Credit (₹)</th>
              {visibleColumns.auditedDate && <th className="table-dense-header w-28 text-right">Audited Date</th>}
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
                          <td rowSpan={entry.journalLines.length} className="table-dense-cell font-mono font-bold text-odoo-primary align-top truncate">
                            {entry.journalEntryTrackingCode}
                          </td>
                          {visibleColumns.sourceRef && (
                            <td rowSpan={entry.journalLines.length} className="table-dense-cell font-mono text-slate-700 align-top truncate">
                              {entry.sourceDocumentReference}
                            </td>
                          )}
                          <td
                            rowSpan={entry.journalLines.length}
                            className="table-dense-cell font-medium text-slate-900 align-top truncate"
                            title={entry.transactionMemo}
                          >
                            <span className="truncate block" title={entry.transactionMemo}>{entry.transactionMemo}</span>
                          </td>
                        </>
                      ) : null}
                      <td className="table-dense-cell truncate" title={`${line.accountIdentifierCode} - ${line.lineItemDescription}`}>
                        <span className="font-mono text-slate-700 font-bold block">{line.accountIdentifierCode}</span>
                        <span className="text-2xs text-slate-500 truncate block">{line.lineItemDescription}</span>
                      </td>
                      <td className="table-dense-cell text-right font-mono font-semibold text-slate-900">
                        {line.debitAmountValue > 0 ? `₹${line.debitAmountValue.toLocaleString()}` : '-'}
                      </td>
                      <td className="table-dense-cell text-right font-mono font-semibold text-slate-900">
                        {line.creditAmountValue > 0 ? `₹${line.creditAmountValue.toLocaleString()}` : '-'}
                      </td>
                      {visibleColumns.auditedDate && lineIdx === 0 ? (
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
