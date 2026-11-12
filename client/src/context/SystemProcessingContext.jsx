/**
 * @FILE: SystemProcessingContext.jsx
 * @RESPONSIBILITY: Global React execution state providing isSystemProcessing backdrop to block double-clicks and race conditions.
 * @DEPENDENCIES: react.
 * @MODIFICATION_HOTSPOT: runWithProcessingLock execution wrapper.
 * @AUTHOR: Garima Mittal
 */

import React, { createContext, useContext, useState } from 'react';

const SystemProcessingContext = createContext(null);

export const SystemProcessingProvider = ({ children }) => {
  const [isSystemProcessing, setIsSystemProcessing] = useState(false);
  const [processingStatusMessage, setProcessingStatusMessage] = useState('Processing ERP transaction...');

  const activateProcessingState = (statusMessage = 'Executing transaction...') => {
    setProcessingStatusMessage(statusMessage);
    setIsSystemProcessing(true);
  };

  const releaseProcessingState = () => {
    setIsSystemProcessing(false);
  };

  const runWithProcessingLock = async (asyncOperationCallback, statusMessage) => {
    activateProcessingState(statusMessage);
    try {
      const operationResult = await asyncOperationCallback();
      return operationResult;
    } finally {
      releaseProcessingState();
    }
  };

  const contextValue = {
    isSystemProcessing,
    processingStatusMessage,
    activateProcessingState,
    releaseProcessingState,
    runWithProcessingLock
  };

  return (
    <SystemProcessingContext.Provider value={contextValue}>
      {children}
      {isSystemProcessing && (
        <div
          data-component="ProcessingOverlay"
          data-purpose="block-double-clicks"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs cursor-wait"
        >
          <div className="flex flex-col items-center px-6 py-4 bg-white rounded-lg shadow-xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-odoo-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold text-slate-700 tracking-wide">{processingStatusMessage}</p>
          </div>
        </div>
      )}
    </SystemProcessingContext.Provider>
  );
};

export const useSystemProcessing = () => {
  const processingContext = useContext(SystemProcessingContext);
  if (!processingContext) {
    throw new Error('useSystemProcessing must be used within a SystemProcessingProvider');
  }
  return processingContext;
};

