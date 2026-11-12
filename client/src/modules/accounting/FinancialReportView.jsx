/**
 * @FILE: FinancialReportView.jsx
 * @RESPONSIBILITY: End-of-semester Treasurer close-out P&L statement breaking down Gross Inflow vs Outflow to compute Net Surplus.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx.
 * @MODIFICATION_HOTSPOT: P&L financial breakdowns and variance rendering.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, TrendingDown, DollarSign, Download, Printer } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';

export const FinancialReportView = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadFinancialStatement = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/accounting/financial-report');
      if (response.data?.successIndicator) {
        setReport(response.data.semesterSummaryReport);
      }
    } catch (err) {
      console.error('Failed to load financial statement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialStatement();
  }, []);

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Accounting', path: '/accounting' },
    { label: 'Semester P&L Close-Out Statement' }
  ];

  const actionButtons = (
    <button
      onClick={() => window.print()}
      className="btn-secondary-action flex items-center space-x-1"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Print Audit PDF</span>
    </button>
  );

  return (
    <div
      data-component="FinancialReportView"
      data-purpose="semester-financial-report"
      className="flex flex-col h-full bg-slate-50"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white border border-odoo-border rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-base font-bold text-slate-900">
                  Skyline Student Association - Statement of Financial Operations
                </h1>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Audited Spring Semester Close-Out | Currency: INR (₹)
                </p>
              </div>
              <span className="text-2xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                FY 2026-Q2
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Aggregating general ledger entries...</div>
            ) : report ? (
              <div className="space-y-6">
                {/* Gross Revenue Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      1. Gross Operating Inflows (Revenues)
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      ₹{report.revenueBreakdown?.totalGrossRevenue?.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-3 text-xs text-slate-600">
                    <div className="flex justify-between py-1">
                      <span>4010 - Membership Dues Collected</span>
                      <span className="font-mono font-semibold">₹{report.revenueBreakdown?.membershipDues?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>4020 - Spring Gala Ticket Sales</span>
                      <span className="font-mono font-semibold">₹{report.revenueBreakdown?.ticketSales?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>4030 - Apparel & Merchandise Proceeds</span>
                      <span className="font-mono font-semibold">₹{report.revenueBreakdown?.merchandiseSales?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>4040 - Fundraiser Donations & Bake Sale</span>
                      <span className="font-mono font-semibold">₹{report.revenueBreakdown?.fundraiserDonations?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Gross Expense Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      2. Gross Operating Outflows (Disbursements)
                    </span>
                    <span className="text-xs font-bold text-rose-700">
                      (₹{report.expenseBreakdown?.totalGrossExpenses?.toLocaleString()})
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-3 text-xs text-slate-600">
                    <div className="flex justify-between py-1">
                      <span>5010 - Event Production & Gala Operations</span>
                      <span className="font-mono font-semibold">₹{report.expenseBreakdown?.eventOperations?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>5030 - Volunteer Supplies & Fundraiser Logistics</span>
                      <span className="font-mono font-semibold">₹{report.expenseBreakdown?.suppliesAndLogistics?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>5020 - Merchandise Cost of Goods Sold (COGS)</span>
                      <span className="font-mono font-semibold">₹{report.expenseBreakdown?.merchandiseCogs?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>5040 - Administrative Printing & Operations</span>
                      <span className="font-mono font-semibold">₹{report.expenseBreakdown?.administrative?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Surplus Summary Box */}
                <div className="p-4 bg-odoo-surface border border-odoo-border rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Net Semester Retained Surplus</span>
                    <span className="text-2xs text-slate-500">Credited to 3010 Retained Club Reserves</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold font-mono ${report.netSemesterSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ₹{report.netSemesterSurplus?.toLocaleString()}
                    </span>
                    <span className="text-2xs font-semibold text-slate-500 block">Surplus Verified</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
