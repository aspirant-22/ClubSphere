/**
 * @FILE: StockLedgerView.jsx
 * @RESPONSIBILITY: Immutable double-entry inventory movement audit table displaying transfers from storage rooms to customers.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx.
 * @MODIFICATION_HOTSPOT: Table columns and location node representations.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Box, RefreshCw } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';

export const StockLedgerView = () => {
  const [stockMoves, setStockMoves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStockMovements = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/merchandise/stock-ledger');
      if (response.data?.successIndicator) {
        setStockMoves(response.data.movementJournalEntries);
      }
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStockMovements();
  }, []);

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Merchandise POS', path: '/merchandise' },
    { label: 'Double-Entry Stock Ledger' }
  ];

  const actionButtons = (
    <button
      onClick={loadStockMovements}
      className="btn-secondary-action flex items-center space-x-1"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      <span>Refresh Transfers</span>
    </button>
  );

  return (
    <div
      data-component="StockLedgerView"
      data-purpose="double-entry-stock-ledger"
      className="flex flex-col h-full bg-white"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-dense-header">Transfer Code</th>
              <th className="table-dense-header">Source Order</th>
              <th className="table-dense-header">Product SKU</th>
              <th className="table-dense-header">Size</th>
              <th className="table-dense-header">Qty</th>
              <th className="table-dense-header">Source Node</th>
              <th className="table-dense-header">Destination Node</th>
              <th className="table-dense-header">Audited Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-xs text-slate-400">Loading stock journal...</td>
              </tr>
            ) : stockMoves.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-xs text-slate-400">No stock movements recorded.</td>
              </tr>
            ) : (
              stockMoves.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="table-dense-cell font-mono font-bold text-odoo-primary">
                    {m.movementTrackingCode}
                  </td>
                  <td className="table-dense-cell font-mono text-slate-700">
                    {m.sourceDocumentReference}
                  </td>
                  <td className="table-dense-cell font-bold text-slate-900">
                    {m.skuIdentifier}
                  </td>
                  <td className="table-dense-cell">
                    <span className="px-1.5 py-0.5 text-2xs font-mono font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {m.sizeVariant}
                    </span>
                  </td>
                  <td className="table-dense-cell font-semibold text-slate-900">
                    {m.quantityMoved} unit(s)
                  </td>
                  <td className="table-dense-cell text-2xs font-mono text-slate-500">
                    {m.sourceLocationNode}
                  </td>
                  <td className="table-dense-cell text-2xs font-mono font-bold text-emerald-700">
                    {m.destinationLocationNode}
                  </td>
                  <td className="table-dense-cell text-slate-500 text-2xs">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

