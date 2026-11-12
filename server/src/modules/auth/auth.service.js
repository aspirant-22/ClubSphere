/**
 * @FILE: auth.service.js
 * @RESPONSIBILITY: Authentication business logic for account creation, credential checks, and JWT token issuance.
 * @DEPENDENCIES: auth.model.js, jsonwebtoken, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: registerNewStudentAccount and authenticateUserCredentials.
 * @AUTHOR: Garima Mittal
 */

import jwt from 'jsonwebtoken';
import { UserModel } from './auth.model.js';
import { ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const generateSignedSessionToken = (userDocument) => {
  const jwtSigningSecret = process.env.JWT_SECRET_KEY || 'clubsphere_enterprise_super_secret_jwt_key_2026_skyline';
  const tokenExpirationHours = process.env.JWT_EXPIRATION_HOURS || '24h';

  const tokenPayload = {
    userId: userDocument._id.toString(),
    emailAddress: userDocument.emailAddress,
    userRoleTier: userDocument.userRoleTier,
    fullName: userDocument.fullName,
    studentIdentificationNumber: userDocument.studentIdentificationNumber
  };

  return jwt.sign(tokenPayload, jwtSigningSecret, { expiresIn: tokenExpirationHours });
};

export const registerNewStudentAccount = async (registrationPayload) => {
  const existingUserAccount = await UserModel.findOne({
    $or: [
      { emailAddress: registrationPayload.emailAddress.toLowerCase() },
      { studentIdentificationNumber: registrationPayload.studentIdentificationNumber.toUpperCase() }
    ]
  });

  if (existingUserAccount) {
    console.warn(`[Auth Service]: Duplicate registration attempted: ${registrationPayload.emailAddress}`);
    const duplicateConflictError = new Error('A student account with this email or student ID already exists.');
    duplicateConflictError.statusCode = 409;
    duplicateConflictError.errorCode = 'ACCOUNT_ALREADY_EXISTS';
    throw duplicateConflictError;
  }

  const createdUserRecord = await UserModel.create({
    fullName: registrationPayload.fullName,
    studentIdentificationNumber: registrationPayload.studentIdentificationNumber.toUpperCase(),
    emailAddress: registrationPayload.emailAddress.toLowerCase(),
    passwordCredentialHash: registrationPayload.passwordCredential,
    phoneNumber: registrationPayload.phoneNumber,
    userRoleTier: registrationPayload.userRoleTier || ERP_USER_ROLES.CUSTOMER
  });

  console.log(`[Auth Service]: Successfully registered student account: ${createdUserRecord.emailAddress}`);
  const signedSessionJwt = generateSignedSessionToken(createdUserRecord);
  return { createdUserRecord, signedSessionJwt };
};

export const authenticateUserCredentials = async (loginCredentials) => {
  const matchedUserRecord = await UserModel.findOne({
    emailAddress: loginCredentials.emailAddress.toLowerCase()
  });

  if (!matchedUserRecord) {
    console.warn(`[Auth Service]: Login failed: User not found for ${loginCredentials.emailAddress}`);
    const authenticationError = new Error('Invalid email address or password credential.');
    authenticationError.statusCode = 401;
    authenticationError.errorCode = 'INVALID_CREDENTIALS';
    throw authenticationError;
  }

  const isPasswordValid = await matchedUserRecord.verifyPasswordMatch(loginCredentials.passwordCredential);
  if (!isPasswordValid) {
    console.warn(`[Auth Service]: Password verification failed for ${loginCredentials.emailAddress}`);
    const credentialMismatchError = new Error('Invalid email address or password credential.');
    credentialMismatchError.statusCode = 401;
    credentialMismatchError.errorCode = 'INVALID_CREDENTIALS';
    throw credentialMismatchError;
  }

  matchedUserRecord.lastLoginTimestamp = new Date();
  await UserModel.updateOne(
    { _id: matchedUserRecord._id },
    { $set: { lastLoginTimestamp: new Date() } }
  );

  console.log(`[Auth Service]: Authentication verified for ${matchedUserRecord.emailAddress}`);
  const signedSessionJwt = generateSignedSessionToken(matchedUserRecord);
  return { authenticatedUser: matchedUserRecord, signedSessionJwt };
};

