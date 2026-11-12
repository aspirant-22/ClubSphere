/**
 * @FILE: broadcast.service.js
 * @RESPONSIBILITY: Business logic for announcement publications, read-receipt updates, and Socket.IO real-time event dispatches.
 * @DEPENDENCIES: broadcast.model.js, sequenceRegistry.js, socketServer.js.
 * @MODIFICATION_HOTSPOT: publishAnnouncementBulletin and recordReadReceipt.
 * @AUTHOR: Garima Mittal
 */

import { BroadcastModel, BROADCAST_AUDIENCE_TIERS } from './broadcast.model.js';
import { generateNextSequenceCode } from '../../core/sequenceRegistry.js';
import { socketIoServer } from '../../server.js';

export const publishAnnouncementBulletin = async (senderUserId, bulletinPayload) => {
  const generatedBroadcastCode = await generateNextSequenceCode('ANN');

  const createdBroadcast = await BroadcastModel.create({
    broadcastTrackingCode: generatedBroadcastCode,
    bulletinTitle: bulletinPayload.bulletinTitle,
    bulletinContent: bulletinPayload.bulletinContent,
    targetAudienceTier: bulletinPayload.targetAudienceTier,
    bulletinCategory: bulletinPayload.bulletinCategory,
    isUrgentHighPriority: bulletinPayload.isUrgentHighPriority || false,
    senderUserId
  });

  const populatedBroadcast = await BroadcastModel.findById(createdBroadcast._id)
    .populate('senderUserId', 'fullName emailAddress userRoleTier');

  try {
    if (socketIoServer) {
      socketIoServer.emit('BROADCAST_PUBLISHED', {
        broadcastTrackingCode: populatedBroadcast.broadcastTrackingCode,
        bulletinTitle: populatedBroadcast.bulletinTitle,
        targetAudienceTier: populatedBroadcast.targetAudienceTier,
        isUrgentHighPriority: populatedBroadcast.isUrgentHighPriority,
        senderName: populatedBroadcast.senderUserId?.fullName
      });
      console.log(`[Broadcast Service]: Emitted live WebSocket alert for ${generatedBroadcastCode}`);
    }
  } catch (socketError) {
    console.warn(`[Broadcast Socket Warning]: Failed to dispatch real-time alert: ${socketError.message}`);
  }

  return populatedBroadcast;
};

export const fetchAudienceFilteredBulletins = async (userRoleTier, isUserAuthenticated) => {
  let audienceFilter = [BROADCAST_AUDIENCE_TIERS.PUBLIC];

  if (isUserAuthenticated) {
    audienceFilter.push(BROADCAST_AUDIENCE_TIERS.ALL_MEMBERS);
    if (userRoleTier === 'ADMIN' || userRoleTier === 'OPERATIONS') {
      audienceFilter.push(BROADCAST_AUDIENCE_TIERS.EXECUTIVES_ONLY);
    }
  }

  const matchedBulletins = await BroadcastModel.find({
    targetAudienceTier: { $in: audienceFilter }
  })
    .populate('senderUserId', 'fullName emailAddress')
    .sort({ createdAt: -1 });

  return matchedBulletins;
};

export const recordReadReceipt = async (broadcastId, readerUserId) => {
  const targetBroadcast = await BroadcastModel.findById(broadcastId);
  if (!targetBroadcast) {
    const error = new Error('Broadcast not found.');
    error.statusCode = 404;
    throw error;
  }

  const alreadyAcknowledged = targetBroadcast.readReceiptsLedger.some(
    (item) => item.readerUserId.toString() === readerUserId.toString()
  );

  if (!alreadyAcknowledged) {
    targetBroadcast.readReceiptsLedger.push({
      readerUserId,
      acknowledgedAt: new Date()
    });
    await targetBroadcast.save();
    console.log(`[Broadcast Service]: Read receipt logged for user ${readerUserId} on ${targetBroadcast.broadcastTrackingCode}`);
  }

  return targetBroadcast;
};

