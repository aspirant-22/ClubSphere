/**
 * @FILE: ProcessingOverlay.jsx
 * @RESPONSIBILITY: Global visual backdrop spinner locking UI interactions during active ERP transactions.
 * @DEPENDENCIES: react, lucide-react, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Spinner UI and accessibility attributes.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const ProcessingOverlay = () => {
  const { isSystemProcessing, processingStatusMessage } = useSystemProcessing();

  if (!isSystemProcessing) {
    return null;
  }

  return (
    <div
      data-component="ProcessingOverlay"
      data-purpose="block-double-clicks"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-xs select-none"
    >
      <div className="bg-white px-6 py-5 rounded-lg shadow-2xl border border-slate-200 flex flex-col items-center gap-3 max-w-sm text-center">
        <Loader2 className="w-8 h-8 text-odoo-primary animate-spin" />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-800 tracking-tight">System Working</p>
          <p className="text-2xs text-slate-500 font-mono">{processingStatusMessage}</p>
        </div>
      </div>
    </div>
  );
};

