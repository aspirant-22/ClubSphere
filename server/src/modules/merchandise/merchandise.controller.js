/**
 * @FILE: merchandise.controller.js
 * @RESPONSIBILITY: Express controllers handling product catalog discovery, sales order checkouts, and fulfillment lifecycle advances.
 * @DEPENDENCIES: merchandise.service.js, product.model.js, salesOrder.model.js, stockLedger.js.
 * @MODIFICATION_HOTSPOT: handleCheckoutSalesOrder and handleListStockMovementJournal.
 * @AUTHOR: Garima Mittal
 */

import {
  createNewProductSku,
  createSalesOrderWithInventoryCheck,
  fulfillSalesOrder
} from './merchandise.service.js';
import { ProductModel } from './product.model.js';
import { SalesOrderModel } from './salesOrder.model.js';
import { StockMovementModel } from '../../core/stockLedger.js';

export const handleCreateProduct = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const createdProduct = await createNewProductSku(incomingHttpRequest.body);
    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Product SKU registered successfully.',
      productRecord: createdProduct
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleListProducts = async (incomingHttpRequest, outgoingHttpResponse) => {
  const productsList = await ProductModel.find({ isAvailableForOrder: true }).sort({ createdAt: -1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalProductsCount: productsList.length,
    productsList
  });
};

export const handleCheckoutSalesOrder = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const customerUserId = incomingHttpRequest.authenticatedUser.userId;
    const completedOrder = await createSalesOrderWithInventoryCheck(customerUserId, incomingHttpRequest.body);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Merchandise sales order confirmed.',
      salesOrderRecord: completedOrder
    });
  } catch (checkoutError) {
    const statusCode = checkoutError.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorCodeIdentifier: checkoutError.errorCode || 'ORDER_CHECKOUT_FAILED',
      errorSummaryMessage: checkoutError.message
    });
  }
};

export const handleListMyOrders = async (incomingHttpRequest, outgoingHttpResponse) => {
  const customerUserId = incomingHttpRequest.authenticatedUser.userId;
  const userOrders = await SalesOrderModel.find({ customerUserId }).sort({ createdAt: -1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalOrdersCount: userOrders.length,
    ordersList: userOrders
  });
};

export const handleTransitionOrderState = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const orderId = incomingHttpRequest.params.orderId;
    const staffUserId = incomingHttpRequest.authenticatedUser.userId;
    const { targetLifecycleState } = incomingHttpRequest.body;

    const updatedOrder = await fulfillSalesOrder(orderId, targetLifecycleState, staffUserId);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: `Order transitioned to ${targetLifecycleState}`,
      salesOrderRecord: updatedOrder
    });
  } catch (transitionError) {
    return outgoingHttpResponse.status(transitionError.statusCode || 500).json({
      successIndicator: false,
      errorSummaryMessage: transitionError.message
    });
  }
};

export const handleListStockMovementJournal = async (incomingHttpRequest, outgoingHttpResponse) => {
  const movementJournalEntries = await StockMovementModel.find()
    .sort({ createdAt: -1 })
    .populate('recordedByUserId', 'fullName emailAddress');

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalMovementsCount: movementJournalEntries.length,
    movementJournalEntries
  });
};
