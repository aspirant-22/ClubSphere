/**
 * @FILE: membership.routes.js
 * @RESPONSIBILITY: Express routes wiring membership CRUD, table sign-up, QR card retrieval, and dues payment to /api/v1/memberships.
 * @DEPENDENCIES: express, membership.controller.js, membership.validation.js, schemaValidator.js, authenticationGate.js, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: membershipRouter endpoint registrations.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import {
  handleApplyMembership,
  handleCampusTableSignup,
  handleRecordDuesPayment,
  handleFetchMyMembershipCard,
  handleVerifyQrScan,
  handleListAllMemberships
} from './membership.controller.js';
import {
  MembershipApplicationSchema,
  CampusTableSignupSchema,
  RecordDuesPaymentSchema,
  MembershipQrVerifySchema
} from './membership.validation.js';
import { validateRequestBody } from '../../middleware/schemaValidator.js';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';
import { authorizeRoleTiers, ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const membershipRouter = express.Router();

membershipRouter.use(authenticateSessionToken);

membershipRouter.get(
  '/',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  handleListAllMemberships
);

membershipRouter.get(
  '/my-card',
  handleFetchMyMembershipCard
);

membershipRouter.post(
  '/apply',
  validateRequestBody(MembershipApplicationSchema),
  handleApplyMembership
);

membershipRouter.post(
  '/table-signup',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(CampusTableSignupSchema),
  handleCampusTableSignup
);

membershipRouter.post(
  '/:membershipId/pay-dues',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(RecordDuesPaymentSchema),
  handleRecordDuesPayment
);

membershipRouter.post(
  '/verify-qr',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(MembershipQrVerifySchema),
  handleVerifyQrScan
);

