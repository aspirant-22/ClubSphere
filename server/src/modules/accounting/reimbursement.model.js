/**
 * @FILE: reimbursement.model.js
 * @RESPONSIBILITY: Mongoose Reimbursement schema modeling volunteer expense claims, receipt URLs, and Treasurer approval states.
 * @DEPENDENCIES: mongoose, finiteStateMachine.js.
 * @MODIFICATION_HOTSPOT: EXPENSE_CATEGORIES and reimbursementSchema definitions.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import { ERP_LIFECYCLE_STATES } from '../../core/finiteStateMachine.js';

export const EXPENSE_CATEGORIES = {
  BAKE_SALE_SUPPLIES: 'BAKE_SALE_SUPPLIES',
  EVENT_DECOR: 'EVENT_DECOR',
  PRINTING_SIGNAGE: 'PRINTING_SIGNAGE',
  FOOD_BEVERAGE: 'FOOD_BEVERAGE',
  EQUIPMENT_RENTAL: 'EQUIPMENT_RENTAL',
  MISCELLANEOUS: 'MISCELLANEOUS'
};

const reimbursementSchema = new mongoose.Schema(
  {
    reimbursementTrackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    claimantUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    expenseCategory: {
      type: String,
      required: true,
      enum: Object.values(EXPENSE_CATEGORIES),
      default: EXPENSE_CATEGORIES.BAKE_SALE_SUPPLIES
    },
    claimAmount: {
      type: Number,
      required: true,
      min: 0.01
    },
    vendorMerchantName: {
      type: String,
      required: true,
      trim: true
    },
    expenseDate: {
      type: Date,
      required: true
    },
    receiptDocumentUrl: {
      type: String,
      required: true,
      trim: true
    },
    businessPurposeJustification: {
      type: String,
      required: true,
      trim: true
    },
    lifecycleState: {
      type: String,
      required: true,
      enum: Object.values(ERP_LIFECYCLE_STATES),
      default: ERP_LIFECYCLE_STATES.WAITING,
      index: true
    },
    treasurerReviewNotes: {
      type: String,
      trim: true
    },
    reviewedByTreasurerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    settlementTimestamp: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'reimbursements'
  }
);

export const ReimbursementModel = mongoose.model('Reimbursement', reimbursementSchema);
