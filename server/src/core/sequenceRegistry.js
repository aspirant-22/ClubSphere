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

const PREFIX_COLLECTION_FIELD_MAP = {
  MEM: { collection: 'memberships', field: 'membershipSequenceCode' },
  EVT: { collection: 'events', field: 'eventTrackingCode' },
  TKT: { collection: 'tickets', field: 'ticketTrackingCode' },
  SO: { collection: 'sales_orders', field: 'salesOrderSequenceCode' },
  STK: { collection: 'stock_moves', field: 'movementTrackingCode' },
  ACT: { collection: 'activities', field: 'activityTrackingCode' },
  EXP: { collection: 'reimbursements', field: 'reimbursementTrackingCode' },
  ANN: { collection: 'broadcasts', field: 'broadcastTrackingCode' },
  JRN: { collection: 'journal_entries', field: 'journalEntryTrackingCode' }
};

const scanHighestNumber = async (prefix, year) => {
  const mapping = PREFIX_COLLECTION_FIELD_MAP[prefix];
  if (!mapping || !mongoose.connection.db) return 0;
  try {
    const codeRegex = new RegExp(`^${prefix}/${year}/(\\d+)`);
    const docs = await mongoose.connection.db
      .collection(mapping.collection)
      .find({ [mapping.field]: codeRegex }, { projection: { [mapping.field]: 1 } })
      .toArray();
    return docs.reduce((highest, doc) => {
      const match = (doc[mapping.field] || '').match(codeRegex);
      return match ? Math.max(highest, parseInt(match[1], 10)) : highest;
    }, 0);
  } catch (err) {
    return 0;
  }
};

const syncSequenceCounter = async (prefix, year, highestNum) => {
  let doc = await SequenceRegistryModel.findOne({ sequencePrefixKey: prefix, sequenceYearValue: year });
  if (!doc || doc.currentSequenceNumber < highestNum) {
    doc = await SequenceRegistryModel.findOneAndUpdate(
      { sequencePrefixKey: prefix, sequenceYearValue: year },
      { $set: { currentSequenceNumber: highestNum, paddingDigitsCount: 4 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }
  return SequenceRegistryModel.findOneAndUpdate(
    { sequencePrefixKey: prefix, sequenceYearValue: year },
    { $inc: { currentSequenceNumber: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

export const generateNextSequenceCode = async (sequencePrefixKey) => {
  const currentCalendarYear = new Date().getFullYear();
  const normalizedPrefix = sequencePrefixKey.toUpperCase().trim();
  const highestNum = await scanHighestNumber(normalizedPrefix, currentCalendarYear);
  const updated = await syncSequenceCounter(normalizedPrefix, currentCalendarYear, highestNum);
  const padDigits = updated.paddingDigitsCount || 4;
  const numStr = String(updated.currentSequenceNumber).padStart(padDigits, '0');
  const generatedCode = `${normalizedPrefix}/${currentCalendarYear}/${numStr}`;
  console.log(`[Sequence Registry]: Generated corporate identifier: ${generatedCode}`);
  return generatedCode;
};

