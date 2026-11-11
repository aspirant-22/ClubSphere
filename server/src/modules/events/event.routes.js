/**
 * @FILE: event.routes.js
 * @RESPONSIBILITY: Express routes wiring event creation, public listings, ticket purchasing, and gate scanner to /api/v1/events.
 * @DEPENDENCIES: express, event.controller.js, event.validation.js, schemaValidator.js, authenticationGate.js, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: eventRouter endpoint bindings.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import {
  handleCreateEvent,
  handleListEvents,
  handleGetEventById,
  handleTicketPurchase,
  handleDoorScannerCheckIn,
  handleGetMyTickets,
  handleEventReconciliation
} from './event.controller.js';
import {
  EventCreationSchema,
  PurchaseTicketOrderSchema,
  DoorScannerCheckInSchema
} from './event.validation.js';
import { validateRequestBody } from '../../middleware/schemaValidator.js';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';
import { authorizeRoleTiers, ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const eventRouter = express.Router();

eventRouter.get('/', handleListEvents);

eventRouter.get('/my-tickets', authenticateSessionToken, handleGetMyTickets);

eventRouter.get('/:eventId', handleGetEventById);

eventRouter.post(
  '/',
  authenticateSessionToken,
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(EventCreationSchema),
  handleCreateEvent
);

eventRouter.post(
  '/:eventId/tickets/purchase',
  authenticateSessionToken,
  validateRequestBody(PurchaseTicketOrderSchema),
  handleTicketPurchase
);

eventRouter.post(
  '/tickets/validate-qr',
  authenticateSessionToken,
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(DoorScannerCheckInSchema),
  handleDoorScannerCheckIn
);

eventRouter.get(
  '/:eventId/reconciliation',
  authenticateSessionToken,
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  handleEventReconciliation
);
