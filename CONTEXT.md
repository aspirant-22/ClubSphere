# CONTEXT.md — ClubSphere Architectural & State Quick-Reference

## 1. System Identity & Rules
- **Author**: Garima Mittal | **Scope**: Skyline Student Association ERP System
- **Stack**: React 19 + Vite + Tailwind CSS + Express (ESM) + Mongoose / MongoDB + Socket.IO (transports: websocket, polling)
- **Code Health Rule**: Strict `<25` lines per function rule across client and server tiers.
- **`ir.sequence` Invariant**: Atomic corporate sequence generation via `SequenceRegistryModel` with MongoDB `$inc` (`{PREFIX}/{YEAR}/{0000}`).
- **FSM Invariant**: Enforced lifecycle transitions: `Draft` ➔ `Waiting` ➔ `Ready` ➔ `Done` (or `Cancelled`). No illegal forward or backward jumps.
- **Double-Entry Ledger Invariant**: Immutable journal entries (`journal_entries`). Every entry strictly enforces $\sum \text{Debits} \equiv \sum \text{Credits}$ ($|\sum D - \sum C| < 0.001$). Stock moves (`stock_moves`) enforce source ➔ destination physical double-entry location tracking.

## 2. Database Models & Key Fields
- `UserModel` (`users`): `userAccountFullName`, `emailAddress`, `hashedUserCredential`, `userRoleTier` (`admin`|`operations`|`member`), `memberAffiliationProfileRef`, `lastLoginTimestamp`.
- `SequenceRegistryModel` (`ir_sequences`): `sequencePrefixKey` (`MEM`|`TKT`|`SO`|`EXP`|`JRN`|`ACT`|`ANN`|`EVT`|`STK`), `sequenceYearValue`, `currentSequenceNumber`, `paddingDigitsCount`.
- `MembershipModel` (`memberships`, prefix `MEM`): `membershipCorporateCode` (`MEM/2026/XXXX`), `userProfileRef`, `studentIdNumber`, `tierPlan` (`standard`|`premium`|`alumni`), `duesPaymentStatus` (`unpaid`|`paid`), `lifecycleState` (`Draft`|`Waiting`|`Ready`|`Done`), `qrValidationTokenKey`, `activeDuesExpirationDate`.
- `EventModel` (`events`, prefix `EVT`): `eventCorporateCode`, `eventName`, `totalCapacityLimit`, `bookedSeatCount`, `ticketPricingTiers` (`[{tierName, priceAmount, allocatedCapacity, remainingQuantity}]`), `lifecycleState` (`Draft`|`Waiting`|`Ready`|`Done`|`Cancelled`), `eventStartDateTime`.
- `TicketModel` (`tickets`, prefix `TKT`): `ticketTrackingCode` (`TKT/2026/XXXX`), `eventScheduleRef`, `purchaserUserRef`, `ticketTierDesignation`, `admissionState` (`issued`|`admitted`|`cancelled`), `checkedInAtTimestamp`, `digitalSignatureQrToken`.
- `ProductModel` (`products`): `merchandiseTitle`, `productSkuIdentifier`, `baseSalesPrice`, `productCategoryClass`, `inventoryStockLevels` (`[{variantSizeKey: 'XS'|'S'|'M'|'L'|'XL'|'2XL', availableStockCount}]`), `isActiveForSale`.
- `SalesOrderModel` (`sales_orders`, prefix `SO`): `orderReferenceIdentifier` (`SO/2026/XXXX`), `customerProfileRef`, `orderPurchasedItems` (`[{productCatalogRef, variantSizeKey, purchaseQuantityUnit, unitRetailPrice}]`), `totalOrderMonetaryAmount`, `orderFulfillmentState` (`Draft`|`Waiting`|`Ready`|`Done`|`Cancelled`), `journalEntryReference`.
- `StockMovementModel` (`stock_moves`, prefix `STK`): `stockMovementCode`, `productCatalogRef`, `variantSizeKey`, `sourceStorageLocation` (`Club_Storage_Room`), `destinationLocation` (`Customers`), `movedQuantityUnits`, `movementState` (`reserved`|`done`|`cancelled`).
- `ActivityTaskModel` (`activities`, prefix `ACT`): `taskIdentifierCode` (`ACT/2026/XXXX`), `taskTitleDescription`, `kanbanStageIdentifier` (`backlog`|`todo`|`in_progress`|`review`|`done`), `assignedVolunteerMemberRefs`, `activityBudgetThreshold`, `utilizedBudgetSum`, `taskPriorityLevel`.
- `ReimbursementModel` (`reimbursements`, prefix `EXP`): `claimReferenceSequence` (`EXP/2026/XXXX`), `claimantUserRef`, `expenseCategoryClassification`, `monetaryClaimAmount`, `receiptDocumentUrl`, `adjudicationLifecycleState` (`Draft`|`Waiting`|`Ready`|`Done`|`Cancelled`), `reviewedByTreasurerUserRef`, `journalDisbursementEntryRef`.
- `JournalEntryModel` (`journal_entries`, prefix `JRN`): `journalSequenceIdentifier` (`JRN/2026/XXXX`), `accountingFiscalPeriod`, `sourceTransactionModule` (`MEMBERSHIP`|`EVENT_TICKETING`|`MERCHANDISE_POS`|`TREASURER_EXPENSE`), `transactionNarrativeDescription`, `journalLedgerLines` (`[{generalLedgerAccount, debitMonetaryAmount, creditMonetaryAmount, accountTitle}]`), `postedAtTimestamp`.
- `BroadcastModel` (`broadcasts`, prefix `ANN`): `broadcastReferenceCode` (`ANN/2026/XXXX`), `authorUserAccountRef`, `broadcastSubjectHeading`, `broadcastBodyMarkup`, `broadcastPriorityRank` (`routine`|`urgent`|`critical`), `targetedAudienceTier` (`ALL`|`MEMBER`|`OPERATIONS`|`ADMIN`), `acknowledgedRecipientUserRefs`.

