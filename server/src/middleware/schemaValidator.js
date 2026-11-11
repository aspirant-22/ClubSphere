/**
 * @FILE: schemaValidator.js
 * @RESPONSIBILITY: Universal Zod schema validation middleware intercepting network payloads at the route gate.
 * @DEPENDENCIES: zod.
 * @MODIFICATION_HOTSPOT: validateRequestBody and validateRequestQuery interceptors.
 * @AUTHOR: Garima Mittal
 */

export const validateRequestBody = (targetZodSchema) => {
  return async (incomingHttpRequest, outgoingHttpResponse, nextMiddlewareFunction) => {
    try {
      const parsedValidatedBody = await targetZodSchema.parseAsync(incomingHttpRequest.body);
      incomingHttpRequest.body = parsedValidatedBody;
      return nextMiddlewareFunction();
    } catch (zodValidationError) {
      console.warn(`[Validation Gate]: Payload rejected on ${incomingHttpRequest.method} ${incomingHttpRequest.originalUrl}`);
      const formattedFieldErrors = zodValidationError.errors.map((individualError) => ({
        propertyFieldPath: individualError.path.join('.'),
        rejectionMessage: individualError.message
      }));

      return outgoingHttpResponse.status(400).json({
        successIndicator: false,
        errorCodeIdentifier: 'VALIDATION_FAILED',
        errorSummaryMessage: 'Malformed request payload. Ingestion validation rejected.',
        validationFieldFailures: formattedFieldErrors
      });
    }
  };
};

export const validateRequestQuery = (targetZodSchema) => {
  return async (incomingHttpRequest, outgoingHttpResponse, nextMiddlewareFunction) => {
    try {
      const parsedValidatedQuery = await targetZodSchema.parseAsync(incomingHttpRequest.query);
      incomingHttpRequest.query = parsedValidatedQuery;
      return nextMiddlewareFunction();
    } catch (zodValidationError) {
      console.warn(`[Validation Gate]: Query rejected on ${incomingHttpRequest.originalUrl}`);
      return outgoingHttpResponse.status(400).json({
        successIndicator: false,
        errorCodeIdentifier: 'QUERY_VALIDATION_FAILED',
        errorSummaryMessage: 'Invalid query string parameters provided.',
        validationFieldFailures: zodValidationError.errors
      });
    }
  };
};

