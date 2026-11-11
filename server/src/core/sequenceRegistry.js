/**
 * @FILE: sequenceRegistry.js
 * @RESPONSIBILITY: Atomic sequence code generator (ir.sequence) producing corporate identifiers via MongoDB $inc.
 * @DEPENDENCIES: mongoose.
 * @MODIFICATION_HOTSPOT: sequenceRegistrySchema and generateNextSequenceCode function.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';

const sequenceRegistrySchema = new mongoose.Schema(
  {
    sequencePrefixKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    sequenceYearValue: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear()
    },
    currentSequenceNumber: {
      type: Number,
      required: true,
      default: 0
    },
    paddingDigitsCount: {
      type: Number,
      required: true,
      default: 4
    }
  },
  {
    timestamps: true,
    collection: 'ir_sequences'
  }
);

export const SequenceRegistryModel = mongoose.model(
  'SequenceRegistry',
  sequenceRegistrySchema
);

export const generateNextSequenceCode = async (sequencePrefixKey) => {
  const currentCalendarYear = new Date().getFullYear();
  const normalizedPrefixKey = sequencePrefixKey.toUpperCase().trim();

  const updatedSequenceRecord = await SequenceRegistryModel.findOneAndUpdate(
    { sequencePrefixKey: normalizedPrefixKey, sequenceYearValue: currentCalendarYear },
    { $inc: { currentSequenceNumber: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const sequentialNumberString = String(
    updatedSequenceRecord.currentSequenceNumber
  ).padStart(updatedSequenceRecord.paddingDigitsCount, '0');

  const generatedCorporateCode = `${normalizedPrefixKey}/${currentCalendarYear}/${sequentialNumberString}`;
  console.log(`[Sequence Registry]: Generated corporate identifier: ${generatedCorporateCode}`);
  return generatedCorporateCode;
};
