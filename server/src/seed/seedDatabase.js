/**
 * @FILE: seedDatabase.js
 * @RESPONSIBILITY: Master standalone idempotent database seeding script generating 200+ historical records across all Skyline Student Association subdomains.
 * @DEPENDENCIES: mongoose, bcryptjs, qrcode, erpConfig.js, auth.model.js, membership.model.js, event.model.js, ticket.model.js, product.model.js, salesOrder.model.js, activity.model.js, reimbursement.model.js, broadcast.model.js, doubleEntryLedger.js, stockLedger.js, sequenceRegistry.js.
 * @MODIFICATION_HOTSPOT: seedDatabaseExecution main routine.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

import { ERP_SYSTEM_PARAMETERS } from '../config/erpConfig.js';
import { UserModel } from '../modules/auth/auth.model.js';
import { MembershipModel, MEMBERSHIP_TIERS } from '../modules/memberships/membership.model.js';
import { EventModel } from '../modules/events/event.model.js';
import { TicketModel, TICKET_ADMISSION_STATES } from '../modules/events/ticket.model.js';
import { ProductModel, PRODUCT_CATEGORIES } from '../modules/merchandise/product.model.js';
import { SalesOrderModel } from '../modules/merchandise/salesOrder.model.js';
import { ActivityTaskModel } from '../modules/activities/activity.model.js';
import { ReimbursementModel, EXPENSE_CATEGORIES } from '../modules/accounting/reimbursement.model.js';
import { BroadcastModel, BROADCAST_AUDIENCE_TIERS, BROADCAST_CATEGORIES } from '../modules/broadcasts/broadcast.model.js';
import { JournalEntryModel } from '../core/doubleEntryLedger.js';
import { StockMovementModel } from '../core/stockLedger.js';
import { SequenceRegistryModel } from '../core/sequenceRegistry.js';
import { ERP_LIFECYCLE_STATES } from '../core/finiteStateMachine.js';
import { ERP_USER_ROLES } from '../middleware/rbacAuthorization.js';

dotenv.config();

const clearExistingDatabaseCollections = async () => {
  console.log('[Seed Engine]: Purging previous database collections...');
  const collectionsToClear = [
    UserModel,
    MembershipModel,
    EventModel,
    TicketModel,
    ProductModel,
    SalesOrderModel,
    ActivityTaskModel,
    ReimbursementModel,
    BroadcastModel,
    JournalEntryModel,
    StockMovementModel,
    SequenceRegistryModel
  ];
  for (const singleModel of collectionsToClear) {
    await singleModel.deleteMany({});
  }
  console.log('[Seed Engine]: All previous collections cleared.');
};

const seedUserAccounts = async () => {
  console.log('[Seed Engine]: Creating core user accounts...');
  const plainPassword = 'SkylineClub2026!';

  const adminUser = await UserModel.create({
    fullName: 'Garima Mittal',
    studentIdentificationNumber: 'SKY-ADM-001',
    emailAddress: 'president@skyline.edu',
    passwordCredentialHash: plainPassword,
    userRoleTier: ERP_USER_ROLES.ADMIN,
    phoneNumber: '+1-555-010-0001'
  });

  const treasurerUser = await UserModel.create({
    fullName: 'Alex Vance',
    studentIdentificationNumber: 'SKY-ADM-002',
    emailAddress: 'treasurer@skyline.edu',
    passwordCredentialHash: plainPassword,
    userRoleTier: ERP_USER_ROLES.ADMIN,
    phoneNumber: '+1-555-010-0002'
  });

  const operationsLead = await UserModel.create({
    fullName: 'Samantha Reed',
    studentIdentificationNumber: 'SKY-OPS-010',
    emailAddress: 'operations@skyline.edu',
    passwordCredentialHash: plainPassword,
    userRoleTier: ERP_USER_ROLES.OPERATIONS,
    phoneNumber: '+1-555-010-0010'
  });

  const createdStudents = [];
  for (let i = 1; i <= 30; i++) {
    const paddedId = String(i).padStart(3, '0');
    const student = await UserModel.create({
      fullName: `Student Member ${i}`,
      studentIdentificationNumber: `SKY-STU-${paddedId}`,
      emailAddress: `member${i}@skyline.edu`,
      passwordCredentialHash: plainPassword,
      userRoleTier: ERP_USER_ROLES.CUSTOMER,
      phoneNumber: `+1-555-100-${paddedId}`
    });
    createdStudents.push(student);
  }

  console.log(`[Seed Engine]: Seeded ${createdStudents.length + 3} users.`);
  return { adminUser, treasurerUser, operationsLead, createdStudents };
};

const seedMembershipsAndLedger = async (adminUser, createdStudents) => {
  console.log('[Seed Engine]: Seeding memberships and dues general ledger...');
  const memberships = [];
  const journalEntries = [];

  for (let i = 0; i < createdStudents.length; i++) {
    const student = createdStudents[i];
    const seqNum = String(i + 1).padStart(4, '0');
    const memberCode = `MEM/2026/${seqNum}`;
    const qrData = JSON.stringify({ memberCode, studentId: student.studentIdentificationNumber });
    const isPaid = i < 26; // 26 paid, 4 pending

    const startDate = new Date(2026, 0, 15);
    const expireDate = new Date(2027, 0, 15);

    const membership = await MembershipModel.create({
      membershipSequenceCode: memberCode,
      associatedUserId: student._id,
      membershipTier: i % 5 === 0 ? MEMBERSHIP_TIERS.LIFETIME : MEMBERSHIP_TIERS.STANDARD_ANNUAL,
      lifecycleState: isPaid ? ERP_LIFECYCLE_STATES.DONE : ERP_LIFECYCLE_STATES.WAITING,
      academicDepartment: i % 2 === 0 ? 'Computer Science' : 'Business Administration',
      academicYear: 'SOPHOMORE',
      duesAmountPayable: i % 5 === 0 ? 1500 : 500,
      isDuesPaid: isPaid,
      paymentDate: isPaid ? startDate : null,
      membershipStartDate: isPaid ? startDate : null,
      membershipExpirationDate: isPaid ? expireDate : null,
      digitalQrTokenPayload: qrData,
      emergencyContactName: `Guardian of ${student.fullName}`,
      emergencyContactPhone: '+1-555-999-0000',
      updatedByUserId: adminUser._id
    });
    memberships.push(membership);

    if (isPaid) {
      const journalCode = `JRN/2026/${String(i + 1).padStart(4, '0')}`;
      const duesAmt = membership.duesAmountPayable;
      const journal = await JournalEntryModel.create({
        journalEntryTrackingCode: journalCode,
        sourceDocumentReference: memberCode,
        transactionMemo: `Annual dues collected from ${student.fullName}`,
        totalTransactionAmount: duesAmt,
        postedByUserId: adminUser._id,
        journalLines: [
          {
            accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.BANK_CAMPUS_ACCOUNT,
            debitAmountValue: duesAmt,
            creditAmountValue: 0,
            lineItemDescription: 'Dues received via Campus Bank Transfer'
          },
          {
            accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.INCOME_MEMBERSHIP_DUES,
            debitAmountValue: 0,
            creditAmountValue: duesAmt,
            lineItemDescription: `Membership revenue for ${membership.membershipTier}`
          }
        ]
      });
      journalEntries.push(journal);
    }
  }

  console.log(`[Seed Engine]: Seeded ${memberships.length} memberships, ${journalEntries.length} dues journal postings.`);
  return { memberships, journalEntries };
};

const seedEventsAndTickets = async (adminUser, operationsLead, createdStudents) => {
  console.log('[Seed Engine]: Seeding Spring Gala event and multi-tier tickets...');
  const galaEvent = await EventModel.create({
    eventTrackingCode: 'EVT/2026/0001',
    eventTitle: 'Skyline Annual Spring Gala 2026',
    eventDescription: 'The biggest night of the campus year! Formal dinner, live orchestra, dance floor, and keynote remarks from alumni.',
    venueLocation: 'Campus Grand Ballroom, Building C',
    startDateTime: new Date(2026, 4, 18, 19, 0),
    endDateTime: new Date(2026, 4, 18, 23, 30),
    maximumCapacityLimit: 250,
    ticketTiers: [
      {
        tierIdentifier: 'VIP_MEMBER',
        tierName: 'VIP Gala Pass (Front Row & Dinner)',
        priceAmount: 350,
        isMemberExclusive: true,
        maximumSeatLimit: 50
      },
      {
        tierIdentifier: 'GEN_MEMBER',
        tierName: 'General Admission - Member Tier',
        priceAmount: 150,
        isMemberExclusive: true,
        maximumSeatLimit: 120
      },
      {
        tierIdentifier: 'GUEST_PASS',
        tierName: 'General Admission - Non-Member Guest',
        priceAmount: 300,
        isMemberExclusive: false,
        maximumSeatLimit: 80
      }
    ],
    lifecycleState: ERP_LIFECYCLE_STATES.READY,
    isPublishedToPublic: true,
    createdByUserId: adminUser._id
  });

  const tickets = [];
  for (let i = 0; i < 40; i++) {
    const student = createdStudents[i % createdStudents.length];
    const ticketCode = `TKT/2026/${String(i + 1).padStart(4, '0')}`;
    const isVip = i < 10;
    const tierId = isVip ? 'VIP_MEMBER' : 'GEN_MEMBER';
    const tierName = isVip ? 'VIP Gala Pass (Front Row & Dinner)' : 'General Admission - Member Tier';
    const price = isVip ? 350 : 150;
    const isCheckedIn = i < 22; // 22 checked in at door

    const ticket = await TicketModel.create({
      ticketTrackingCode: ticketCode,
      associatedEventId: galaEvent._id,
      purchaserUserId: student._id,
      tierIdentifier: tierId,
      tierName: tierName,
      unitPricePaid: price,
      admissionState: isCheckedIn ? TICKET_ADMISSION_STATES.CHECKED_IN : TICKET_ADMISSION_STATES.ISSUED,
      isCheckedIn: isCheckedIn,
      checkInTimestamp: isCheckedIn ? new Date(2026, 4, 18, 19, 15 + i) : null,
      verifiedByStaffUserId: isCheckedIn ? operationsLead._id : null,
      gateScannerLocation: 'MAIN_ENTRANCE_DOOR',
      digitalQrPayload: JSON.stringify({ ticketCode, event: 'Spring Gala 2026' })
    });
    tickets.push(ticket);
  }

  console.log(`[Seed Engine]: Seeded Spring Gala event and ${tickets.length} issued tickets.`);
  return { galaEvent, tickets };
};

const seedMerchandiseAndStock = async (adminUser, createdStudents) => {
  console.log('[Seed Engine]: Seeding apparel merchandise and double-entry stock ledger...');
  const navyHoodie = await ProductModel.create({
    skuIdentifier: 'SKU-HOODIE-NAVY',
    productName: 'Skyline Official Heavyweight Hoodie (Navy)',
    productCategory: PRODUCT_CATEGORIES.HOODIES,
    productDescription: '380 GSM fleece lined premium navy blue club hoodie with embroidered Skyline chest crest.',
    memberPriceAmount: 799,
    nonMemberPriceAmount: 999,
    sizeMatrixStock: [
      { sizeVariant: 'XS', currentInventoryCount: 15 },
      { sizeVariant: 'S', currentInventoryCount: 25 },
      { sizeVariant: 'M', currentInventoryCount: 40 },
      { sizeVariant: 'L', currentInventoryCount: 35 },
      { sizeVariant: 'XL', currentInventoryCount: 20 },
      { sizeVariant: '2XL', currentInventoryCount: 10 }
    ],
    isAvailableForOrder: true
  });

  const crewneckTee = await ProductModel.create({
    skuIdentifier: 'SKU-TEE-WHITE',
    productName: 'Skyline Heritage Cotton Crewneck Tee',
    productCategory: PRODUCT_CATEGORIES.T_SHIRTS,
    productDescription: '100% combed ringspun cotton white t-shirt featuring vintage campus athletic script.',
    memberPriceAmount: 399,
    nonMemberPriceAmount: 499,
    sizeMatrixStock: [
      { sizeVariant: 'S', currentInventoryCount: 30 },
      { sizeVariant: 'M', currentInventoryCount: 50 },
      { sizeVariant: 'L', currentInventoryCount: 45 },
      { sizeVariant: 'XL', currentInventoryCount: 25 }
    ],
    isAvailableForOrder: true
  });

  const salesOrders = [];
  const stockMoves = [];

  for (let i = 0; i < 20; i++) {
    const student = createdStudents[i % createdStudents.length];
    const orderCode = `SO/2026/${String(i + 1).padStart(4, '0')}`;
    const isHoodie = i % 2 === 0;
    const targetProduct = isHoodie ? navyHoodie : crewneckTee;
    const size = isHoodie ? 'M' : 'L';
    const price = isHoodie ? 799 : 399;

    const order = await SalesOrderModel.create({
      salesOrderSequenceCode: orderCode,
      customerUserId: student._id,
      orderLineItems: [
        {
          associatedProductId: targetProduct._id,
          productName: targetProduct.productName,
          skuIdentifier: targetProduct.skuIdentifier,
          selectedSizeVariant: size,
          unitPriceCharged: price,
          orderQuantity: 1,
          subtotalPriceAmount: price
        }
      ],
      grossTotalAmount: price,
      lifecycleState: i < 15 ? ERP_LIFECYCLE_STATES.DONE : ERP_LIFECYCLE_STATES.READY,
      deliveryMethod: 'CAMPUS_TABLE_PICKUP',
      isPaid: true
    });
    salesOrders.push(order);

    const stockMove = await StockMovementModel.create({
      movementTrackingCode: `STK/2026/${String(i + 1).padStart(4, '0')}`,
      sourceDocumentReference: orderCode,
      associatedProductId: targetProduct._id,
      skuIdentifier: targetProduct.skuIdentifier,
      sizeVariant: size,
      quantityMoved: 1,
      sourceLocationNode: ERP_SYSTEM_PARAMETERS.STOCK_LOCATIONS.STORAGE_ROOM,
      destinationLocationNode: ERP_SYSTEM_PARAMETERS.STOCK_LOCATIONS.CUSTOMERS,
      recordedByUserId: student._id
    });
    stockMoves.push(stockMove);
  }

  console.log(`[Seed Engine]: Seeded 2 products, ${salesOrders.length} sales orders, ${stockMoves.length} stock ledger transfers.`);
  return { navyHoodie, crewneckTee, salesOrders, stockMoves };
};

const seedVolunteerKanbanTasks = async (adminUser, operationsLead, createdStudents) => {
  console.log('[Seed Engine]: Seeding Bake Sale Fundraiser volunteer Kanban pipeline...');
  const taskDefinitions = [
    {
      title: 'Procure Baker’s Flour, Belgian Cocoa, and Cane Sugar',
      cat: 'SUPPLIES_LOGISTICS',
      stage: 'COMPLETED',
      priority: 'CRITICAL',
      budget: 1500
    },
    {
      title: 'Batch Bake 60 Salted Caramel Chocolate Brownies',
      cat: 'BAKING_PRODUCTION',
      stage: 'COMPLETED',
      priority: 'HIGH',
      budget: 800
    },
    {
      title: 'Bake 100 Vanilla Bean Glazed Scones (Gluten-Free)',
      cat: 'BAKING_PRODUCTION',
      stage: 'IN_PROGRESS',
      priority: 'HIGH',
      budget: 1000
    },
    {
      title: 'Secure Campus Quad Canopy Tent & Folding Tables',
      cat: 'SUPPLIES_LOGISTICS',
      stage: 'IN_PROGRESS',
      priority: 'MEDIUM',
      budget: 500
    },
    {
      title: 'Design Bake Sale Price Board & QR Payment Standees',
      cat: 'MARKETING_OUTREACH',
      stage: 'REVIEW',
      priority: 'MEDIUM',
      budget: 400
    },
    {
      title: 'Manage Shift 1: 10:00 AM - 12:00 PM Table Sales & Float',
      cat: 'TABLE_MANAGEMENT',
      stage: 'TO_DO',
      priority: 'HIGH',
      budget: 200
    },
    {
      title: 'Manage Shift 2: 12:00 PM - 02:00 PM Rush Hour Sales',
      cat: 'TABLE_MANAGEMENT',
      stage: 'TO_DO',
      priority: 'HIGH',
      budget: 200
    },
    {
      title: 'Manage Shift 3: 02:00 PM - 04:00 PM Pack-down & Cash Count',
      cat: 'TABLE_MANAGEMENT',
      stage: 'BACKLOG',
      priority: 'MEDIUM',
      budget: 200
    },
    {
      title: 'Bake 80 Double Chocolate Chip Cookies (Vegan)',
      cat: 'BAKING_PRODUCTION',
      stage: 'BACKLOG',
      priority: 'MEDIUM',
      budget: 600
    },
    {
      title: 'Quad Sound System Setup for Background Music',
      cat: 'MARKETING_OUTREACH',
      stage: 'BACKLOG',
      priority: 'LOW',
      budget: 300
    }
  ];

  const tasks = [];
  for (let i = 0; i < taskDefinitions.length; i++) {
    const def = taskDefinitions[i];
    const assignedVolunteers = [createdStudents[i % createdStudents.length]._id, createdStudents[(i + 1) % createdStudents.length]._id];

    const task = await ActivityTaskModel.create({
      activityTrackingCode: `ACT/2026/${String(i + 1).padStart(4, '0')}`,
      projectName: 'Bake Sale Fundraiser',
      taskTitle: def.title,
      taskDescription: `Execution plan for ${def.title} under the Skyline Bake Sale initiative.`,
      taskCategory: def.cat,
      kanbanStage: def.stage,
      priorityLevel: def.priority,
      assignedVolunteerUserIds: assignedVolunteers,
      allocatedBudgetCap: def.budget,
      targetCompletionDate: new Date(2026, 4, 12, 16, 0),
      createdByUserId: operationsLead._id
    });
    tasks.push(task);
  }

  console.log(`[Seed Engine]: Seeded ${tasks.length} volunteer Kanban tasks.`);
  return { tasks };
};

const seedReimbursementsAndBroadcasts = async (adminUser, treasurerUser, createdStudents) => {
  console.log('[Seed Engine]: Seeding volunteer expense reimbursements and broadcasts...');
  const reimbursements = [];

  const claimScenarios = [
    {
      cat: EXPENSE_CATEGORIES.BAKE_SALE_SUPPLIES,
      amt: 1240,
      vendor: 'Costco Wholesale #42',
      purpose: 'Bulk flour, organic sugar, butter, and parchment sheets for bake sale',
      status: ERP_LIFECYCLE_STATES.DONE
    },
    {
      cat: EXPENSE_CATEGORIES.EVENT_DECOR,
      amt: 850,
      vendor: 'Party City Downtown',
      purpose: 'Spring Gala table runners, fairy lights, and photo backdrop',
      status: ERP_LIFECYCLE_STATES.DONE
    },
    {
      cat: EXPENSE_CATEGORIES.PRINTING_SIGNAGE,
      amt: 320,
      vendor: 'Campus Print Lab',
      purpose: 'Laminated directional signs and QR check-in flyers for Quad',
      status: ERP_LIFECYCLE_STATES.DONE
    },
    {
      cat: EXPENSE_CATEGORIES.EQUIPMENT_RENTAL,
      amt: 1500,
      vendor: 'Metro Sound & Stage LLC',
      purpose: 'Wireless microphone kit and portable amplifier for General Assembly',
      status: ERP_LIFECYCLE_STATES.WAITING
    },
    {
      cat: EXPENSE_CATEGORIES.FOOD_BEVERAGE,
      amt: 480,
      vendor: 'Trader Joe’s #108',
      purpose: 'Bottled water and fruit snacks for orientation volunteers',
      status: ERP_LIFECYCLE_STATES.WAITING
    }
  ];

  for (let i = 0; i < claimScenarios.length; i++) {
    const sc = claimScenarios[i];
    const student = createdStudents[i % createdStudents.length];
    const claimCode = `EXP/2026/${String(i + 1).padStart(4, '0')}`;

    const claim = await ReimbursementModel.create({
      reimbursementTrackingCode: claimCode,
      claimantUserId: student._id,
      expenseCategory: sc.cat,
      claimAmount: sc.amt,
      vendorMerchantName: sc.vendor,
      expenseDate: new Date(2026, 3, 10 + i),
      receiptDocumentUrl: `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80`,
      businessPurposeJustification: sc.purpose,
      lifecycleState: sc.status,
      treasurerReviewNotes: sc.status === ERP_LIFECYCLE_STATES.DONE ? 'Approved and disbursed via campus transfer.' : 'Pending treasurer review.',
      reviewedByTreasurerUserId: sc.status === ERP_LIFECYCLE_STATES.DONE ? treasurerUser._id : null,
      settlementTimestamp: sc.status === ERP_LIFECYCLE_STATES.DONE ? new Date() : null
    });
    reimbursements.push(claim);

    if (sc.status === ERP_LIFECYCLE_STATES.DONE) {
      await JournalEntryModel.create({
        journalEntryTrackingCode: `JRN/2026/${String(50 + i).padStart(4, '0')}`,
        sourceDocumentReference: claimCode,
        transactionMemo: `Expense reimbursement for ${student.fullName} (${sc.cat})`,
        totalTransactionAmount: sc.amt,
        postedByUserId: treasurerUser._id,
        journalLines: [
          {
            accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.EXPENSE_SUPPLIES_LOGISTICS,
            debitAmountValue: sc.amt,
            creditAmountValue: 0,
            lineItemDescription: sc.purpose
          },
          {
            accountIdentifierCode: ERP_SYSTEM_PARAMETERS.CHART_OF_ACCOUNTS.BANK_CAMPUS_ACCOUNT,
            debitAmountValue: 0,
            creditAmountValue: sc.amt,
            lineItemDescription: `Disbursed to ${student.fullName} via transfer`
          }
        ]
      });
    }
  }

  const bulletins = [
    {
      title: 'Spring Gala 2026 Ticket Sales Are Officially Live!',
      content: 'Early-bird tickets for our Annual Spring Gala are now open on ClubSphere. Active members receive exclusive discounted rates of ₹150 for General Admission and ₹350 for VIP Front Row passes. Reserve early before seats cap out!',
      tier: BROADCAST_AUDIENCE_TIERS.ALL_MEMBERS,
      cat: BROADCAST_CATEGORIES.EVENT_UPDATE,
      urgent: true
    },
    {
      title: 'Volunteers Needed: Quad Bake Sale Fundraiser Shifts',
      content: 'We are raising funds for our community outreach initiative! Volunteer slots for baking, table setup, and sales shifts are now live on the Kanban board. Head over to Activities to pick your shift.',
      tier: BROADCAST_AUDIENCE_TIERS.ALL_MEMBERS,
      cat: BROADCAST_CATEGORIES.GENERAL_ANNOUNCEMENT,
      urgent: false
    },
    {
      title: 'Executive Board Emergency Briefing: Gala Permits & Security',
      content: 'Mandatory synchronization meeting for all executive officers and operations leads regarding ballroom capacity regulations and catering health permits. Friday at 5:00 PM in Conference Room 204.',
      tier: BROADCAST_AUDIENCE_TIERS.EXECUTIVES_ONLY,
      cat: BROADCAST_CATEGORIES.EMERGENCY_MEETING,
      urgent: true
    },
    {
      title: 'Welcome to Skyline Student Association (Spring Semester 2026)',
      content: 'Welcome prospective students and returning campus community! ClubSphere is now our official home for club memberships, events, apparel, and club activities. Drop by our campus tables to say hello!',
      tier: BROADCAST_AUDIENCE_TIERS.PUBLIC,
      cat: BROADCAST_CATEGORIES.GENERAL_ANNOUNCEMENT,
      urgent: false
    }
  ];

  const seededBroadcasts = [];
  for (let i = 0; i < bulletins.length; i++) {
    const b = bulletins[i];
    const broadcast = await BroadcastModel.create({
      broadcastTrackingCode: `ANN/2026/${String(i + 1).padStart(4, '0')}`,
      bulletinTitle: b.title,
      bulletinContent: b.content,
      targetAudienceTier: b.tier,
      bulletinCategory: b.cat,
      isUrgentHighPriority: b.urgent,
      senderUserId: adminUser._id
    });
    seededBroadcasts.push(broadcast);
  }

  console.log(`[Seed Engine]: Seeded ${reimbursements.length} reimbursement claims, ${seededBroadcasts.length} broadcasts.`);
  return { reimbursements, seededBroadcasts };
};

export const runMasterDatabaseSeeding = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clubsphere_erp';
  console.log(`[Seed Engine]: Connecting to database at ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  try {
    await clearExistingDatabaseCollections();
    const { adminUser, treasurerUser, operationsLead, createdStudents } = await seedUserAccounts();
    const { memberships, journalEntries } = await seedMembershipsAndLedger(adminUser, createdStudents);
    const { galaEvent, tickets } = await seedEventsAndTickets(adminUser, operationsLead, createdStudents);
    const { navyHoodie, crewneckTee, salesOrders, stockMoves } = await seedMerchandiseAndStock(adminUser, createdStudents);
    const { tasks } = await seedVolunteerKanbanTasks(adminUser, operationsLead, createdStudents);
    const { reimbursements, seededBroadcasts } = await seedReimbursementsAndBroadcasts(adminUser, treasurerUser, createdStudents);

    // Initialize sequence registry counters to ensure new records start after seeded records
    const sequenceInitRecords = [
      { sequencePrefixKey: 'MEM', currentSequenceNumber: memberships.length },
      { sequencePrefixKey: 'JRN', currentSequenceNumber: journalEntries.length },
      { sequencePrefixKey: 'EVT', currentSequenceNumber: 1 },
      { sequencePrefixKey: 'TKT', currentSequenceNumber: tickets.length },
      { sequencePrefixKey: 'SO', currentSequenceNumber: salesOrders.length },
      { sequencePrefixKey: 'STK', currentSequenceNumber: stockMoves.length },
      { sequencePrefixKey: 'ACT', currentSequenceNumber: tasks.length },
      { sequencePrefixKey: 'EXP', currentSequenceNumber: reimbursements.length },
      { sequencePrefixKey: 'ANN', currentSequenceNumber: seededBroadcasts.length }
    ];

    for (const seq of sequenceInitRecords) {
      await SequenceRegistryModel.create({
        sequencePrefixKey: seq.sequencePrefixKey,
        sequenceYearValue: 2026,
        currentSequenceNumber: seq.currentSequenceNumber,
        paddingDigitsCount: 4
      });
    }

    const totalRecordsCreated =
      3 + createdStudents.length +
      memberships.length +
      journalEntries.length +
      1 + tickets.length +
      2 + salesOrders.length + stockMoves.length +
      tasks.length +
      reimbursements.length +
      seededBroadcasts.length;

    console.log('===============================================================');
    console.log(`✅ [Seed Engine Success]: Seeded ${totalRecordsCreated}+ documents!`);
    console.log('===============================================================');
    console.log('🔑 DEMO CREDENTIALS FOR TESTING CLUBSPHERE:');
    console.log('  1) President / Admin:      president@skyline.edu  |  SkylineClub2026!');
    console.log('  2) Treasurer / Admin:      treasurer@skyline.edu  |  SkylineClub2026!');
    console.log('  3) Operations Lead:        operations@skyline.edu |  SkylineClub2026!');
    console.log('  4) Active Member:          member1@skyline.edu    |  SkylineClub2026!');
    console.log('===============================================================');

    return totalRecordsCreated;
  } catch (seedError) {
    console.error(`[Seed Engine Failure]: ${seedError.message}`, seedError);
    throw seedError;
  } finally {
    await mongoose.disconnect();
    console.log('[Seed Engine]: Disconnected from MongoDB.');
  }
};

if (process.argv[1].endsWith('seedDatabase.js')) {
  runMasterDatabaseSeeding()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

