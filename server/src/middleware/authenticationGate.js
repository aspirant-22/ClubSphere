/**
 * @FILE: authenticationGate.js
 * @RESPONSIBILITY: HTTP-Only cookie JWT verification middleware securing route sessions against tampering.
 * @DEPENDENCIES: jsonwebtoken, mongoose.
 * @MODIFICATION_HOTSPOT: authenticateSessionToken middleware logic.
 * @AUTHOR: Garima Mittal
 */

import jwt from 'jsonwebtoken';

export const authenticateSessionToken = (
  incomingHttpRequest,
  outgoingHttpResponse,
  nextMiddlewareFunction
) => {
  const jwtSessionCookie = incomingHttpRequest.cookies?.clubsphere_session_token;
  const authorizationHeader = incomingHttpRequest.headers.authorization;
  const bearerTokenString = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.split(' ')[1]
    : null;

  const activeAuthenticationToken = jwtSessionCookie || bearerTokenString;

  if (!activeAuthenticationToken) {
    return outgoingHttpResponse.status(401).json({
      successIndicator: false,
      errorCodeIdentifier: 'AUTH_TOKEN_MISSING',
      errorSummaryMessage: 'Authentication required. No valid HTTP-Only session token located.'
    });
  }

  const jwtSigningSecret = process.env.JWT_SECRET_KEY || 'clubsphere_enterprise_super_secret_jwt_key_2026_skyline';

  try {
    const decodedTokenPayload = jwt.verify(activeAuthenticationToken, jwtSigningSecret);
    incomingHttpRequest.authenticatedUser = decodedTokenPayload;
    return nextMiddlewareFunction();
  } catch (tokenVerificationError) {
    console.warn(`[Auth Gate]: Invalid token presented: ${tokenVerificationError.message}`);
    return outgoingHttpResponse.status(401).json({
      successIndicator: false,
      errorCodeIdentifier: 'AUTH_TOKEN_EXPIRED_OR_INVALID',
      errorSummaryMessage: 'Session expired or signature invalid. Please sign in again.'
    });
  }
};
