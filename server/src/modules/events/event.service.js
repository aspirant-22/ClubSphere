/**
 * @FILE: event.service.js
 * @RESPONSIBILITY: Business logic for event scheduling, Spring Gala ticketing, duplicate prevention, payment audit approvals, and QR door scanning.
 * @DEPENDENCIES: event.model.js, ticket.model.js, membership.model.js, sequenceRegistry.js, doubleEntryLedger.js, erpConfig.js, qrcode.
 * @MODIFICATION_HOTSPOT: purchaseTicketsWithQuotaLock, approveTicketPurchase, and validateDoorScannerCheckIn.
 * @AUTHOR: Garima Mittal
 */

import QRCode from 'qrcode';
import { EventModel } from './event.model.js';
import { TicketModel, TICKET_ADMISSION_STATES, TICKET_APPROVAL_STATES } from './ticket.model.js';
import { MembershipModel } from '../memberships/membership.model.js';
import { generateNextSequenceCode } from '../../core/sequenceRegistry.js';
import { ERP_LIFECYCLE_STATES } from '../../core/finiteStateMachine.js';
import { postDoubleEntryJournalRecord } from '../../core/doubleEntryLedger.js';
import { ERP_SYSTEM_PARAMETERS } from '../../config/erpConfig.js';

export const createNewEvent = async (eventData, creatorUserId) => {
  const generatedEventCode = await generateNextSequenceCode('EVT');
  return await EventModel.create({
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
};

const verifyDuplicateTicketBooking = async (eventId, purchaserUserId) => {
  const existingTicket = await TicketModel.findOne({
    associatedEventId: eventId,
    purchaserUserId,
    admissionState: { $ne: TICKET_ADMISSION_STATES.CANCELLED },
    approvalState: { $in: [TICKET_APPROVAL_STATES.PENDING_APPROVAL, TICKET_APPROVAL_STATES.CONFIRMED] }
  });
  if (existingTicket) {
    const error = new Error('You already have an active or pending ticket for this event.');
    error.statusCode = 400;
    error.errorCode = 'DUPLICATE_TICKET_PURCHASE';
    throw error;
  }
};

const verifyMemberExclusiveTier = async (selectedTier, purchaserUserId) => {
  if (!selectedTier.isMemberExclusive) return;
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
};

const verifyTierCapacity = async (eventId, selectedTier, requestedQty) => {
  const count = await TicketModel.countDocuments({
    associatedEventId: eventId,
    tierIdentifier: selectedTier.tierIdentifier,
    admissionState: { $ne: TICKET_ADMISSION_STATES.CANCELLED }
  });
  if (count + requestedQty > selectedTier.maximumSeatLimit) {
    const error = new Error(`Capacity exhausted. Remaining: ${selectedTier.maximumSeatLimit - count}`);
    error.statusCode = 409;
    error.errorCode = 'SEAT_CAPACITY_EXHAUSTED';
    throw error;
  }
};

export const purchaseTicketsWithQuotaLock = async (eventId, purchasePayload, purchaserUserId) => {
  const targetEvent = await EventModel.findById(eventId);
  if (!targetEvent) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  await verifyDuplicateTicketBooking(eventId, purchaserUserId);

  const selectedTier = targetEvent.ticketTiers.find(
    (t) => t.tierIdentifier === purchasePayload.ticketTierIdentifier.toUpperCase()
  );
  if (!selectedTier) throw Object.assign(new Error('Tier not available'), { statusCode: 400 });

  await verifyMemberExclusiveTier(selectedTier, purchaserUserId);
  await verifyTierCapacity(eventId, selectedTier, purchasePayload.ticketQuantity || 1);

  const paymentMode = purchasePayload.paymentMode || (purchasePayload.paymentMethod === 'ONLINE_PAYMENT' ? 'ONLINE' : 'CASH');
  const generatedTicketCode = await generateNextSequenceCode('TKT');

  const createdTicket = await TicketModel.create({
    ticketTrackingCode: generatedTicketCode,
    associatedEventId: targetEvent._id,
    purchaserUserId,
    tierIdentifier: selectedTier.tierIdentifier,
    tierName: selectedTier.tierName,
    unitPricePaid: selectedTier.priceAmount,
    approvalState: TICKET_APPROVAL_STATES.PENDING_APPROVAL,
    admissionState: TICKET_ADMISSION_STATES.ISSUED,
    digitalQrPayload: '',
    paymentDetails: {
      paymentMode,
      transactionId: purchasePayload.transactionId || '',
      paymentScreenshotUrl: purchasePayload.paymentScreenshotUrl || '',
      submittedAt: new Date()
    }
  });

  return { issuedTickets: [createdTicket], totalPaid: selectedTier.priceAmount };
};

const postTicketRevenueJournal = async (targetTicket, officerUserId) => {
  const generatedJournalCode = await generateNextSequenceCode('JRN');
  const debitAccount = targetTicket.paymentDetails?.paymentMode === 'CASH'
    ? ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.PETTY_CASH_FLOAT
    : ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.BANK_CAMPUS_ACCOUNT;

  await postDoubleEntryJournalRecord({
    journalEntryTrackingCode: generatedJournalCode,
    sourceDocumentReference: targetTicket.associatedEventId?.eventTrackingCode || targetTicket.ticketTrackingCode,
    transactionMemo: `Ticket payment confirmed for ${targetTicket.associatedEventId?.eventTitle} (${targetTicket.ticketTrackingCode})`,
    postedByUserId: officerUserId,
    journalLines: [
      {
        accountIdentifierCode: debitAccount,
        debitAmountValue: targetTicket.unitPricePaid,
        creditAmountValue: 0,
        lineItemDescription: `Proceeds collected via ${targetTicket.paymentDetails?.paymentMode || 'CASH'}`
      },
      {
        accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_TICKET_SALES,
        debitAmountValue: 0,
        creditAmountValue: targetTicket.unitPricePaid,
        lineItemDescription: `Ticket sales revenue for ${targetTicket.associatedEventId?.eventTitle}`
      }
    ]
  });
};

export const approveTicketPurchase = async (ticketId, officerUserId) => {
  const targetTicket = await TicketModel.findById(ticketId).populate('associatedEventId');
  if (!targetTicket) throw Object.assign(new Error('Ticket not found'), { statusCode: 404 });
  if (targetTicket.approvalState === TICKET_APPROVAL_STATES.CONFIRMED) return targetTicket;

  const qrPayload = JSON.stringify({
    ticketCode: targetTicket.ticketTrackingCode,
    eventId: targetTicket.associatedEventId?._id?.toString(),
    eventTitle: targetTicket.associatedEventId?.eventTitle,
    tier: targetTicket.tierName
  });

  targetTicket.approvalState = TICKET_APPROVAL_STATES.CONFIRMED;
  targetTicket.digitalQrPayload = qrPayload;
  targetTicket.paymentDetails.approvedAt = new Date();
  targetTicket.paymentDetails.approvedByUserId = officerUserId;
  await targetTicket.save();

  if (targetTicket.unitPricePaid > 0) {
    await postTicketRevenueJournal(targetTicket, officerUserId);
  }
  return targetTicket;
};

export const getPendingTicketApprovals = async () => {
  return await TicketModel.find({ approvalState: TICKET_APPROVAL_STATES.PENDING_APPROVAL })
    .populate('purchaserUserId', 'fullName emailAddress studentIdentificationNumber')
    .populate('associatedEventId', 'eventTitle eventTrackingCode startDateTime')
    .sort({ createdAt: -1 });
};

export const validateDoorScannerCheckIn = async (ticketTrackingCode, scannerLocation, staffUserId) => {
  const targetTicket = await TicketModel.findOne({
    ticketTrackingCode: ticketTrackingCode.trim().toUpperCase()
  }).populate('purchaserUserId', 'fullName emailAddress studentIdentificationNumber');

  if (!targetTicket) {
    return { isAdmitted: false, validationVerdict: 'INVALID_TICKET', message: 'Ticket does not exist.' };
  }
  if (targetTicket.isCheckedIn || targetTicket.admissionState === TICKET_ADMISSION_STATES.CHECKED_IN) {
    return {
      isAdmitted: false,
      validationVerdict: 'DUPLICATE_ENTRY_ATTEMPT',
      message: `Already checked in at ${targetTicket.checkInTimestamp?.toLocaleTimeString()}.`,
      targetTicket
    };
  }
  targetTicket.isCheckedIn = true;
  targetTicket.admissionState = TICKET_ADMISSION_STATES.CHECKED_IN;
  targetTicket.checkInTimestamp = new Date();
  targetTicket.verifiedByStaffUserId = staffUserId;
  targetTicket.gateScannerLocation = scannerLocation || 'MAIN_ENTRANCE_DOOR';
  await targetTicket.save();

  return {
    isAdmitted: true,
    validationVerdict: 'ADMISSION_GRANTED',
    message: `Admitted: ${targetTicket.purchaserUserId?.fullName} (${targetTicket.tierName})`,
    targetTicket
  };
};

export const generateEventReconciliationSummary = async (eventId) => {
  const targetEvent = await EventModel.findById(eventId);
  if (!targetEvent) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  const allTickets = await TicketModel.find({ associatedEventId: eventId });
  const totalIssued = allTickets.length;
  const checkedIn = allTickets.filter((t) => t.isCheckedIn).length;
  const grossRev = allTickets.reduce((sum, t) => sum + t.unitPricePaid, 0);

  return {
    eventTrackingCode: targetEvent.eventTrackingCode,
    eventTitle: targetEvent.eventTitle,
    maximumCapacityLimit: targetEvent.maximumCapacityLimit,
    totalTicketsIssued: totalIssued,
    totalAttendeesCheckedIn: checkedIn,
    totalGrossRevenue: grossRev,
    attendanceYieldPercentage: totalIssued > 0 ? Math.round((checkedIn / totalIssued) * 100) : 0
  };
};
