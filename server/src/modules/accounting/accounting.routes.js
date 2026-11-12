/**
 * @FILE: accounting.routes.js
 * @RESPONSIBILITY: Express routes wiring reimbursement claims, Treasurer reviews, general ledger audits, and P&L reports to /api/v1/accounting.
 * @DEPENDENCIES: express, accounting.controller.js, accounting.validation.js, schemaValidator.js, authenticationGate.js, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: accountingRouter endpoint bindings.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import {
  handleSubmitReimbursementClaim,
  handleTreasurerReviewClaim,
  handleListReimbursements,
  handleListMyReimbursements,
  handleFetchGeneralLedger,
  handleGenerateFinancialReport
} from './accounting.controller.js';
import {
  ReimbursementClaimSubmissionSchema,
  TreasurerReviewActionSchema
} from './accounting.validation.js';
import { validateRequestBody } from '../../middleware/schemaValidator.js';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';
import { authorizeRoleTiers, ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const accountingRouter = express.Router();

accountingRouter.use(authenticateSessionToken);

accountingRouter.post(
  '/reimbursements',
  validateRequestBody(ReimbursementClaimSubmissionSchema),
  handleSubmitReimbursementClaim
);

accountingRouter.get(
  '/reimbursements/my-claims',
  handleListMyReimbursements
);

accountingRouter.get(
  '/reimbursements',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  handleListReimbursements
);

accountingRouter.put(
  '/reimbursements/:claimId/review',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN),
  validateRequestBody(TreasurerReviewActionSchema),
  handleTreasurerReviewClaim
);

accountingRouter.get(
  '/ledger',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN),
  handleFetchGeneralLedger
);

accountingRouter.get(
  '/financial-report',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  handleGenerateFinancialReport
);

