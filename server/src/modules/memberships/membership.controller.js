/**
 * @FILE: membership.controller.js
 * @RESPONSIBILITY: Express controllers handling member applications, dues payment recording, member ID card retrieval, and QR validation.
 * @DEPENDENCIES: membership.service.js, membership.model.js, qrcode.
 * @MODIFICATION_HOTSPOT: handleVerifyQrScan and handleFetchMyMembershipCard.
 * @AUTHOR: Garima Mittal
 */

import QRCode from 'qrcode';
import {
  applyForNewMembership,
  processDuesPaymentAndPostLedger,
  registerCampusTableSignup,
  verifyMembershipBadgeToken
} from './membership.service.js';
import { MembershipModel } from './membership.model.js';

export const handleApplyMembership = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const applicantUserId = incomingHttpRequest.authenticatedUser.userId;
    const applicationResult = await applyForNewMembership(applicantUserId, incomingHttpRequest.body);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Membership application submitted successfully.',
      membershipRecord: applicationResult
    });
  } catch (applicationError) {
    const errorStatusCode = applicationError.statusCode || 500;
    return outgoingHttpResponse.status(errorStatusCode).json({
      successIndicator: false,
      errorCodeIdentifier: applicationError.errorCode || 'APPLICATION_ERROR',
      errorSummaryMessage: applicationError.message
    });
  }
};

export const handleCampusTableSignup = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const officerUserId = incomingHttpRequest.authenticatedUser.userId;
    const signupResult = await registerCampusTableSignup(incomingHttpRequest.body, officerUserId);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Student registered and membership initiated at campus table.',
      membershipRecord: signupResult
    });
  } catch (signupError) {
    const errorStatusCode = signupError.statusCode || 500;
    return outgoingHttpResponse.status(errorStatusCode).json({
      successIndicator: false,
      errorCodeIdentifier: signupError.errorCode || 'TABLE_SIGNUP_ERROR',
      errorSummaryMessage: signupError.message
    });
  }
};

export const handleRecordDuesPayment = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const targetMembershipId = incomingHttpRequest.params.membershipId;
    const officerUserId = incomingHttpRequest.authenticatedUser.userId;
    const paymentResult = await processDuesPaymentAndPostLedger(
      targetMembershipId,
      incomingHttpRequest.body,
      officerUserId
    );

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: 'Dues payment confirmed and double-entry ledger updated.',
      membershipRecord: paymentResult
    });
  } catch (paymentError) {
    const errorStatusCode = paymentError.statusCode || 500;
    return outgoingHttpResponse.status(errorStatusCode).json({
      successIndicator: false,
      errorCodeIdentifier: paymentError.errorCode || 'PAYMENT_RECORD_ERROR',
      errorSummaryMessage: paymentError.message
    });
  }
};

export const handleFetchMyMembershipCard = async (incomingHttpRequest, outgoingHttpResponse) => {
  const currentUserId = incomingHttpRequest.authenticatedUser.userId;
  const membershipRecord = await MembershipModel.findOne({
    associatedUserId: currentUserId
  }).populate('associatedUserId', 'fullName emailAddress studentIdentificationNumber');

  if (!membershipRecord) {
    return outgoingHttpResponse.status(404).json({
      successIndicator: false,
      errorCodeIdentifier: 'MEMBERSHIP_NOT_FOUND',
      errorSummaryMessage: 'No membership record found for current student.'
    });
  }

  const qrDataUrl = await QRCode.toDataURL(
    membershipRecord.digitalQrTokenPayload || membershipRecord.membershipSequenceCode
  );

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    membershipRecord,
    qrDataUrl
  });
};

export const handleVerifyQrScan = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const scanVerificationResult = await verifyMembershipBadgeToken(incomingHttpRequest.body.qrTokenPayload);
    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      verificationData: scanVerificationResult
    });
  } catch (verificationError) {
    return outgoingHttpResponse.status(500).json({
      successIndicator: false,
      errorCodeIdentifier: 'VERIFICATION_FAILURE',
      errorSummaryMessage: verificationError.message
    });
  }
};

export const handleListAllMemberships = async (incomingHttpRequest, outgoingHttpResponse) => {
  const allMemberships = await MembershipModel.find()
    .populate('associatedUserId', 'fullName emailAddress studentIdentificationNumber')
    .sort({ createdAt: -1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalRecordsCount: allMemberships.length,
    membershipsList: allMemberships
  });
};

