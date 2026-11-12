/**
 * @FILE: accounting.validation.js
 * @RESPONSIBILITY: Zod validation schemas for volunteer expense reimbursement claims and Treasurer sign-offs.
 * @DEPENDENCIES: zod, reimbursement.model.js.
 * @MODIFICATION_HOTSPOT: ReimbursementClaimSubmissionSchema and TreasurerReviewActionSchema.
 * @AUTHOR: Garima Mittal
 */

import { z } from 'zod';
import { EXPENSE_CATEGORIES } from './reimbursement.model.js';

export const ReimbursementClaimSubmissionSchema = z.object({
  expenseCategory: z.enum([
    EXPENSE_CATEGORIES.BAKE_SALE_SUPPLIES,
    EXPENSE_CATEGORIES.EVENT_DECOR,
    EXPENSE_CATEGORIES.PRINTING_SIGNAGE,
    EXPENSE_CATEGORIES.FOOD_BEVERAGE,
    EXPENSE_CATEGORIES.EQUIPMENT_RENTAL,
    EXPENSE_CATEGORIES.MISCELLANEOUS
  ]),
  claimAmount: z.number().positive('Claim amount must be greater than zero'),
  vendorMerchantName: z.string().min(2, 'Merchant name is required').max(100),
  expenseDate: z.string().datetime(),
  receiptDocumentUrl: z.string().url('A valid receipt image or document URL is required'),
  businessPurposeJustification: z.string().min(5, 'Please provide business purpose justification').max(500)
});

export const TreasurerReviewActionSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  treasurerNotes: z.string().max(300).optional(),
  disbursementSourceAccount: z.string().default('1010 Bank:Campus_Account')
});
