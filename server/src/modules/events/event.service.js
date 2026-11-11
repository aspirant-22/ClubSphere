/**
 * @FILE: event.service.js
 * @RESPONSIBILITY: Business logic for event scheduling, Spring Gala ticketing, membership discount validation, and QR door scanning.
 * @DEPENDENCIES: event.model.js, ticket.model.js, membership.model.js, sequenceRegistry.js, doubleEntryLedger.js, erpConfig.js, qrcode.
 * @MODIFICATION_HOTSPOT: purchaseTicketsWithQuotaLock and validateDoorScannerCheckIn.
 * @AUTHOR: Garima Mittal
 */

import QRCode from 'qrcode';
import { EventModel } from './event.model.js';
import { TicketModel, TICKET_ADMISSION_STATES } from './ticket.model.js';
import { MembershipModel } from '../memberships/membership.model.js';
import { generateNextSequenceCode } from '../../core/sequenceRegistry.js';
import { ERP_LIFECYCLE_STATES } from '../../core/finiteStateMachine.js';
import { postDoubleEntryJournalRecord } from '../../core/doubleEntryLedger.js';
import { ERP_SYSTEM_PARAMETERS } from '../../config/erpConfig.js';

export const createNewEvent = async (eventData, creatorUserId) => {
  const generatedEventCode = await generateNextSequenceCode('EVT');

  const createdEvent = await EventModel.create({
    eventTrackingCode: generatedEventCode,
    eventTitle: eventData.eventTitle,
    eventDescription: eventData.eventDescription,
    venueLocation: eventData.venueLocation,
    startDateTime: new Date(eventData.startDateTime),
    endDateTime: new Date(eventData.endDateTime),
    maximumCapacityLimit: eventData.maximumCapacityLimit,
    ticketTiers: eventData.ticketTiers,
    lifecycleState: ERP_LIFECYCLE_STATES.READY,
    isPublishedToPublic: true,
    createdByUserId: creatorUserId
  });

  console.log(`[Event Service]: Created event ${generatedEventCode}: ${eventData.eventTitle}`);
  return createdEvent;
};

export const purchaseTicketsWithQuotaLock = async (eventId, purchasePayload, purchaserUserId) => {
  const targetEvent = await EventModel.findById(eventId);
  if (!targetEvent) {
    const error = new Error('Target event not found.');
    error.statusCode = 404;
    throw error;
  }

  const selectedTier = targetEvent.ticketTiers.find(
    (tier) => tier.tierIdentifier === purchasePayload.ticketTierIdentifier.toUpperCase()
  );

  if (!selectedTier) {
    const error = new Error(`Tier ${purchasePayload.ticketTierIdentifier} not available on this event.`);
    error.statusCode = 400;
    throw error;
  }

  if (selectedTier.isMemberExclusive) {
    const activeMembership = await MembershipModel.findOne({
      associatedUserId: purchaserUserId,
      lifecycleState: ERP_LIFECYCLE_STATES.DONE,
      isDuesPaid: true
    });
    if (!activeMembership) {
      const error = new Error('This ticket tier requires an active, paid club membership.');
      error.statusCode = 403;
      error.errorCode = 'MEMBER_EXCLUSIVE_TIER_RESTRICTION';
      throw error;
    }
  }

  const existingTierTicketsCount = await TicketModel.countDocuments({
    associatedEventId: eventId,
    tierIdentifier: selectedTier.tierIdentifier,
    admissionState: { $ne: TICKET_ADMISSION_STATES.CANCELLED }
  });

  if (existingTierTicketsCount + purchasePayload.ticketQuantity > selectedTier.maximumSeatLimit) {
    const error = new Error(`Capacity exhausted for ${selectedTier.tierName}. Remaining seats: ${selectedTier.maximumSeatLimit - existingTierTicketsCount}`);
    error.statusCode = 409;
    error.errorCode = 'SEAT_CAPACITY_EXHAUSTED';
    throw error;
  }

  const issuedTicketsArray = [];
  const totalTransactionAmount = selectedTier.priceAmount * purchasePayload.ticketQuantity;

  for (let index = 0; index < purchasePayload.ticketQuantity; index++) {
    const generatedTicketCode = await generateNextSequenceCode('TKT');
    const qrPayloadString = JSON.stringify({
      ticketCode: generatedTicketCode,
      eventId: targetEvent._id.toString(),
      eventTitle: targetEvent.eventTitle,
      tier: selectedTier.tierName
    });

    const issuedTicket = await TicketModel.create({
      ticketTrackingCode: generatedTicketCode,
      associatedEventId: targetEvent._id,
      purchaserUserId,
      tierIdentifier: selectedTier.tierIdentifier,
      tierName: selectedTier.tierName,
      unitPricePaid: selectedTier.priceAmount,
      admissionState: TICKET_ADMISSION_STATES.ISSUED,
      digitalQrPayload: qrPayloadString
    });
    issuedTicketsArray.push(issuedTicket);
  }

  if (totalTransactionAmount > 0) {
    const generatedJournalCode = await generateNextSequenceCode('JRN');
    const debitAccount = purchasePayload.paymentMethod === 'CASH_AT_DOOR'
      ? ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.PETTY_CASH_FLOAT
      : ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.BANK_CAMPUS_ACCOUNT;

    await postDoubleEntryJournalRecord({
      journalEntryTrackingCode: generatedJournalCode,
      sourceDocumentReference: targetEvent.eventTrackingCode,
      transactionMemo: `Ticket sales for ${targetEvent.eventTitle} (${purchasePayload.ticketQuantity}x ${selectedTier.tierName})`,
      postedByUserId: purchaserUserId,
      journalLines: [
        {
          accountIdentifierCode: debitAccount,
          debitAmountValue: totalTransactionAmount,
          creditAmountValue: 0,
          lineItemDescription: `Proceeds collected via ${purchasePayload.paymentMethod}`
        },
        {
          accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_TICKET_SALES,
          debitAmountValue: 0,
          creditAmountValue: totalTransactionAmount,
          lineItemDescription: `Ticket sales revenue for ${targetEvent.eventTitle}`
        }
      ]
    });
  }

  console.log(`[Event Service]: Issued ${purchasePayload.ticketQuantity} tickets for ${targetEvent.eventTitle}`);
  return { issuedTickets: issuedTicketsArray, totalPaid: totalTransactionAmount };
};

