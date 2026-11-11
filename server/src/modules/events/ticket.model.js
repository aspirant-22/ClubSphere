/**
 * @FILE: ticket.model.js
 * @RESPONSIBILITY: Mongoose Ticket schema modeling individual seat admissions, sequential codes, and gate scan timestamps.
 * @DEPENDENCIES: mongoose.
 * @MODIFICATION_HOTSPOT: ticketSchema definition and check-in audit fields.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';

export const TICKET_ADMISSION_STATES = {
  ISSUED: 'ISSUED',
  CHECKED_IN: 'CHECKED_IN',
  CANCELLED: 'CANCELLED'
};

const ticketSchema = new mongoose.Schema(
  {
    ticketTrackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    associatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    purchaserUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tierIdentifier: {
      type: String,
      required: true,
      uppercase: true
    },
    tierName: {
      type: String,
      required: true
    },
    unitPricePaid: {
      type: Number,
      required: true,
      min: 0
    },
    admissionState: {
      type: String,
      required: true,
      enum: Object.values(TICKET_ADMISSION_STATES),
      default: TICKET_ADMISSION_STATES.ISSUED,
      index: true
    },
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTimestamp: {
      type: Date
    },
    verifiedByStaffUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gateScannerLocation: {
      type: String,
      default: 'MAIN_ENTRANCE_DOOR'
    },
    digitalQrPayload: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'tickets'
  }
);

export const TicketModel = mongoose.model('Ticket', ticketSchema);
