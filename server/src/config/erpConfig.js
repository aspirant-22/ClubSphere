/**
 * @FILE: erpConfig.js
 * @RESPONSIBILITY: Central config-driven business logic parameters and operational thresholds for Skyline Association.
 * @DEPENDENCIES: None (Pure configuration manifest).
 * @MODIFICATION_HOTSPOT: ERP_SYSTEM_PARAMETERS object.
 * @AUTHOR: Garima Mittal, Principal Enterprise Solutions Architect
 */

export const ERP_SYSTEM_PARAMETERS = {
  TAX_RATE_PERCENTAGE: 18.00,
  MAX_BATCH_PROCESSING_LIMIT: 100,
  DEFAULT_CURRENCY: 'INR',
  ALLOW_NEGATIVE_INVENTORY: false,
  MEMBERSHIP_VALIDITY_DAYS: 365,
  MEMBERSHIP_EXPIRATION_WARNING_DAYS: 30,
  SPRING_GALA_MAX_CAPACITY: 250,
  EARLY_BIRD_SEAT_LIMIT: 50,
  PROVISIONAL_BOOKING_HOLD_MINUTES: 10,
  DEFAULT_PETTY_CASH_FLOAT: 5000.00,
  MAX_REIMBURSEMENT_CLAIM_AUTO_APPROVE_LIMIT: 0.00, // All reimbursements require treasurer review
  DIAGNOSTIC_LOG_BUFFER_CAPACITY: 500,
  CHART_OF_ACCOUNTS: {
    BANK_CAMPUS_ACCOUNT: '1010 Bank:Campus_Account',
    PETTY_CASH_FLOAT: '1020 Cash:Petty_Cash_Float',
    MERCHANDISE_INVENTORY: '1030 Inventory:Merchandise_Stock',
    ACCOUNTS_PAYABLE_REIMBURSEMENTS: '2010 Accounts_Payable:Volunteer_Reimbursements',
    RETAINED_CLUB_SURPLUS: '3010 Retained_Club_Surplus',
    INCOME_MEMBERSHIP_DUES: '4010 Income:Membership_Dues',
    INCOME_TICKET_SALES: '4020 Income:Ticket_Sales',
    INCOME_MERCHANDISE_SALES: '4030 Income:Merchandise_Sales',
    INCOME_FUNDRAISER_DONATIONS: '4040 Income:Fundraiser_Donations',
    EXPENSE_EVENT_OPERATIONS: '5010 Expense:Event_Operations',
    EXPENSE_MERCHANDISE_COGS: '5020 Expense:Merchandise_COGS',
    EXPENSE_SUPPLIES_LOGISTICS: '5030 Expense:Supplies_Logistics',
    EXPENSE_ADMINISTRATIVE: '5040 Expense:Administrative'
  },
  STOCK_LOCATIONS: {
    SUPPLIERS: 'Location:Suppliers',
    STORAGE_ROOM: 'Location:Club_Storage_Room',
    CAMPUS_TABLE: 'Location:Campus_Table_Stall',
    CUSTOMERS: 'Location:Customers',
    SCRAP: 'Location:Inventory_Loss_Scrap'
  }
};
