/**
 * @FILE: membership.model.js
 * @RESPONSIBILITY: Mongoose Membership schema managing tiers, sequential tracking codes, QR payloads, and renewal lifecycles.
 * @DEPENDENCIES: mongoose, finiteStateMachine.js.
 * @MODIFICATION_HOTSPOT: membershipSchema definition and lifecycle indexes.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import { ERP_LIFECYCLE_STATES } from '../../core/finiteStateMachine.js';

export const MEMBERSHIP_TIERS = {
  STANDARD_ANNUAL: 'STANDARD_ANNUAL',
  LIFETIME: 'LIFETIME',
  ALUMNI_SUPPORTER: 'ALUMNI_SUPPORTER'
};

const membershipSchema = new mongoose.Schema(
  {
    membershipSequenceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    associatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    membershipTier: {
      type: String,
      required: true,
      enum: Object.values(MEMBERSHIP_TIERS),
      default: MEMBERSHIP_TIERS.STANDARD_ANNUAL
    },
    lifecycleState: {
      type: String,
      required: true,
      enum: Object.values(ERP_LIFECYCLE_STATES),
      default: ERP_LIFECYCLE_STATES.DRAFT,
      index: true
    },
    academicDepartment: {
      type: String,
      required: true,
      trim: true
    },
    academicYear: {
      type: String,
      required: true,
      enum: ['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'ALUMNI']
    },
    duesAmountPayable: {
      type: Number,
      required: true,
      min: 0
    },
    isDuesPaid: {
      type: Boolean,
      default: false
    },
    paymentDate: {
      type: Date
    },
    membershipStartDate: {
      type: Date
    },
    membershipExpirationDate: {
      type: Date,
      index: true
    },
    digitalQrTokenPayload: {
      type: String,
      trim: true
    },
    emergencyContactName: {
      type: String,
      required: true,
      trim: true
    },
    emergencyContactPhone: {
      type: String,
      required: true,
      trim: true
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    collection: 'memberships'
  }
);

export const MembershipModel = mongoose.model('Membership', membershipSchema);
