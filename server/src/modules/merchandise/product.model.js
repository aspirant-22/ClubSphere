/**
 * @FILE: product.model.js
 * @RESPONSIBILITY: Mongoose Product schema modeling apparel merchandise with structured size arrays and member pricing tiers.
 * @DEPENDENCIES: mongoose.
 * @MODIFICATION_HOTSPOT: sizeStockSubSchema and productSchema definitions.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';

export const APPAREL_SIZE_VARIANTS = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

export const PRODUCT_CATEGORIES = {
  HOODIES: 'HOODIES',
  T_SHIRTS: 'T_SHIRTS',
  ACCESSORIES: 'ACCESSORIES',
  MEMORABILIA: 'MEMORABILIA'
};

const sizeStockSubSchema = new mongoose.Schema(
  {
    sizeVariant: {
      type: String,
      required: true,
      enum: APPAREL_SIZE_VARIANTS
    },
    currentInventoryCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    skuIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    productCategory: {
      type: String,
      required: true,
      enum: Object.values(PRODUCT_CATEGORIES),
      default: PRODUCT_CATEGORIES.HOODIES
    },
    productDescription: {
      type: String,
      trim: true
    },
    memberPriceAmount: {
      type: Number,
      required: true,
      min: 0
    },
    nonMemberPriceAmount: {
      type: Number,
      required: true,
      min: 0
    },
    sizeMatrixStock: {
      type: [sizeStockSubSchema],
      required: true,
      validate: {
        validator: function (sizes) {
          return sizes && sizes.length > 0;
        },
        message: 'A merchandise product requires at least one size variant configured.'
      }
    },
    isAvailableForOrder: {
      type: Boolean,
      default: true
    },
    productImagePreviewUrl: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

export const ProductModel = mongoose.model('Product', productSchema);
