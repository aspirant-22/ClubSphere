/**
 * @FILE: broadcast.model.js
 * @RESPONSIBILITY: Mongoose Broadcast schema modeling official club announcements, target audience scopes, and read-receipt ledgers.
 * @DEPENDENCIES: mongoose.
 * @MODIFICATION_HOTSPOT: BROADCAST_AUDIENCE_TIERS, BROADCAST_CATEGORIES, and broadcastSchema definitions.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';

export const BROADCAST_AUDIENCE_TIERS = {
  ALL_MEMBERS: 'ALL_MEMBERS',
  EXECUTIVES_ONLY: 'EXECUTIVES_ONLY',
  PUBLIC: 'PUBLIC'
};

export const BROADCAST_CATEGORIES = {
  GENERAL_ANNOUNCEMENT: 'GENERAL_ANNOUNCEMENT',
  EMERGENCY_MEETING: 'EMERGENCY_MEETING',
  EVENT_UPDATE: 'EVENT_UPDATE',
  OPPORTUNITY_ELECTIONS: 'OPPORTUNITY_ELECTIONS'
};

const readReceiptSubSchema = new mongoose.Schema(
  {
    readerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const broadcastSchema = new mongoose.Schema(
  {
    broadcastTrackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    bulletinTitle: {
      type: String,
      required: true,
      trim: true
    },
    bulletinContent: {
      type: String,
      required: true,
      trim: true
    },
    targetAudienceTier: {
      type: String,
      required: true,
      enum: Object.values(BROADCAST_AUDIENCE_TIERS),
      default: BROADCAST_AUDIENCE_TIERS.ALL_MEMBERS,
      index: true
    },
    bulletinCategory: {
      type: String,
      required: true,
      enum: Object.values(BROADCAST_CATEGORIES),
      default: BROADCAST_CATEGORIES.GENERAL_ANNOUNCEMENT
    },
    isUrgentHighPriority: {
      type: Boolean,
      default: false
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readReceiptsLedger: {
      type: [readReceiptSubSchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'broadcasts'
  }
);

export const BroadcastModel = mongoose.model('Broadcast', broadcastSchema);
