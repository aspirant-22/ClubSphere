/**
 * @FILE: salesOrder.model.js
 * @RESPONSIBILITY: Mongoose Sales Order schema tracking sequential codes, customer details, size order lines, and fulfillment states.
 * @DEPENDENCIES: mongoose, finiteStateMachine.js.
 * @MODIFICATION_HOTSPOT: orderLineItemSubSchema and salesOrderSchema definitions.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import { ERP_LIFECYCLE_STATES } from '../../core/finiteStateMachine.js';

export const ORDER_DELIVERY_METHODS = {
  CAMPUS_TABLE_PICKUP: 'CAMPUS_TABLE_PICKUP',
  DORM_DELIVERY: 'DORM_DELIVERY'
};

const orderLineItemSubSchema = new mongoose.Schema(
  {
    associatedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    skuIdentifier: {
      type: String,
      required: true
    },
    selectedSizeVariant: {
      type: String,
      required: true
    },
    unitPriceCharged: {
      type: Number,
      required: true,
      min: 0
    },
    orderQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotalPriceAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
);

const salesOrderSchema = new mongoose.Schema(
  {
    salesOrderSequenceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderLineItems: {
      type: [orderLineItemSubSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'A sales order requires at least one product line item.'
      }
    },
    grossTotalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    lifecycleState: {
      type: String,
      required: true,
      enum: Object.values(ERP_LIFECYCLE_STATES),
      default: ERP_LIFECYCLE_STATES.DRAFT,
      index: true
    },
    deliveryMethod: {
      type: String,
      required: true,
      enum: Object.values(ORDER_DELIVERY_METHODS),
      default: ORDER_DELIVERY_METHODS.CAMPUS_TABLE_PICKUP
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    fulfillmentTimestamp: {
      type: Date
    },
    fulfilledByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    specialDeliveryNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'sales_orders'
  }
);

export const SalesOrderModel = mongoose.model('SalesOrder', salesOrderSchema);

