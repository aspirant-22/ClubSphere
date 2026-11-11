/**
 * @FILE: membership.service.js
 * @RESPONSIBILITY: Business logic for membership lifecycles, QR badge encoding, and automatic double-entry ledger postings.
 * @DEPENDENCIES: membership.model.js, sequenceRegistry.js, finiteStateMachine.js, doubleEntryLedger.js, erpConfig.js, qrcode.
 * @MODIFICATION_HOTSPOT: processDuesPaymentAndPostLedger and generateMembershipQrBadge.
 * @AUTHOR: Garima Mittal
 */

import QRCode from 'qrcode';
import { MembershipModel, MEMBERSHIP_TIERS } from './membership.model.js';
import { UserModel } from '../auth/auth.model.js';
import { generateNextSequenceCode } from '../../core/sequenceRegistry.js';
import { ERP_LIFECYCLE_STATES, validateLifecycleStateTransition } from '../../core/finiteStateMachine.js';
import { postDoubleEntryJournalRecord } from '../../core/doubleEntryLedger.js';
import { ERP_SYSTEM_PARAMETERS } from '../../config/erpConfig.js';
import { ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

const TIER_PRICING_MAP = {
  [MEMBERSHIP_TIERS.STANDARD_ANNUAL]: 500,
  [MEMBERSHIP_TIERS.LIFETIME]: 1500,
  [MEMBERSHIP_TIERS.ALUMNI_SUPPORTER]: 1000
};

export const generateMembershipQrBadge = async (membershipSequenceCode, userIdString) => {
  const badgePayloadObject = {
    organization: 'Skyline Student Association',
    membershipCode: membershipSequenceCode,
    holderUserId: userIdString,
    verificationTimestamp: new Date().toISOString()
  };
  const stringifiedBadgePayload = JSON.stringify(badgePayloadObject);
  const generatedDataUrlQr = await QRCode.toDataURL(stringifiedBadgePayload);
  return { stringifiedBadgePayload, generatedDataUrlQr };
};

export const applyForNewMembership = async (applicantUserId, applicationData) => {
  const existingMembershipRecord = await MembershipModel.findOne({
    associatedUserId: applicantUserId,
    lifecycleState: { $ne: ERP_LIFECYCLE_STATES.CANCELLED }
  });

  if (existingMembershipRecord) {
    const duplicateMembershipError = new Error('An active or pending membership already exists for this student.');
    duplicateMembershipError.statusCode = 409;
    duplicateMembershipError.errorCode = 'MEMBERSHIP_ALREADY_EXISTS';
    throw duplicateMembershipError;
  }

  const generatedMembershipCode = await generateNextSequenceCode('MEM');
  const duesAmountForTier = TIER_PRICING_MAP[applicationData.membershipTier] || 500;
  const { stringifiedBadgePayload } = await generateMembershipQrBadge(generatedMembershipCode, applicantUserId);

  const createdMembership = await MembershipModel.create({
    membershipSequenceCode: generatedMembershipCode,
    associatedUserId: applicantUserId,
    membershipTier: applicationData.membershipTier,
    lifecycleState: ERP_LIFECYCLE_STATES.WAITING,
    academicDepartment: applicationData.academicDepartment,
    academicYear: applicationData.academicYear,
    duesAmountPayable: duesAmountForTier,
    digitalQrTokenPayload: stringifiedBadgePayload,
    emergencyContactName: applicationData.emergencyContactName,
    emergencyContactPhone: applicationData.emergencyContactPhone,
    updatedByUserId: applicantUserId
  });

  console.log(`[Membership Service]: Application recorded under code: ${generatedMembershipCode}`);
  return createdMembership;
};

export const processDuesPaymentAndPostLedger = async (targetMembershipId, paymentData, officerUserId) => {
  const targetMembership = await MembershipModel.findById(targetMembershipId);
  if (!targetMembership) {
    const notFoundError = new Error('Membership record not found.');
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  validateLifecycleStateTransition(targetMembership.lifecycleState, ERP_LIFECYCLE_STATES.DONE);

  const paymentCalendarDate = new Date();
  const membershipExpiryCalendarDate = new Date();
  membershipExpiryCalendarDate.setDate(
    paymentCalendarDate.getDate() + ERP_SYSTEM_PARAMETERS.MEMBERSHIP_VALIDITY_DAYS
  );

  targetMembership.lifecycleState = ERP_LIFECYCLE_STATES.DONE;
  targetMembership.isDuesPaid = true;
  targetMembership.paymentDate = paymentCalendarDate;
  targetMembership.membershipStartDate = paymentCalendarDate;
  targetMembership.membershipExpirationDate = membershipExpiryCalendarDate;
  targetMembership.updatedByUserId = officerUserId;
  await targetMembership.save();

  const generatedJournalCode = await generateNextSequenceCode('JRN');
  const debitAccountTarget = paymentData.paymentMethod === 'CASH_PAYMENT'
    ? ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.PETTY_CASH_FLOAT
    : ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.BANK_CAMPUS_ACCOUNT;

  await postDoubleEntryJournalRecord({
    journalEntryTrackingCode: generatedJournalCode,
    sourceDocumentReference: targetMembership.membershipSequenceCode,
    transactionMemo: `Annual dues collected for ${targetMembership.membershipSequenceCode}`,
    postedByUserId: officerUserId,
    journalLines: [
      {
        accountIdentifierCode: debitAccountTarget,
        debitAmountValue: paymentData.paidAmount,
        creditAmountValue: 0,
        lineItemDescription: `Dues received via ${paymentData.paymentMethod}`
      },
      {
        accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_MEMBERSHIP_DUES,
        debitAmountValue: 0,
        creditAmountValue: paymentData.paidAmount,
        lineItemDescription: `Membership revenue for ${targetMembership.membershipTier}`
      }
    ]
  });

  console.log(`[Membership Service]: Dues posted to ledger for ${targetMembership.membershipSequenceCode}`);
  return targetMembership;
};

export const registerCampusTableSignup = async (tableSignupData, officerUserId) => {
  let matchedUser = await UserModel.findOne({
    $or: [
      { emailAddress: tableSignupData.emailAddress.toLowerCase() },
      { studentIdentificationNumber: tableSignupData.studentIdentificationNumber.toUpperCase() }
    ]
  });

  if (!matchedUser) {
    matchedUser = await UserModel.create({
      fullName: tableSignupData.fullName,
      studentIdentificationNumber: tableSignupData.studentIdentificationNumber.toUpperCase(),
      emailAddress: tableSignupData.emailAddress.toLowerCase(),
      phoneNumber: tableSignupData.phoneNumber,
      passwordCredentialHash: 'SkylineClub2026!',
      userRoleTier: ERP_USER_ROLES.CUSTOMER
    });
  }

  const generatedMembershipCode = await generateNextSequenceCode('MEM');
  const duesAmountForTier = TIER_PRICING_MAP[tableSignupData.membershipTier] || 500;
  const { stringifiedBadgePayload } = await generateMembershipQrBadge(generatedMembershipCode, matchedUser._id.toString());

  const newMembership = await MembershipModel.create({
    membershipSequenceCode: generatedMembershipCode,
    associatedUserId: matchedUser._id,
    membershipTier: tableSignupData.membershipTier,
    lifecycleState: ERP_LIFECYCLE_STATES.WAITING,
    academicDepartment: tableSignupData.academicDepartment,
    academicYear: tableSignupData.academicYear,
    duesAmountPayable: duesAmountForTier,
    digitalQrTokenPayload: stringifiedBadgePayload,
    emergencyContactName: tableSignupData.emergencyContactName,
    emergencyContactPhone: tableSignupData.emergencyContactPhone,
    updatedByUserId: officerUserId
  });

  if (tableSignupData.isImmediateCashCollected) {
    return processDuesPaymentAndPostLedger(
      newMembership._id,
      { paymentMethod: 'CASH_PAYMENT', paidAmount: duesAmountForTier, paymentReferenceIdentifier: 'CAMPUS_TABLE_CASH' },
      officerUserId
    );
  }

  return newMembership;
};

export const verifyMembershipBadgeToken = async (scannedQrPayload) => {
  let parsedPayloadObject;
  try {
    parsedPayloadObject = JSON.parse(scannedQrPayload);
  } catch (error) {
    parsedPayloadObject = { membershipCode: scannedQrPayload.trim() };
  }

  const lookupCode = parsedPayloadObject.membershipCode;
  const membershipRecord = await MembershipModel.findOne({
    membershipSequenceCode: lookupCode
  }).populate('associatedUserId', 'fullName emailAddress studentIdentificationNumber');

  if (!membershipRecord) {
    return {
      isValidMember: false,
      validationVerdict: 'NOT_FOUND',
      badgeMessage: 'No membership record matches this QR badge.'
    };
  }

  const currentSystemDate = new Date();
  const isExpired = membershipRecord.membershipExpirationDate && membershipRecord.membershipExpirationDate < currentSystemDate;

  if (isExpired) {
    return {
      isValidMember: false,
      validationVerdict: 'EXPIRED',
      badgeMessage: `Membership lapsed on ${membershipRecord.membershipExpirationDate.toLocaleDateString()}`,
      membershipRecord
    };
  }

  if (membershipRecord.lifecycleState !== ERP_LIFECYCLE_STATES.DONE || !membershipRecord.isDuesPaid) {
    return {
      isValidMember: false,
      validationVerdict: 'UNPAID_DUES',
      badgeMessage: 'Membership application pending dues settlement.',
      membershipRecord
    };
  }

  return {
    isValidMember: true,
    validationVerdict: 'ACTIVE_MEMBER',
    badgeMessage: 'Verified Active Member of Skyline Student Association.',
    membershipRecord
  };
};

