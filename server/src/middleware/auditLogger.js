/**
 * @FILE: auditLogger.js
 * @RESPONSIBILITY: Enterprise audit trail logger appending actor and execution metrics to diagnostic buffers.
 * @DEPENDENCIES: diagnostic.routes.js
 * @MODIFICATION_HOTSPOT: logAuditEvent middleware.
 * @AUTHOR: Garima Mittal
 */

import { appendDiagnosticLogEntry } from '../modules/diagnostics/diagnostic.routes.js';

export const auditLogger = (incomingRequest, outgoingResponse, nextMiddleware) => {
  const requestStartTime = Date.now();
  const requestMethod = incomingRequest.method;
  const requestUrl = incomingRequest.originalUrl || incomingRequest.url;

  outgoingResponse.on('finish', () => {
    const processingDuration = Date.now() - requestStartTime;
    const responseStatusCode = outgoingResponse.statusCode;
    const userIdentifier = incomingRequest.userSession?.userId || 'ANONYMOUS';

    const auditMessage = `${requestMethod} ${requestUrl} [${responseStatusCode}] - ${processingDuration}ms - User: ${userIdentifier}`;
    const logLevel = responseStatusCode >= 400 ? 'WARN' : 'INFO';

    appendDiagnosticLogEntry(logLevel, 'AUDIT_LOG', auditMessage);
  });

  return nextMiddleware();
};
