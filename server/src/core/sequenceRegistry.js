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
  TKT: { collection: 'tickets', field: 'ticketSequenceCode' },
  SO: { collection: 'sales_orders', field: 'salesOrderTrackingCode' },
  STK: { collection: 'stock_movements', field: 'movementTrackingCode' },
  ACT: { collection: 'activity_tasks', field: 'activityTrackingCode' },
  EXP: { collection: 'reimbursement_claims', field: 'reimbursementTrackingCode' },
  ANN: { collection: 'broadcast_bulletins', field: 'broadcastTrackingCode' },
  JRN: { collection: 'journal_entries', field: 'journalEntryTrackingCode' }
};

export const generateNextSequenceCode = async (sequencePrefixKey) => {
  const currentCalendarYear = new Date().getFullYear();
  const normalizedPrefixKey = sequencePrefixKey.toUpperCase().trim();

  // Find the highest existing sequence number in the relevant business collection
  let highestExistingNumber = 0;
  const mapping = PREFIX_COLLECTION_FIELD_MAP[normalizedPrefixKey];

  if (mapping && mongoose.connection.db) {
    try {
      const codeRegex = new RegExp(`^${normalizedPrefixKey}/${currentCalendarYear}/(\\d+)`);
      const docs = await mongoose.connection.db
        .collection(mapping.collection)
        .find({ [mapping.field]: codeRegex }, { projection: { [mapping.field]: 1 } })
        .toArray();

      for (const doc of docs) {
        const val = doc[mapping.field];
        if (val) {
          const m = val.match(codeRegex);
          if (m && m[1]) {
            const num = parseInt(m[1], 10);
            if (num > highestExistingNumber) {
              highestExistingNumber = num;
            }
          }
        }
      }
    } catch (scanErr) {
      console.warn(`[Sequence Registry]: Error scanning ${mapping.collection}:`, scanErr.message);
    }
  }

  // Atomically find or create the sequence counter
  let sequenceDoc = await SequenceRegistryModel.findOne({
    sequencePrefixKey: normalizedPrefixKey,
    sequenceYearValue: currentCalendarYear
  });

  if (!sequenceDoc) {
    // If not found, create or set to at least highestExistingNumber
    sequenceDoc = await SequenceRegistryModel.findOneAndUpdate(
      { sequencePrefixKey: normalizedPrefixKey, sequenceYearValue: currentCalendarYear },
      {
        $setOnInsert: {
          currentSequenceNumber: highestExistingNumber,
          paddingDigitsCount: 4
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  // If the stored counter is behind what actually exists in the collection, bump it
  if (sequenceDoc.currentSequenceNumber < highestExistingNumber) {
    sequenceDoc = await SequenceRegistryModel.findOneAndUpdate(
      { sequencePrefixKey: normalizedPrefixKey, sequenceYearValue: currentCalendarYear },
      { $set: { currentSequenceNumber: highestExistingNumber } },
      { new: true }
    );
  }

  // Increment and obtain next number
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

