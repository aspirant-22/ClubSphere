/**
 * @FILE: event.validation.js
 * @RESPONSIBILITY: Zod validation schemas for event configuration, Spring Gala ticket purchases, and QR scanner admissions.
 * @DEPENDENCIES: zod.
 * @MODIFICATION_HOTSPOT: EventCreationSchema and PurchaseTicketOrderSchema.
 * @AUTHOR: Garima Mittal
 */

import { z } from 'zod';

export const TicketTierConfigSchema = z.object({
  tierIdentifier: z.string().min(2).max(30),
  tierName: z.string().min(2).max(60),
  priceAmount: z.number().min(0, 'Price amount must be zero or positive'),
  isMemberExclusive: z.boolean().default(false),
  maximumSeatLimit: z.number().int().positive('Seat limit must be at least 1')
});

export const EventCreationSchema = z.object({
  eventTitle: z.string().min(3).max(120),
  eventDescription: z.string().min(10).max(2000),
  venueLocation: z.string().min(3).max(150),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  maximumCapacityLimit: z.number().int().positive(),
  ticketTiers: z.array(TicketTierConfigSchema).min(1, 'At least one tier required')
});

export const PurchaseTicketOrderSchema = z.object({
  ticketTierIdentifier: z.string().min(2).max(30),
  ticketQuantity: z.number().int().min(1).max(10),
  paymentMethod: z.enum(['ONLINE_PAYMENT', 'CASH_AT_DOOR', 'CAMPUS_WALLET']),
  attendeeNotes: z.string().max(250).optional()
});

export const DoorScannerCheckInSchema = z.object({
  ticketTrackingCode: z.string().min(5),
  gateScannerLocation: z.string().default('MAIN_ENTRANCE_DOOR')
});
