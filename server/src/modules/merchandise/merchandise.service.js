/**
 * @FILE: merchandise.service.js
 * @RESPONSIBILITY: Business logic for product SKU setup, stock verification, sales order creation, and double-entry postings.
 * @DEPENDENCIES: product.model.js, salesOrder.model.js, membership.model.js, stockLedger.js, sequenceRegistry.js, doubleEntryLedger.js, erpConfig.js.
 * @MODIFICATION_HOTSPOT: createSalesOrderWithInventoryCheck and fulfillSalesOrder.
 * @AUTHOR: Garima Mittal
 */

import { ProductModel } from './product.model.js';
import { SalesOrderModel } from './salesOrder.model.js';
import { MembershipModel } from '../memberships/membership.model.js';
import { recordPhysicalStockTransfer } from '../../core/stockLedger.js';
import { generateNextSequenceCode } from '../../core/sequenceRegistry.js';
import { ERP_LIFECYCLE_STATES, validateLifecycleStateTransition } from '../../core/finiteStateMachine.js';
import { postDoubleEntryJournalRecord } from '../../core/doubleEntryLedger.js';
import { ERP_SYSTEM_PARAMETERS } from '../../config/erpConfig.js';

export const createNewProductSku = async (productData) => {
  const existingSku = await ProductModel.findOne({ skuIdentifier: productData.skuIdentifier.toUpperCase() });
  if (existingSku) {
    const error = new Error(`Product SKU ${productData.skuIdentifier} already exists in catalog.`);
    error.statusCode = 409;
    throw error;
  }

  const createdProduct = await ProductModel.create({
    ...productData,
    skuIdentifier: productData.skuIdentifier.toUpperCase()
  });

  console.log(`[Merchandise Service]: Created product SKU: ${createdProduct.skuIdentifier} (${createdProduct.productName})`);
  return createdProduct;
};

export const createSalesOrderWithInventoryCheck = async (customerUserId, checkoutPayload) => {
  const activeMembership = await MembershipModel.findOne({
    associatedUserId: customerUserId,
    lifecycleState: ERP_LIFECYCLE_STATES.DONE,
    isDuesPaid: true
  });
  const isClubMember = Boolean(activeMembership);

  let calculatedGrossTotal = 0;
  const processedOrderLines = [];

  for (const requestedItem of checkoutPayload.orderItems) {
    const matchedProduct = await ProductModel.findById(requestedItem.productId);
    if (!matchedProduct) {
      const error = new Error(`Product ${requestedItem.productId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const matchedSizeRecord = matchedProduct.sizeMatrixStock.find(
      (s) => s.sizeVariant === requestedItem.selectedSizeVariant
    );

    if (!matchedSizeRecord || matchedSizeRecord.currentInventoryCount < requestedItem.orderQuantity) {
      const availableCount = matchedSizeRecord ? matchedSizeRecord.currentInventoryCount : 0;
      const error = new Error(
        `Insufficient inventory for ${matchedProduct.productName} in size ${requestedItem.selectedSizeVariant}. Only ${availableCount} available.`
      );
      error.statusCode = 409;
      error.errorCode = 'INSUFFICIENT_STOCK';
      throw error;
    }

    matchedSizeRecord.currentInventoryCount -= requestedItem.orderQuantity;
    await matchedProduct.save();

    const unitPrice = isClubMember ? matchedProduct.memberPriceAmount : matchedProduct.nonMemberPriceAmount;
    const subtotal = unitPrice * requestedItem.orderQuantity;
    calculatedGrossTotal += subtotal;

    processedOrderLines.push({
      associatedProductId: matchedProduct._id,
      productName: matchedProduct.productName,
      skuIdentifier: matchedProduct.skuIdentifier,
      selectedSizeVariant: requestedItem.selectedSizeVariant,
      unitPriceCharged: unitPrice,
      orderQuantity: requestedItem.orderQuantity,
      subtotalPriceAmount: subtotal
    });
  }

  const generatedOrderCode = await generateNextSequenceCode('SO');

  const createdSalesOrder = await SalesOrderModel.create({
    salesOrderSequenceCode: generatedOrderCode,
    customerUserId,
    orderLineItems: processedOrderLines,
    grossTotalAmount: calculatedGrossTotal,
    lifecycleState: ERP_LIFECYCLE_STATES.READY,
    deliveryMethod: checkoutPayload.deliveryMethod,
    isPaid: true,
    specialDeliveryNotes: checkoutPayload.specialDeliveryNotes
  });

  for (const line of processedOrderLines) {
    const generatedStockMovementCode = await generateNextSequenceCode('STK');
    await recordPhysicalStockTransfer({
      movementTrackingCode: generatedStockMovementCode,
      sourceDocumentReference: generatedOrderCode,
      associatedProductId: line.associatedProductId,
      skuIdentifier: line.skuIdentifier,
      sizeVariant: line.selectedSizeVariant,
      quantityMoved: line.orderQuantity,
      sourceLocationNode: ERP_SYSTEM_PARAMETERS.STOCK_LOCATIONS.STORAGE_ROOM,
      destinationLocationNode: ERP_SYSTEM_PARAMETERS.STOCK_LOCATIONS.CUSTOMERS,
      recordedByUserId: customerUserId
    });
  }

  const generatedJournalCode = await generateNextSequenceCode('JRN');
  await postDoubleEntryJournalRecord({
    journalEntryTrackingCode: generatedJournalCode,
    sourceDocumentReference: generatedOrderCode,
    transactionMemo: `Merchandise sales order ${generatedOrderCode} for user ${customerUserId}`,
    postedByUserId: customerUserId,
    journalLines: [
      {
        accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.BANK_CAMPUS_ACCOUNT,
        debitAmountValue: calculatedGrossTotal,
        creditAmountValue: 0,
        lineItemDescription: `Proceeds from order ${generatedOrderCode}`
      },
      {
        accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_MERCHANDISE_SALES,
        debitAmountValue: 0,
        creditAmountValue: calculatedGrossTotal,
        lineItemDescription: `Apparel sales revenue for order ${generatedOrderCode}`
      }
    ]
  });

  console.log(`[Merchandise Service]: Sales order ${generatedOrderCode} placed. Total: ₹${calculatedGrossTotal}`);
  return createdSalesOrder;
};

export const fulfillSalesOrder = async (orderId, targetLifecycleState, staffUserId) => {
  const targetOrder = await SalesOrderModel.findById(orderId);
  if (!targetOrder) {
    const error = new Error('Sales order not found.');
    error.statusCode = 404;
    throw error;
  }

  validateLifecycleStateTransition(targetOrder.lifecycleState, targetLifecycleState);

  targetOrder.lifecycleState = targetLifecycleState;
  if (targetLifecycleState === ERP_LIFECYCLE_STATES.DONE) {
    targetOrder.fulfillmentTimestamp = new Date();
    targetOrder.fulfilledByUserId = staffUserId;
  }

  await targetOrder.save();
  console.log(`[Merchandise Service]: Order ${targetOrder.salesOrderSequenceCode} moved to state ${targetLifecycleState}`);
  return targetOrder;
};

