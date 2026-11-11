/**
 * @FILE: event.model.js
 * @RESPONSIBILITY: Mongoose Event schema modeling venue capacities, multi-tier pricing brackets, and lifecycle states.
 * @DEPENDENCIES: mongoose, finiteStateMachine.js.
 * @MODIFICATION_HOTSPOT: ticketTierSubSchema and eventSchema definitions.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import { ERP_LIFECYCLE_STATES } from '../../core/finiteStateMachine.js';

const ticketTierSubSchema = new mongoose.Schema(
  {
    tierIdentifier: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    tierName: {
      type: String,
      required: true,
      trim: true
    },
    priceAmount: {
      type: Number,
      required: true,
      min: 0
    },
    isMemberExclusive: {
      type: Boolean,
      default: false
    },
    maximumSeatLimit: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    eventTrackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    eventTitle: {
      type: String,
      required: true,
      trim: true
    },
    eventDescription: {
      type: String,
      required: true,
      trim: true
    },
    venueLocation: {
      type: String,
      required: true,
      trim: true
    },
    startDateTime: {
      type: Date,
      required: true
    },
    endDateTime: {
      type: Date,
      required: true
    },
    maximumCapacityLimit: {
      type: Number,
      required: true,
      min: 1
    },
    ticketTiers: {
      type: [ticketTierSubSchema],
      required: true,
      validate: {
        validator: function (tiers) {
          return tiers && tiers.length > 0;
        },
        message: 'An event requires at least one configured ticket tier.'
      }
    },
    lifecycleState: {
      type: String,
      required: true,
      enum: Object.values(ERP_LIFECYCLE_STATES),
      default: ERP_LIFECYCLE_STATES.DRAFT,
      index: true
    },
    isPublishedToPublic: {
      type: Boolean,
      default: false
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'events'
  }
);

export const EventModel = mongoose.model('Event', eventSchema);

