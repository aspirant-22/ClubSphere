/**
 * @FILE: broadcast.routes.js
 * @RESPONSIBILITY: Express routes wiring announcement creation, audience feed queries, and read acknowledgments to /api/v1/broadcasts.
 * @DEPENDENCIES: express, broadcast.controller.js, broadcast.validation.js, schemaValidator.js, authenticationGate.js, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: broadcastRouter endpoint registrations.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import {
  handlePublishBroadcast,
  handleFetchBulletinsFeed,
  handleAcknowledgeReadReceipt
} from './broadcast.controller.js';
import {
  BroadcastPublicationSchema,
  ReadReceiptAckSchema
} from './broadcast.validation.js';
import { validateRequestBody } from '../../middleware/schemaValidator.js';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';
import { authorizeRoleTiers, ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const broadcastRouter = express.Router();

const optionalAuthenticationGate = (req, res, next) => {
  const token = req.cookies?.clubsphere_session_token || req.headers.authorization;
  if (!token) {
    return next();
  }
  return authenticateSessionToken(req, res, next);
};

broadcastRouter.get('/', optionalAuthenticationGate, handleFetchBulletinsFeed);

broadcastRouter.post(
  '/',
  authenticateSessionToken,
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(BroadcastPublicationSchema),
  handlePublishBroadcast
);

broadcastRouter.post(
  '/:broadcastId/ack',
  authenticateSessionToken,
  validateRequestBody(ReadReceiptAckSchema),
  handleAcknowledgeReadReceipt
);

