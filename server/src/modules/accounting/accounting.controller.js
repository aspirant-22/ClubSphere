/**
 * @FILE: accounting.controller.js
 * @RESPONSIBILITY: Express controllers handling expense claims, Treasurer review sign-offs, general ledger audits, and semester close-out reports.
 * @DEPENDENCIES: accounting.service.js, reimbursement.model.js, doubleEntryLedger.js.
 * @MODIFICATION_HOTSPOT: handleTreasurerReviewClaim and handleGenerateFinancialReport.
 * @AUTHOR: Garima Mittal
 */

import {
  submitExpenseReimbursementClaim,
  reviewAndDisburseReimbursement,
  computeSemesterFinancialProfitAndLoss
} from './accounting.service.js';
import { ReimbursementModel } from './reimbursement.model.js';
import { JournalEntryModel } from '../../core/doubleEntryLedger.js';

export const handleSubmitReimbursementClaim = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const claimantUserId = incomingHttpRequest.authenticatedUser.userId;
    const createdClaim = await submitExpenseReimbursementClaim(claimantUserId, incomingHttpRequest.body);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Reimbursement claim submitted to Treasurer.',
      claimRecord: createdClaim
    });
  } catch (submissionError) {
    const statusCode = submissionError.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorSummaryMessage: submissionError.message
    });
  }
};

export const handleTreasurerReviewClaim = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const claimId = incomingHttpRequest.params.claimId;
    const treasurerUserId = incomingHttpRequest.authenticatedUser.userId;

    const reviewedClaim = await reviewAndDisburseReimbursement(claimId, incomingHttpRequest.body, treasurerUserId);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: `Claim ${reviewedClaim.reimbursementTrackingCode} processed.`,
      claimRecord: reviewedClaim
    });
  } catch (reviewError) {
    const statusCode = reviewError.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorSummaryMessage: reviewError.message
    });
  }
};

export const handleListReimbursements = async (incomingHttpRequest, outgoingHttpResponse) => {
  const allClaims = await ReimbursementModel.find()
    .populate('claimantUserId', 'fullName emailAddress studentIdentificationNumber')
    .populate('reviewedByTreasurerUserId', 'fullName emailAddress')
    .sort({ createdAt: -1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalClaimsCount: allClaims.length,
    claimsList: allClaims
  });
};

export const handleListMyReimbursements = async (incomingHttpRequest, outgoingHttpResponse) => {
  const currentUserId = incomingHttpRequest.authenticatedUser.userId;
  const userClaims = await ReimbursementModel.find({ claimantUserId: currentUserId }).sort({ createdAt: -1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalClaimsCount: userClaims.length,
    claimsList: userClaims
  });
};

export const handleFetchGeneralLedger = async (incomingHttpRequest, outgoingHttpResponse) => {
  const journalEntries = await JournalEntryModel.find()
    .populate('postedByUserId', 'fullName emailAddress')
    .sort({ createdAt: -1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalEntriesCount: journalEntries.length,
    journalEntries
  });
};

export const handleGenerateFinancialReport = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const pnlReport = await computeSemesterFinancialProfitAndLoss();

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      semesterSummaryReport: pnlReport
    });
  } catch (error) {
    return outgoingHttpResponse.status(500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

