/**
 * @FILE: OfflineAlertBanner.jsx
 * @RESPONSIBILITY: Top-docked warning banner triggered during server timeout, 500 error, or cloud node connectivity drop.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js.
 * @MODIFICATION_HOTSPOT: Alert message text and dismiss handlers.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { registerOfflineAlertHandler } from '../../services/apiNetworkClient.js';

export const OfflineAlertBanner = () => {
  const [offlineStatus, setOfflineStatus] = useState({ isOffline: false, message: '' });

  useEffect(() => {
    registerOfflineAlertHandler((statusUpdate) => {
      setOfflineStatus(statusUpdate);
    });
  }, []);

  if (!offlineStatus.isOffline) {
    return null;
  }

  return (
    <div
      data-component="OfflineAlertBanner"
      data-purpose="latency-and-downtime-alert"
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-amber-500 text-slate-950 font-medium text-xs shadow-md animate-pulse"
    >
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>{offlineStatus.message || '⚠️ [ERP System Alert]: Cloud Node latency detected. Transitioning to fallback offline processing state.'}</span>
      </div>
      <button
        onClick={() => setOfflineStatus({ isOffline: false, message: '' })}
        className="p-1 hover:bg-amber-600/30 rounded transition-colors"
        title="Dismiss alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

