/**
 * @FILE: auth.controller.js
 * @RESPONSIBILITY: Express controllers managing HTTP-Only cookies, authentication endpoints, and session profile lookups.
 * @DEPENDENCIES: auth.service.js, auth.model.js.
 * @MODIFICATION_HOTSPOT: Cookie configuration and response mapping.
 * @AUTHOR: Garima Mittal
 */

import { registerNewStudentAccount, authenticateUserCredentials } from './auth.service.js';
import { UserModel } from './auth.model.js';

const SESSION_COOKIE_NAME = 'clubsphere_session_token';

const setSessionHttpOnlyCookie = (outgoingHttpResponse, sessionJwtToken) => {
  const isProductionMode = process.env.NODE_ENV === 'production';
  const cookieLifespanMs = 24 * 60 * 60 * 1000;

  outgoingHttpResponse.cookie(SESSION_COOKIE_NAME, sessionJwtToken, {
    httpOnly: true,
    secure: isProductionMode,
    sameSite: isProductionMode ? 'strict' : 'lax',
    maxAge: cookieLifespanMs
  });
};

export const handleUserRegistration = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const { createdUserRecord, signedSessionJwt } = await registerNewStudentAccount(incomingHttpRequest.body);
    setSessionHttpOnlyCookie(outgoingHttpResponse, signedSessionJwt);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Student account registered successfully.',
      sessionToken: signedSessionJwt,
      userProfile: {
        userId: createdUserRecord._id,
        fullName: createdUserRecord.fullName,
        emailAddress: createdUserRecord.emailAddress,
        studentIdentificationNumber: createdUserRecord.studentIdentificationNumber,
        userRoleTier: createdUserRecord.userRoleTier
      }
    });
  } catch (registrationError) {
    const statusCodeNumber = registrationError.statusCode || 500;
    return outgoingHttpResponse.status(statusCodeNumber).json({
      successIndicator: false,
      errorCodeIdentifier: registrationError.errorCode || 'REGISTRATION_ERROR',
      errorSummaryMessage: registrationError.message
    });
  }
};

export const handleUserLogin = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const { authenticatedUser, signedSessionJwt } = await authenticateUserCredentials(incomingHttpRequest.body);
    setSessionHttpOnlyCookie(outgoingHttpResponse, signedSessionJwt);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: 'Authentication successful. Session established.',
      sessionToken: signedSessionJwt,
      userProfile: {
        userId: authenticatedUser._id,
        fullName: authenticatedUser.fullName,
        emailAddress: authenticatedUser.emailAddress,
        studentIdentificationNumber: authenticatedUser.studentIdentificationNumber,
        userRoleTier: authenticatedUser.userRoleTier
      }
    });
  } catch (authenticationError) {
    const statusCodeNumber = authenticationError.statusCode || 401;
    return outgoingHttpResponse.status(statusCodeNumber).json({
      successIndicator: false,
      errorCodeIdentifier: authenticationError.errorCode || 'AUTHENTICATION_FAILED',
      errorSummaryMessage: authenticationError.message
    });
  }
};

export const handleUserLogout = async (incomingHttpRequest, outgoingHttpResponse) => {
  outgoingHttpResponse.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax'
  });
  console.log('[Auth Controller]: User session terminated and cookie cleared.');
  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    statusMessage: 'Session cleared successfully. Logged out.'
  });
};

export const handleFetchAuthenticatedUserProfile = async (incomingHttpRequest, outgoingHttpResponse) => {
  const activeTokenPayload = incomingHttpRequest.authenticatedUser;
  const targetUserRecord = await UserModel.findById(activeTokenPayload.userId).select('-passwordCredentialHash');

  if (!targetUserRecord) {
    return outgoingHttpResponse.status(404).json({
      successIndicator: false,
      errorCodeIdentifier: 'USER_NOT_FOUND',
      errorSummaryMessage: 'The authenticated user profile could not be located in database.'
    });
  }

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    userProfile: targetUserRecord
  });
};