## 3. API & Socket Contract
| Base Route & Pathway | Method | Expected Payload Keys / Query Params |
| :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | `{ fullName, email, password, studentId }` |
| `/api/v1/auth/login` | `POST` | `{ email, password }` |
| `/api/v1/auth/logout` | `POST` | `none` (clears JWT cookie) |
| `/api/v1/auth/me` | `GET` | `none` (hydrates session) |
| `/api/v1/memberships` | `GET` | `?page=&limit=&search=&tier=&status=` |
| `/api/v1/memberships/my-card` | `GET` | `none` |
| `/api/v1/memberships/apply` | `POST` | `{ studentIdNumber, tierPlan }` |
| `/api/v1/memberships/table-signup` | `POST` | `{ fullName, email, studentIdNumber, tierPlan, duesCollectedCash }` |
| `/api/v1/memberships/:id/pay-dues` | `POST` | `{ paymentMethod, cashReceivedAmount }` |
| `/api/v1/memberships/verify-qr` | `POST` | `{ qrValidationTokenKey }` |
| `/api/v1/events` | `GET` / `POST` | GET: `?search=&status=` \| POST: `{ eventName, totalCapacityLimit, ticketPricingTiers, eventStartDateTime }` |
| `/api/v1/events/my-tickets` | `GET` | `none` |
| `/api/v1/events/:id/tickets/purchase` | `POST` | `{ ticketTierDesignation, quantityPurchased }` |
| `/api/v1/events/tickets/validate-qr` | `POST` | `{ digitalSignatureQrToken, doorLocationTag }` |
| `/api/v1/merchandise/products` | `GET` / `POST` | GET: `none` \| POST: `{ merchandiseTitle, productSkuIdentifier, baseSalesPrice, inventoryStockLevels }` |
| `/api/v1/merchandise/orders` | `POST` / `GET` | POST: `{ orderItems: [{ productCatalogRef, variantSizeKey, purchaseQuantityUnit }], fulfillmentType }` |
| `/api/v1/merchandise/orders/:id/state` | `PUT` | `{ targetLifecycleState }` |
| `/api/v1/merchandise/ledger` | `GET` | `?limit=&page=` (stock movements) |
| `/api/v1/activities` | `GET` / `POST` | GET: `none` \| POST: `{ taskTitleDescription, assignedVolunteerMemberRefs, activityBudgetThreshold }` |
| `/api/v1/activities/kanban` | `GET` | `none` (grouped by stages) |
| `/api/v1/activities/:id/stage` | `PUT` | `{ targetKanbanStageIdentifier }` |
| `/api/v1/accounting/ledger` | `GET` | `?fiscalPeriod=&accountCode=` (general ledger with debit/credit parity) |
| `/api/v1/accounting/financial-report` | `GET` | `?fiscalYear=` (P&L: Gross Dues + Gala + Merch vs Expenses) |
| `/api/v1/accounting/reimbursements` | `GET` / `POST` | GET: `none` \| POST: `{ expenseCategoryClassification, monetaryClaimAmount, receiptDocumentUrl }` |
| `/api/v1/accounting/reimbursements/:id/state` | `PUT` | `{ targetLifecycleState, disbursementAccountCode }` |
| `/api/v1/broadcasts` | `GET` / `POST` | GET: `?audienceTier=` \| POST: `{ broadcastSubjectHeading, broadcastBodyMarkup, broadcastPriorityRank, targetedAudienceTier }` |
| `/api/v1/broadcasts/:id/read` | `POST` | `none` |
| `/api/v1/diagnostics/health` | `GET` | `none` (`{ systemStatus, serverNodeTimestamp, organizationScope }`) |
| `/api/v1/diagnostics/logs` | `GET` | `none` (Admin memory & ring-buffer stream) |
- **Socket.IO Event Contract**:
  - Outgoing Client ➔ Server: `subscribe_channel` (`channelName`).
  - Incoming Server ➔ Client: `BROADCAST_PUBLISHED` (`{ broadcastCode, title, message, priority, audienceTier, timestamp }`).

