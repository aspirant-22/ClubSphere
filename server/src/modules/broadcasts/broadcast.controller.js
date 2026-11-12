/**
 * @FILE: broadcast.controller.js
 * @RESPONSIBILITY: Express controllers handling broadcast publishing, audience feed lookups, and read-receipt acknowledgments.
 * @DEPENDENCIES: broadcast.service.js, broadcast.model.js.
 * @MODIFICATION_HOTSPOT: handlePublishBroadcast and handleFetchBulletinsFeed.
 * @AUTHOR: Garima Mittal
 */

import {
  publishAnnouncementBulletin,
  fetchAudienceFilteredBulletins,
  recordReadReceipt
} from './broadcast.service.js';

export const handlePublishBroadcast = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const senderUserId = incomingHttpRequest.authenticatedUser.userId;
    const publishedBulletin = await publishAnnouncementBulletin(senderUserId, incomingHttpRequest.body);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Club announcement broadcasted successfully.',
      bulletinRecord: publishedBulletin
    });
  } catch (publishError) {
    const statusCode = publishError.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorSummaryMessage: publishError.message
    });
  }
};

export const handleFetchBulletinsFeed = async (incomingHttpRequest, outgoingHttpResponse) => {
  const activeUser = incomingHttpRequest.authenticatedUser;
  const isAuth = Boolean(activeUser);
  const userRole = activeUser ? activeUser.userRoleTier : null;

  const bulletinsList = await fetchAudienceFilteredBulletins(userRole, isAuth);

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalBulletinsCount: bulletinsList.length,
    bulletinsList
  });
};

export const handleAcknowledgeReadReceipt = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const broadcastId = incomingHttpRequest.params.broadcastId;
    const readerUserId = incomingHttpRequest.authenticatedUser.userId;

    const updatedBulletin = await recordReadReceipt(broadcastId, readerUserId);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: 'Read receipt recorded.',
      bulletinTrackingCode: updatedBulletin.broadcastTrackingCode
    });
  } catch (ackError) {
    const statusCode = ackError.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorSummaryMessage: ackError.message
    });
  }
};

