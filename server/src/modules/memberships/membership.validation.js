/**
 * @FILE: membership.validation.js
 * @RESPONSIBILITY: Zod validation schemas for online membership applications, table sign-ups, dues recording, and QR validation.
 * @DEPENDENCIES: zod, membership.model.js.
 * @MODIFICATION_HOTSPOT: MembershipApplicationSchema and MembershipQrVerifySchema.
 * @AUTHOR: Garima Mittal
 */

import { z } from 'zod';
import { MEMBERSHIP_TIERS } from './membership.model.js';

export const MembershipApplicationSchema = z.object({
  membershipTier: z.enum([
    MEMBERSHIP_TIERS.STANDARD_ANNUAL,
    MEMBERSHIP_TIERS.LIFETIME,
    MEMBERSHIP_TIERS.ALUMNI_SUPPORTER
  ]),
  academicDepartment: z.string().min(2, 'Department name is required').max(100),
  academicYear: z.enum(['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'ALUMNI']),
  emergencyContactName: z.string().min(2, 'Emergency contact required').max(80),
  emergencyContactPhone: z.string().min(7, 'Phone number format invalid').max(15)
});

export const CampusTableSignupSchema = z.object({
  fullName: z.string().min(2).max(80),
  studentIdentificationNumber: z.string().min(4).max(20),
  emailAddress: z.string().email(),
  phoneNumber: z.string().optional(),
  membershipTier: z.enum([
    MEMBERSHIP_TIERS.STANDARD_ANNUAL,
    MEMBERSHIP_TIERS.LIFETIME,
    MEMBERSHIP_TIERS.ALUMNI_SUPPORTER
  ]),
  academicDepartment: z.string().min(2).max(100),
  academicYear: z.enum(['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'ALUMNI']),
  emergencyContactName: z.string().min(2).max(80),
  emergencyContactPhone: z.string().min(7).max(15),
  isImmediateCashCollected: z.boolean().default(true)
});

export const RecordDuesPaymentSchema = z.object({
  paymentMethod: z.enum(['CASH_PAYMENT', 'BANK_TRANSFER', 'CAMPUS_CARD', 'ONLINE_GATEWAY']),
  paymentReferenceIdentifier: z.string().min(3).max(64),
  paidAmount: z.number().positive('Payment amount must be greater than zero')
});

export const MembershipQrVerifySchema = z.object({
  qrTokenPayload: z.string().min(10, 'Invalid QR payload string')
});