## 4. Frontend State & Routing Map
- **Active React Context Providers**:
  - `AuthenticationContext` (`useAuthentication`): Session hydration (`/api/v1/auth/me`), `currentUser`, `isAuthenticated`, `isAuthResolving`, `loginUserWithCredentials`, `logoutUserSession`.
  - `SystemProcessingContext` (`useSystemProcessing`): Global execution overlay, `runWithProcessingLock` (prevents double-clicks & race conditions).
  - `SocketNotificationContext` (`useSocketNotifications`): Socket.IO connection manager, `socketClient`, `liveNotifications`, `connectionStatus`.
  - `NavigationPaletteContext` (`useNavigationPalette`): `Ctrl+K` / `Cmd+K` command palette modal, `isPaletteVisible`, `paletteQuery`.
- **Global Custom Hooks**: `useAuthentication()`, `useSystemProcessing()`, `useSocketNotifications()`, `useNavigationPalette()`.
- **Exact `AppRouter.jsx` Route Paths**:
  - Public: `/login` (`LoginView`), `/` (`RootRedirect` ➔ `/memberships` or `/login`).
  - Protected (All Roles): `/memberships` (`MembershipListView`), `/events` (`EventListView`), `/merchandise` (`MerchandiseCatalogView`), `/activities` (`VolunteerKanbanView`), `/accounting/reimbursements` (`ReimbursementsListView`), `/broadcasts` (`BroadcastsView`).
  - Protected (`admin`, `operations`): `/events/scanner` (`DoorScannerView`), `/merchandise/stock-ledger` & `/merchandise/ledger` (`StockLedgerView`), `/accounting/report` & `/accounting/reports` (`FinancialReportView`).
  - Protected (`admin` only): `/accounting/ledger` (`GeneralLedgerView`), `/admin/system-logs` (`SystemLogsView`).
- **Demo Personas & Credentials**:
  - Club President (Admin): `president@skyline.edu` / `AdminPass123!` (or 1-click persona switch)
  - Club Treasurer (Admin): `treasurer@skyline.edu` / `TreasurerPass123!`
  - Operations Lead (Operations): `operations@skyline.edu` / `OpsPass123!`
  - Active Member (Customer / Member): `member1@skyline.edu` / `MemberPass123!`

## 5. Context Lookup Protocol
> **Protocol Rule**: Read ONLY `CONTEXT.md` first for architectural context. Never scan full directories or `docs/` unless debugging a specific file.
