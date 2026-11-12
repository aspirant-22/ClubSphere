/**
 * @FILE: diagnostic.routes.js
 * @RESPONSIBILITY: Admin-only live telemetry endpoints providing system health, database metrics, and structured console logs.
 * @DEPENDENCIES: express, mongoose, authenticationGate.js, rbacAuthorization.js, erpConfig.js.
 * @MODIFICATION_HOTSPOT: diagnosticLogBuffer and system telemetry handlers.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import mongoose from 'mongoose';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';
import { authorizeRoleTiers, ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';
import { ERP_SYSTEM_PARAMETERS } from '../../config/erpConfig.js';
import { fetchSystemHealthMetrics } from './diagnostic.controller.js';

export const diagnosticRouter = express.Router();

const diagnosticLogRingBuffer = [];
const MAX_LOG_BUFFER_CAPACITY = ERP_SYSTEM_PARAMETERS.DIAGNOSTIC_LOG_BUFFER_CAPACITY || 500;

export const appendDiagnosticLogEntry = (logLevel, sourceModule, messageText) => {
  const logEntry = {
    logTimestamp: new Date().toISOString(),
    logLevel: logLevel.toUpperCase(),
    sourceModule,
    messageText
  };
  diagnosticLogRingBuffer.push(logEntry);
  if (diagnosticLogRingBuffer.length > MAX_LOG_BUFFER_CAPACITY) {
    diagnosticLogRingBuffer.shift();
  }
};

const originalConsoleLog = console.log;
console.log = function (...argumentsList) {
  originalConsoleLog.apply(console, argumentsList);
  const textMessage = argumentsList.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
  appendDiagnosticLogEntry('INFO', 'SYSTEM', textMessage);
};

const originalConsoleWarn = console.warn;
console.warn = function (...argumentsList) {
  originalConsoleWarn.apply(console, argumentsList);
  const textMessage = argumentsList.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
  appendDiagnosticLogEntry('WARN', 'SECURITY', textMessage);
};

diagnosticRouter.use(authenticateSessionToken);
diagnosticRouter.use(authorizeRoleTiers(ERP_USER_ROLES.ADMIN));

diagnosticRouter.get('/health', (incomingHttpRequest, outgoingHttpResponse) => {
  const dbConnectionState = mongoose.connection.readyState;
  const dbStateMap = { 0: 'DISCONNECTED', 1: 'CONNECTED', 2: 'CONNECTING', 3: 'DISCONNECTING' };

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    telemetry: {
      serverUptimeSeconds: Math.floor(process.uptime()),
      nodeMemoryUsageBytes: process.memoryUsage(),
      databaseStatus: dbStateMap[dbConnectionState] || 'UNKNOWN',
      totalBufferedDiagnosticLogs: diagnosticLogRingBuffer.length,
      timestamp: new Date().toISOString()
    }
  });
});

diagnosticRouter.get('/logs', (incomingHttpRequest, outgoingHttpResponse) => {
  const logLimit = parseInt(incomingHttpRequest.query.limit, 10) || 100;
  const recentLogsSlice = diagnosticLogRingBuffer.slice(-logLimit).reverse();

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalLogsReturned: recentLogsSlice.length,
    diagnosticLogs: recentLogsSlice
  });
});

