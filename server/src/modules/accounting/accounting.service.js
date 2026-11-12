/**
 * @FILE: accounting.service.js
 * @RESPONSIBILITY: Business logic for volunteer reimbursements, Treasurer approval locks, double-entry postings, and semester P&L reports.
 * @DEPENDENCIES: reimbursement.model.js, doubleEntryLedger.js, sequenceRegistry.js, finiteStateMachine.js, erpConfig.js.
 * @MODIFICATION_HOTSPOT: reviewAndDisburseReimbursement and computeSemesterFinancialProfitAndLoss.
 * @AUTHOR: Garima Mittal
 */

import { ReimbursementModel } from './reimbursement.model.js';
import { generateNextSequenceCode } from '../../core/sequenceRegistry.js';
import { ERP_LIFECYCLE_STATES, validateLifecycleStateTransition } from '../../core/finiteStateMachine.js';
import { postDoubleEntryJournalRecord, JournalEntryModel } from '../../core/doubleEntryLedger.js';
import { ERP_SYSTEM_PARAMETERS } from '../../config/erpConfig.js';

export const submitExpenseReimbursementClaim = async (claimantUserId, claimPayload) => {
  const generatedClaimCode = await generateNextSequenceCode('EXP');

  const createdClaim = await ReimbursementModel.create({
    reimbursementTrackingCode: generatedClaimCode,
    claimantUserId,
    expenseCategory: claimPayload.expenseCategory,
    claimAmount: claimPayload.claimAmount,
    vendorMerchantName: claimPayload.vendorMerchantName,
    expenseDate: new Date(claimPayload.expenseDate),
    receiptDocumentUrl: claimPayload.receiptDocumentUrl,
    businessPurposeJustification: claimPayload.businessPurposeJustification,
    lifecycleState: ERP_LIFECYCLE_STATES.WAITING
  });

  console.log(`[Accounting Service]: Reimbursement claim ${generatedClaimCode} logged for ₹${claimPayload.claimAmount}`);
  return createdClaim;
};

export const reviewAndDisburseReimbursement = async (claimId, reviewData, treasurerUserId) => {
  const targetClaim = await ReimbursementModel.findById(claimId).populate('claimantUserId', 'fullName emailAddress');
  if (!targetClaim) {
    const error = new Error('Reimbursement claim record not found.');
    error.statusCode = 404;
    throw error;
  }

  const isApproved = reviewData.approvalStatus === 'APPROVED';
  const targetState = isApproved ? ERP_LIFECYCLE_STATES.DONE : ERP_LIFECYCLE_STATES.CANCELLED;
  validateLifecycleStateTransition(targetClaim.lifecycleState, targetState);

  targetClaim.lifecycleState = targetState;
  targetClaim.treasurerReviewNotes = reviewData.treasurerNotes || '';
  targetClaim.reviewedByTreasurerUserId = treasurerUserId;

  if (isApproved) {
    targetClaim.settlementTimestamp = new Date();
    await targetClaim.save();

    const generatedJournalCode = await generateNextSequenceCode('JRN');
    const sourceAccount = reviewData.disbursementSourceAccount || ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.BANK_CAMPUS_ACCOUNT;

    await postDoubleEntryJournalRecord({
      journalEntryTrackingCode: generatedJournalCode,
      sourceDocumentReference: targetClaim.reimbursementTrackingCode,
      transactionMemo: `Reimbursement disbursement to ${targetClaim.claimantUserId?.fullName} (${targetClaim.expenseCategory})`,
      postedByUserId: treasurerUserId,
      journalLines: [
        {
          accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.EXPENSE_SUPPLIES_LOGISTICS,
          debitAmountValue: targetClaim.claimAmount,
          creditAmountValue: 0,
          lineItemDescription: `Expense claim: ${targetClaim.businessPurposeJustification}`
        },
        {
          accountIdentifierCode: sourceAccount,
          debitAmountValue: 0,
          creditAmountValue: targetClaim.claimAmount,
          lineItemDescription: `Disbursed to volunteer for ${targetClaim.reimbursementTrackingCode}`
        }
      ]
    });
  } else {
    await targetClaim.save();
  }

  console.log(`[Accounting Service]: Claim ${targetClaim.reimbursementTrackingCode} reviewed: ${reviewData.approvalStatus}`);
  return targetClaim;
};

export const computeSemesterFinancialProfitAndLoss = async () => {
  const allJournalEntries = await JournalEntryModel.find().sort({ createdAt: -1 });

  const accountBalancesMap = {};
  for (const entry of allJournalEntries) {
    for (const line of entry.journalLines) {
      const code = line.accountIdentifierCode;
      if (!accountBalancesMap[code]) {
        accountBalancesMap[code] = { debitSum: 0, creditSum: 0 };
      }
      accountBalancesMap[code].debitSum += line.debitAmountValue;
      accountBalancesMap[code].creditSum += line.creditAmountValue;
    }
  }

  let totalDuesIncome = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_MEMBERSHIP_DUES]?.creditSum || 0;
  let totalTicketIncome = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_TICKET_SALES]?.creditSum || 0;
  let totalMerchIncome = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_MERCHANDISE_SALES]?.creditSum || 0;
  let totalFundraiserIncome = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_FUNDRAISER_DONATIONS]?.creditSum || 0;
  let totalGrossRevenue = totalDuesIncome + totalTicketIncome + totalMerchIncome + totalFundraiserIncome;

  let totalEventExpenses = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.EXPENSE_EVENT_OPERATIONS]?.debitSum || 0;
  let totalSuppliesExpenses = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.EXPENSE_SUPPLIES_LOGISTICS]?.debitSum || 0;
  let totalCogsExpenses = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.EXPENSE_MERCHANDISE_COGS]?.debitSum || 0;
  let totalAdminExpenses = accountBalancesMap[ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.EXPENSE_ADMINISTRATIVE]?.debitSum || 0;
  let totalGrossExpenses = totalEventExpenses + totalSuppliesExpenses + totalCogsExpenses + totalAdminExpenses;

  const netSemesterSurplus = totalGrossRevenue - totalGrossExpenses;
  const pendingReimbursementsCount = await ReimbursementModel.countDocuments({ lifecycleState: ERP_LIFECYCLE_STATES.WAITING });

  return {
    revenueBreakdown: {
      membershipDues: totalDuesIncome,
      ticketSales: totalTicketIncome,
      merchandiseSales: totalMerchIncome,
      fundraiserDonations: totalFundraiserIncome,
      totalGrossRevenue
    },
    expenseBreakdown: {
      eventOperations: totalEventExpenses,
      suppliesAndLogistics: totalSuppliesExpenses,
      merchandiseCogs: totalCogsExpenses,
      administrative: totalAdminExpenses,
      totalGrossExpenses
    },
    netSemesterSurplus,
    pendingReimbursementsCount,
    totalJournalEntriesCount: allJournalEntries.length
  };
};
