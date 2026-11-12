/**
 * @FILE: errorHandler.js
 * @RESPONSIBILITY: Centralized enterprise error handler catching unhandled exceptions and formatting structured JSON responses.
 * @DEPENDENCIES: None.
 * @MODIFICATION_HOTSPOT: globalErrorHandler error mapping.
 * @AUTHOR: Garima Mittal
 */

export const globalErrorHandler = (errorInstance, incomingRequest, outgoingResponse, nextMiddleware) => {
  const statusCode = errorInstance.statusCode || errorInstance.status || 500;
  const errorCodeIdentifier = errorInstance.errorCodeIdentifier || 'INTERNAL_SERVER_ERROR';
  const errorMessage = errorInstance.message || 'An unexpected error occurred during ERP processing.';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERP Error Handler]: ${statusCode} - ${errorCodeIdentifier}: ${errorMessage}`);
  }

  return outgoingResponse.status(statusCode).json({
    successIndicator: false,
    errorCodeIdentifier,
    errorSummaryMessage: errorMessage,
    errorDetails: errorInstance.details || null,
    serverTimestamp: new Date().toISOString()
  });
};

