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
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const dbStatus = dbStateMap[dbConnectionState] || 'disconnected';

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    data: {
      uptime: uptimeSeconds,
      serverUptimeSeconds: uptimeSeconds,
      memory: {
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        rss: memoryUsage.rss
      },
      database: dbStatus,
      databaseStatus: dbStatus.toUpperCase()
    },
    telemetry: {
      serverUptimeSeconds: uptimeSeconds,
      nodeMemoryUsageBytes: memoryUsage,
      databaseStatus: dbStatus.toUpperCase(),
      totalBufferedDiagnosticLogs: diagnosticLogRingBuffer.length,
      timestamp: new Date().toISOString()
    }
  });
});

diagnosticRouter.get('/logs', (incomingHttpRequest, outgoingHttpResponse) => {
  const logLimit = parseInt(incomingHttpRequest.query.limit, 10) || 100;
  const recentLogsSlice = diagnosticLogRingBuffer.slice(-logLimit).reverse();
  const formattedLogs = recentLogsSlice.map((l) => ({
    timestamp: l.logTimestamp,
    level: l.logLevel,
    message: `[${l.sourceModule || 'SYS'}] ${l.messageText}`
  }));

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalLogsReturned: recentLogsSlice.length,
    data: formattedLogs,
    diagnosticLogs: recentLogsSlice
  });
});

