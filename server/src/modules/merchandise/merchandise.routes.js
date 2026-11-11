/**
 * @FILE: merchandise.routes.js
 * @RESPONSIBILITY: Express routes wiring product creation, catalog browsing, order checkout, and stock journals to /api/v1/merchandise.
 * @DEPENDENCIES: express, merchandise.controller.js, merchandise.validation.js, schemaValidator.js, authenticationGate.js, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: merchandiseRouter endpoint bindings.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import {
  handleCreateProduct,
  handleListProducts,
  handleCheckoutSalesOrder,
  handleListMyOrders,
  handleTransitionOrderState,
  handleListStockMovementJournal
} from './merchandise.controller.js';
import {
  ProductCreationSchema,
  SalesOrderCheckoutSchema,
  OrderFulfillmentTransitionSchema
} from './merchandise.validation.js';
import { validateRequestBody } from '../../middleware/schemaValidator.js';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';
import { authorizeRoleTiers, ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const merchandiseRouter = express.Router();

merchandiseRouter.get('/products', handleListProducts);

merchandiseRouter.post(
  '/products',
  authenticateSessionToken,
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN),
  validateRequestBody(ProductCreationSchema),
  handleCreateProduct
);

merchandiseRouter.post(
  '/orders',
  authenticateSessionToken,
  validateRequestBody(SalesOrderCheckoutSchema),
  handleCheckoutSalesOrder
);

merchandiseRouter.get(
  '/orders/my-orders',
  authenticateSessionToken,
  handleListMyOrders
);

merchandiseRouter.put(
  '/orders/:orderId/state',
  authenticateSessionToken,
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(OrderFulfillmentTransitionSchema),
  handleTransitionOrderState
);

merchandiseRouter.get(
  '/stock-ledger',
  authenticateSessionToken,
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  handleListStockMovementJournal
);
