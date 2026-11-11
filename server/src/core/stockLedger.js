/**
 * @FILE: stockLedger.js
 * @RESPONSIBILITY: Double-entry physical inventory movement tracking between source and destination stock locations.
 * @DEPENDENCIES: mongoose, erpConfig.js.
 * @MODIFICATION_HOTSPOT: stockMovementRecordSchema and calculatePhysicalStockAtLocation.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import { ERP_SYSTEM_PARAMETERS } from '../config/erpConfig.js';

const stockMovementRecordSchema = new mongoose.Schema(
  {
    movementTrackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    sourceDocumentReference: {
      type: String,
      required: true,
      trim: true
    },
    associatedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    skuIdentifier: {
      type: String,
      required: true
    },
    sizeVariant: {
      type: String,
      required: true
    },
    quantityMoved: {
      type: Number,
      required: true,
      min: 1
    },
    sourceLocationNode: {
      type: String,
      required: true,
      default: ERP_SYSTEM_PARAMETERS.STOCK_LOCATIONS.STORAGE_ROOM
    },
    destinationLocationNode: {
      type: String,
      required: true,
      default: ERP_SYSTEM_PARAMETERS.STOCK_LOCATIONS.CUSTOMERS
    },
    recordedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'stock_moves'
  }
);

export const StockMovementModel = mongoose.model('StockMovement', stockMovementRecordSchema);

export const recordPhysicalStockTransfer = async ({
  movementTrackingCode,
  sourceDocumentReference,
  associatedProductId,
  skuIdentifier,
  sizeVariant,
  quantityMoved,
  sourceLocationNode,
  destinationLocationNode,
  recordedByUserId
}) => {
  const stockTransfer = await StockMovementModel.create({
    movementTrackingCode,
    sourceDocumentReference,
    associatedProductId,
    skuIdentifier,
    sizeVariant,
    quantityMoved,
    sourceLocationNode,
    destinationLocationNode,
    recordedByUserId
  });

  console.log(`[Stock Ledger]: Transferred ${quantityMoved}x ${skuIdentifier} (${sizeVariant}) from ${sourceLocationNode} -> ${destinationLocationNode}`);
  return stockTransfer;
};

