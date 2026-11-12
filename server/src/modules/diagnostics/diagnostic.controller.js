/**
 * @FILE: diagnostic.controller.js
 * @RESPONSIBILITY: HTTP controllers for system telemetry, memory usage, and ring-buffer log streaming.
 * @DEPENDENCIES: diagnostic.routes.js
 * @MODIFICATION_HOTSPOT: streamDiagnosticLogs and fetchSystemHealthMetrics.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';

export const fetchSystemHealthMetrics = (incomingRequest, outgoingResponse) => {
  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = process.uptime();
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return outgoingResponse.status(200).json({
    successIndicator: true,
    data: {
      serverUptimeSeconds: uptimeSeconds,
      memoryMetrics: {
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      databaseConnectionStatus: dbState,
      nodeEnvironment: process.env.NODE_ENV || 'development'
    }
  });
};

