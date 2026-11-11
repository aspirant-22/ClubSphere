/**
 * @FILE: event.controller.js
 * @RESPONSIBILITY: Express controllers handling event publishing, ticket purchasing, door QR validation, and event reconciliations.
 * @DEPENDENCIES: event.service.js, event.model.js, ticket.model.js, qrcode.
 * @MODIFICATION_HOTSPOT: handleTicketPurchase and handleDoorScannerCheckIn.
 * @AUTHOR: Garima Mittal
 */

import QRCode from 'qrcode';
import {
  createNewEvent,
  purchaseTicketsWithQuotaLock,
  validateDoorScannerCheckIn,
  generateEventReconciliationSummary
} from './event.service.js';
import { EventModel } from './event.model.js';
import { TicketModel } from './ticket.model.js';

export const handleCreateEvent = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const creatorUserId = incomingHttpRequest.authenticatedUser.userId;
    const createdEvent = await createNewEvent(incomingHttpRequest.body, creatorUserId);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Event created and published successfully.',
      eventRecord: createdEvent
    });
  } catch (creationError) {
    const statusCode = creationError.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorCodeIdentifier: creationError.errorCode || 'EVENT_CREATION_FAILED',
      errorSummaryMessage: creationError.message
    });
  }
};

export const handleListEvents = async (incomingHttpRequest, outgoingHttpResponse) => {
  const publishedEventsList = await EventModel.find({ isPublishedToPublic: true })
    .sort({ startDateTime: 1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalEventsCount: publishedEventsList.length,
    eventsList: publishedEventsList
  });
};

export const handleGetEventById = async (incomingHttpRequest, outgoingHttpResponse) => {
  const eventId = incomingHttpRequest.params.eventId;
  const eventRecord = await EventModel.findById(eventId);

  if (!eventRecord) {
    return outgoingHttpResponse.status(404).json({
      successIndicator: false,
      errorCodeIdentifier: 'EVENT_NOT_FOUND',
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
      statusMessage: 'Tickets successfully issued and reservation locked.',
      purchaseSummary: purchaseResult
    });
  } catch (purchaseError) {
    const statusCode = purchaseError.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorCodeIdentifier: purchaseError.errorCode || 'TICKET_PURCHASE_FAILED',
      errorSummaryMessage: purchaseError.message
    });
  }
};

export const handleDoorScannerCheckIn = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const staffUserId = incomingHttpRequest.authenticatedUser.userId;
    const { ticketTrackingCode, gateScannerLocation } = incomingHttpRequest.body;

    const admissionResult = await validateDoorScannerCheckIn(
      ticketTrackingCode,
      gateScannerLocation,
      staffUserId
    );

    const httpStatus = admissionResult.isAdmitted ? 200 : 409;
    return outgoingHttpResponse.status(httpStatus).json({
      successIndicator: admissionResult.isAdmitted,
      admissionResult
    });
  } catch (scanError) {
    return outgoingHttpResponse.status(500).json({
      successIndicator: false,
      errorCodeIdentifier: 'GATE_SCANNER_ERROR',
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
      const qrDataUrl = await QRCode.toDataURL(t.ticketTrackingCode);
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