export const validateDoorScannerCheckIn = async (ticketTrackingCode, scannerLocation, staffUserId) => {
  const targetTicket = await TicketModel.findOne({
    ticketTrackingCode: ticketTrackingCode.trim().toUpperCase()
  }).populate('purchaserUserId', 'fullName emailAddress studentIdentificationNumber');

  if (!targetTicket) {
    return {
      isAdmitted: false,
      validationVerdict: 'INVALID_TICKET',
      message: 'Ticket tracking code does not exist in registry.'
    };
  }

  if (targetTicket.isCheckedIn || targetTicket.admissionState === TICKET_ADMISSION_STATES.CHECKED_IN) {
    console.warn(`[Door Scanner Warning]: Duplicate scan attempt for ${ticketTrackingCode}`);
    return {
      isAdmitted: false,
      validationVerdict: 'DUPLICATE_ENTRY_ATTEMPT',
      message: `Already checked in at ${targetTicket.checkInTimestamp?.toLocaleTimeString()} at gate ${targetTicket.gateScannerLocation}. Entry denied.`,
      targetTicket
    };
  }

  targetTicket.isCheckedIn = true;
  targetTicket.admissionState = TICKET_ADMISSION_STATES.CHECKED_IN;
  targetTicket.checkInTimestamp = new Date();
  targetTicket.verifiedByStaffUserId = staffUserId;
  targetTicket.gateScannerLocation = scannerLocation || 'MAIN_ENTRANCE_DOOR';
  await targetTicket.save();

  console.log(`[Door Scanner]: Successful admission for ${ticketTrackingCode} (${targetTicket.purchaserUserId?.fullName})`);
  return {
    isAdmitted: true,
    validationVerdict: 'ADMISSION_GRANTED',
    message: `Admitted: ${targetTicket.purchaserUserId?.fullName} (${targetTicket.tierName})`,
    targetTicket
  };
};

export const generateEventReconciliationSummary = async (eventId) => {
  const targetEvent = await EventModel.findById(eventId);
  if (!targetEvent) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  const allTicketsForEvent = await TicketModel.find({ associatedEventId: eventId });
  const totalTicketsIssued = allTicketsForEvent.length;
  const totalAttendeesCheckedIn = allTicketsForEvent.filter((ticket) => ticket.isCheckedIn).length;
  const totalGrossRevenue = allTicketsForEvent.reduce((sum, ticket) => sum + ticket.unitPricePaid, 0);
  const attendanceYieldPercentage = totalTicketsIssued > 0
    ? Math.round((totalAttendeesCheckedIn / totalTicketsIssued) * 100)
    : 0;

  return {
    eventTrackingCode: targetEvent.eventTrackingCode,
    eventTitle: targetEvent.eventTitle,
    maximumCapacityLimit: targetEvent.maximumCapacityLimit,
    totalTicketsIssued,
    totalAttendeesCheckedIn,
    totalGrossRevenue,
    attendanceYieldPercentage
  };
};
