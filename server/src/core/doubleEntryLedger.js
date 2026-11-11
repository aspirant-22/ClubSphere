/**
 * @FILE: doubleEntryLedger.js
 * @RESPONSIBILITY: Immutable double-entry general ledger journal entry creator and aggregation balance calculator.
 * @DEPENDENCIES: mongoose, erpConfig.js.
 * @MODIFICATION_HOTSPOT: journalEntrySchema and calculateAccountBalanceAggregation.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import { ERP_SYSTEM_PARAMETERS } from '../config/erpConfig.js';

const journalLineItemSchema = new mongoose.Schema(
  {
    accountIdentifierCode: {
      type: String,
      required: true,
      trim: true
    },
    debitAmountValue: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    creditAmountValue: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lineItemDescription: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: true }
);

const journalEntrySchema = new mongoose.Schema(
  {
    journalEntryTrackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    sourceDocumentReference: {
      type: String,
      required: true,
      trim: true
    },
    transactionMemo: {
      type: String,
      required: true,
      trim: true
    },
    journalLines: {
      type: [journalLineItemSchema],
      required: true,
      validate: {
        validator: function (lineItemsArray) {
          return lineItemsArray && lineItemsArray.length >= 2;
        },
        message: 'A double-entry journal record requires at least two balanced line items.'
      }
    },
    totalTransactionAmount: {
      type: Number,
      required: true,
      min: 0
    },
    transactionCurrency: {
      type: String,
      default: ERP_SYSTEM_PARAMETERS.DEFAULT_CURRENCY
    },
    postedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'journal_entries'
  }
);

export const JournalEntryModel = mongoose.model('JournalEntry', journalEntrySchema);

export const assertJournalLinesAreBalanced = (lineItemsArray) => {
  let aggregatedDebitSum = 0;
  let aggregatedCreditSum = 0;

  for (const singleLineItem of lineItemsArray) {
    aggregatedDebitSum += Number(singleLineItem.debitAmountValue || 0);
    aggregatedCreditSum += Number(singleLineItem.creditAmountValue || 0);
  }

  const roundedDebitSum = Math.round(aggregatedDebitSum * 100) / 100;
  const roundedCreditSum = Math.round(aggregatedCreditSum * 100) / 100;

  if (roundedDebitSum !== roundedCreditSum) {
    console.error(`[Ledger Invariant Error]: Unbalanced entries! Debit: ${roundedDebitSum}, Credit: ${roundedCreditSum}`);
    throw new Error(`Double-entry balance violation: Debits (${roundedDebitSum}) must equal Credits (${roundedCreditSum}).`);
  }

  return roundedDebitSum;
};

export const postDoubleEntryJournalRecord = async ({
  journalEntryTrackingCode,
  sourceDocumentReference,
  transactionMemo,
  journalLines,
  postedByUserId
}) => {
  const balancedAmountTotal = assertJournalLinesAreBalanced(journalLines);

  const createdJournalRecord = await JournalEntryModel.create({
    journalEntryTrackingCode,
    sourceDocumentReference,
    transactionMemo,
    journalLines,
    totalTransactionAmount: balancedAmountTotal,
    postedByUserId
  });

  console.log(`[Double-Entry Ledger]: Posted balanced journal entry: ${journalEntryTrackingCode} totaling ₹${balancedAmountTotal}`);
  return createdJournalRecord;
};

export const calculateAccountBalanceAggregation = async (accountIdentifierCode) => {
  const accountAggregationPipeline = [
    { $unwind: '$journalLines' },
    { $match: { 'journalLines.accountIdentifierCode': accountIdentifierCode } },
    {
      $group: {
        _id: '$journalLines.accountIdentifierCode',
        cumulativeDebitTotal: { $sum: '$journalLines.debitAmountValue' },
        cumulativeCreditTotal: { $sum: '$journalLines.creditAmountValue' }
      }
    }
  ];

  const aggregationCalculationResult = await JournalEntryModel.aggregate(accountAggregationPipeline);

  if (!aggregationCalculationResult || aggregationCalculationResult.length === 0) {
    return { accountIdentifierCode, cumulativeDebitTotal: 0, cumulativeCreditTotal: 0, netAuthoritativeBalance: 0 };
  }

  const calculationSummary = aggregationCalculationResult[0];
  const netCalculatedBalance = calculationSummary.cumulativeDebitTotal - calculationSummary.cumulativeCreditTotal;

  console.log(`[Ledger Aggregation]: Balance for ${accountIdentifierCode} is ₹${netCalculatedBalance}`);
  return {
    accountIdentifierCode,
    cumulativeDebitTotal: calculationSummary.cumulativeDebitTotal,
    cumulativeCreditTotal: calculationSummary.cumulativeCreditTotal,
    netAuthoritativeBalance: netCalculatedBalance
  };
};
