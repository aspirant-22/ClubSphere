/**
 * @FILE: broadcast.validation.js
 * @RESPONSIBILITY: Zod validation schemas for broadcast publication and read-receipt acknowledgments.
 * @DEPENDENCIES: zod, broadcast.model.js.
 * @MODIFICATION_HOTSPOT: BroadcastPublicationSchema and ReadReceiptAckSchema.
 * @AUTHOR: Garima Mittal
 */

import { z } from 'zod';
import { BROADCAST_AUDIENCE_TIERS, BROADCAST_CATEGORIES } from './broadcast.model.js';

export const BroadcastPublicationSchema = z.object({
  bulletinTitle: z.string().min(3, 'Announcement title must have at least 3 characters').max(150),
  bulletinContent: z.string().min(10, 'Announcement content must have at least 10 characters').max(5000),
  targetAudienceTier: z.enum([
    BROADCAST_AUDIENCE_TIERS.ALL_MEMBERS,
    BROADCAST_AUDIENCE_TIERS.EXECUTIVES_ONLY,
    BROADCAST_AUDIENCE_TIERS.PUBLIC
  ]).default(BROADCAST_AUDIENCE_TIERS.ALL_MEMBERS),
  bulletinCategory: z.enum([
    BROADCAST_CATEGORIES.GENERAL_ANNOUNCEMENT,
    BROADCAST_CATEGORIES.EMERGENCY_MEETING,
    BROADCAST_CATEGORIES.EVENT_UPDATE,
    BROADCAST_CATEGORIES.OPPORTUNITY_ELECTIONS
  ]).default(BROADCAST_CATEGORIES.GENERAL_ANNOUNCEMENT),
  isUrgentHighPriority: z.boolean().default(false)
});

export const ReadReceiptAckSchema = z.object({
  acknowledgedTimestamp: z.string().datetime().optional()
});

