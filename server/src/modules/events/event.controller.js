/**
 * @FILE: event.controller.js
 * @RESPONSIBILITY: Express controller handling event CRUD, ticket purchases, gate scanner validations, and ticket approvals.
 * @DEPENDENCIES: event.service.js, event.model.js, ticket.model.js, qrcode.
 * @MODIFICATION_HOTSPOT: handleTicketPurchase, handleApproveTicketPurchase, and handleDoorScannerCheckIn.
 * @AUTHOR: Garima Mittal
 */

import QRCode from 'qrcode';
import {
  createNewEvent,
  purchaseTicketsWithQuotaLock,
  validateDoorScannerCheckIn,
  generateEventReconciliationSummary,
  approveTicketPurchase,
  getPendingTicketApprovals
} from './event.service.js';
import { EventModel } from './event.model.js';
import { TicketModel, TICKET_APPROVAL_STATES } from './ticket.model.js';

export const handleCreateEvent = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const creatorUserId = incomingHttpRequest.authenticatedUser.userId;
    const createdEvent = await createNewEvent(incomingHttpRequest.body, creatorUserId);
    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Event created and scheduled successfully.',
      createdEvent
    });
  } catch (error) {
    return outgoingHttpResponse.status(error.statusCode || 500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleListEvents = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const eventsList = await EventModel.find({ isPublishedToPublic: true }).sort({ startDateTime: 1 });
    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      totalCount: eventsList.length,
      eventsList
    });
  } catch (error) {
    return outgoingHttpResponse.status(500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleGetEventById = async (incomingHttpRequest, outgoingHttpResponse) => {
  const eventId = incomingHttpRequest.params.eventId;
  const eventRecord = await EventModel.findById(eventId);
  if (!eventRecord) {
    return outgoingHttpResponse.status(404).json({
      successIndicator: false,
      errorSummaryMessage: 'Event record not found.'
    });
  }

  const allTickets = await TicketModel.find({ associatedEventId: eventId });
  const tierAvailability = eventRecord.ticketTiers.map((tier) => {
    const sold = allTickets.filter((t) => t.tierIdentifier === tier.tierIdentifier).length;
    return {
      tierIdentifier: tier.tierIdentifier,
      tierName: tier.tierName,
      priceAmount: tier.priceAmount,
      isMemberExclusive: tier.isMemberExclusive,
      maximumSeatLimit: tier.maximumSeatLimit,
      ticketsSold: sold,
      seatsRemaining: Math.max(0, tier.maximumSeatLimit - sold)
    };
  });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    eventRecord,
    tierAvailability
  });
};

export const handleTicketPurchase = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const eventId = incomingHttpRequest.params.eventId;
    const purchaserUserId = incomingHttpRequest.authenticatedUser.userId;
    const purchaseResult = await purchaseTicketsWithQuotaLock(
      eventId,
      incomingHttpRequest.body,
      purchaserUserId
    );

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Ticket booking submitted for approval.',
      purchaseSummary: purchaseResult
    });
  } catch (error) {
    return outgoingHttpResponse.status(error.statusCode || 500).json({
      successIndicator: false,
      errorCodeIdentifier: error.errorCode || 'TICKET_PURCHASE_FAILED',
      errorSummaryMessage: error.message
    });
  }
};

export const handleGetPendingTicketApprovals = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const pendingTickets = await getPendingTicketApprovals();
    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      pendingCount: pendingTickets.length,
      pendingTickets
    });
  } catch (error) {
    return outgoingHttpResponse.status(500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleApproveTicketPurchase = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const ticketId = incomingHttpRequest.params.ticketId;
    const officerUserId = incomingHttpRequest.authenticatedUser.userId;
    const approvedTicket = await approveTicketPurchase(ticketId, officerUserId);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: 'Ticket approved and digital pass activated.',
      approvedTicket
    });
  } catch (error) {
    return outgoingHttpResponse.status(error.statusCode || 500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleDoorScannerCheckIn = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const staffUserId = incomingHttpRequest.authenticatedUser.userId;
    const { ticketTrackingCode, gateScannerLocation } = incomingHttpRequest.body;
    const admissionResult = await validateDoorScannerCheckIn(ticketTrackingCode, gateScannerLocation, staffUserId);

    const httpStatus = admissionResult.isAdmitted ? 200 : 409;
    return outgoingHttpResponse.status(httpStatus).json({
      successIndicator: admissionResult.isAdmitted,
      admissionResult
    });
  } catch (scanError) {
    return outgoingHttpResponse.status(500).json({
      successIndicator: false,
      errorSummaryMessage: scanError.message
    });
  }
};

export const handleGetMyTickets = async (incomingHttpRequest, outgoingHttpResponse) => {
  const currentUserId = incomingHttpRequest.authenticatedUser.userId;
  const userTickets = await TicketModel.find({ purchaserUserId: currentUserId })
    .populate('associatedEventId', 'eventTitle venueLocation startDateTime endDateTime')
    .sort({ createdAt: -1 });

  const ticketsWithQr = await Promise.all(
    userTickets.map(async (t) => {
      const isConfirmed = t.approvalState === TICKET_APPROVAL_STATES.CONFIRMED ||
        (!t.approvalState && t.admissionState === 'ISSUED');
      const qrDataUrl = isConfirmed ? await QRCode.toDataURL(t.ticketTrackingCode) : null;
      return { ...t.toObject(), qrDataUrl };
    })
  );

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    ticketsCount: ticketsWithQr.length,
    userTickets: ticketsWithQr
  });
};

export const handleEventReconciliation = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const eventId = incomingHttpRequest.params.eventId;
    const reconciliationReport = await generateEventReconciliationSummary(eventId);
    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      reconciliationReport
    });
  } catch (error) {
    return outgoingHttpResponse.status(error.statusCode || 500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};
