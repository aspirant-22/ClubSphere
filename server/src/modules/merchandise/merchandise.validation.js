/**
 * @FILE: merchandise.validation.js
 * @RESPONSIBILITY: Zod validation schemas for product SKU creation, size matrix stock configuration, and sales order checkout.
 * @DEPENDENCIES: zod, product.model.js, salesOrder.model.js.
 * @MODIFICATION_HOTSPOT: ProductCreationSchema and SalesOrderCheckoutSchema.
 * @AUTHOR: Garima Mittal
 */

import { z } from 'zod';
import { APPAREL_SIZE_VARIANTS, PRODUCT_CATEGORIES } from './product.model.js';
import { ORDER_DELIVERY_METHODS } from './salesOrder.model.js';

export const SizeMatrixStockItemSchema = z.object({
  sizeVariant: z.enum(['XS', 'S', 'M', 'L', 'XL', '2XL']),
  currentInventoryCount: z.number().int().min(0, 'Inventory quantity must be zero or positive')
});

export const ProductCreationSchema = z.object({
  skuIdentifier: z.string().min(3).max(30),
  productName: z.string().min(3).max(100),
  productCategory: z.enum([
    PRODUCT_CATEGORIES.HOODIES,
    PRODUCT_CATEGORIES.T_SHIRTS,
    PRODUCT_CATEGORIES.ACCESSORIES,
    PRODUCT_CATEGORIES.MEMORABILIA
  ]),
  productDescription: z.string().max(1000).optional(),
  memberPriceAmount: z.number().positive('Member price must be greater than zero'),
  nonMemberPriceAmount: z.number().positive('Non-member price must be greater than zero'),
  sizeMatrixStock: z.array(SizeMatrixStockItemSchema).min(1, 'At least one size variant is required'),
  productImagePreviewUrl: z.string().url().optional()
});

export const OrderCheckoutItemSchema = z.object({
  productId: z.string().min(1, 'Product identifier required'),
  selectedSizeVariant: z.enum(['XS', 'S', 'M', 'L', 'XL', '2XL']),
  orderQuantity: z.number().int().positive('Order quantity must be at least 1')
});

export const SalesOrderCheckoutSchema = z.object({
  orderItems: z.array(OrderCheckoutItemSchema).min(1, 'Order must contain at least one item'),
  deliveryMethod: z.enum([
    ORDER_DELIVERY_METHODS.CAMPUS_TABLE_PICKUP,
    ORDER_DELIVERY_METHODS.DORM_DELIVERY
  ]).default(ORDER_DELIVERY_METHODS.CAMPUS_TABLE_PICKUP),
  specialDeliveryNotes: z.string().max(300).optional()
});

export const OrderFulfillmentTransitionSchema = z.object({
  targetLifecycleState: z.enum(['WAITING', 'READY', 'DONE', 'CANCELLED'])
});
