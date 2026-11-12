/**
 * @FILE: ARCHITECTURE.md
 * @RESPONSIBILITY: Master architectural registry mapping every system file to its exact business purpose.
 * @DEPENDENCIES: System-wide modules across client and server tiers.
 * @MODIFICATION_HOTSPOT: Root file mapping table.
 * @AUTHOR: Garima Mittal
 */

# 🏛️ ClubSphere: Architectural Directory Registry

| File Path | Functional Responsibility |
| :--- | :--- |
| `ARCHITECTURE.md` | Single-sentence structural log mapping exactly what each file handles across the entire codebase. |
| `ROUTES.md` | Comprehensive ledger tracking API trigger pathways, controllers, and database impacts. |
| `STATE.md` | Inventory ledger mapping React context states, component hooks, and global data pipelines. |
| `ENVIRONMENT.md` | Environment configuration dictionary, port assignments, and local runbook specifications. |
| `MODIFICATIONS.md` | Chronological maintenance modification runbook and system change logs. |
| `docs/PRODUCT_SPEC.md` | Functional domain requirements for Skyline Student Association (Members, Gala, Merch, Bake Sale, Treasurer). |
| `docs/ARCHITECTURE_MAP.md` | Folder layout blueprints and master REST API endpoint dictionary. |
| `docs/ENGINEERING_AUDIT.md` | Strict Zod validation schemas, double-entry mathematical ledger rules, and error handling matrix. |
| `server/package.json` | Node.js ECMAScript Modules manifest, scripts, and production dependencies. |
| `server/src/config/erpConfig.js` | Config-driven ERP business rules and thresholds (ERP_SYSTEM_PARAMETERS) for Skyline Association. |
| `server/src/config/databaseConnection.js` | Resilient Mongoose MongoDB connection pooling with auto-reconnect and error interception. |
| `server/src/core/sequenceRegistry.js` | Atomic sequential corporate code generator (`ir.sequence`) using MongoDB atomic `$inc`. |
| `server/src/core/finiteStateMachine.js` | Finite State Machine enforcement engine (`Draft` ➔ `Waiting` ➔ `Ready` ➔ `Done` ➔ `Cancelled`). |
| `server/src/core/doubleEntryLedger.js` | Immutable double-entry financial journal entry and aggregation calculation engine. |
| `server/src/core/stockLedger.js` | Double-entry physical inventory location transfer engine. |
| `server/src/core/socketServer.js` | Socket.IO server initialization and real-time event broadcasting bridge. |
| `server/src/middleware/authenticationGate.js` | HTTP-Only JWT session authentication middleware. |
| `server/src/middleware/rbacAuthorization.js` | 4-tier Role-Based Access Control gate (Admin, Operations, Customer, Public). |
| `server/src/middleware/schemaValidator.js` | Zod validation interceptor rejecting malformed payloads at the network boundary. |
| `server/src/middleware/errorHandler.js` | Standardized enterprise error transformer mapping errors to structured JSON responses. |
| `server/src/middleware/auditLogger.js` | Enterprise audit trail logger appending actor and execution metrics to diagnostic buffers. |
| `server/src/server.js` | Central Express application gateway with Helmet, CORS, Rate-Limiter, and HTTP server bootstrap. |
| `server/src/modules/auth/auth.model.js` | Mongoose User schema with bcrypt password hashing and 4-tier role enumeration. |
| `server/src/modules/auth/auth.validation.js` | Zod validation schemas for registration and login payloads. |
| `server/src/modules/auth/auth.service.js` | Authentication service: JWT issuance, credential verification, and session management. |
| `server/src/modules/auth/auth.controller.js` | HTTP controllers for login, registration, /me session hydration, and logout. |
| `server/src/modules/auth/auth.routes.js` | Express router mounting all authentication endpoints. |
| `server/src/modules/memberships/membership.model.js` | Mongoose schema: MEM/2026/XXXX sequence, QR token payloads, tier, and dues status. |
| `server/src/modules/memberships/membership.validation.js` | Zod schemas for member registration and dues update payloads. |
| `server/src/modules/memberships/membership.service.js` | Membership business logic: QR code generation, dues recording, member lookup. |
| `server/src/modules/memberships/membership.controller.js` | HTTP controllers for CRUD and QR scan operations. |
| `server/src/modules/memberships/membership.routes.js` | Express router for membership domain endpoints. |
| `server/src/modules/events/event.model.js` | Mongoose schema for club events with capacity, pricing tiers, and FSM state. |
| `server/src/modules/events/ticket.model.js` | Mongoose schema for Spring Gala tickets with TKT/2026/XXXX sequence and scan status. |
| `server/src/modules/events/event.validation.js` | Zod schemas for event creation and ticket purchase payloads. |
| `server/src/modules/events/event.service.js` | Event business logic: seat reservation, ticket issuance, door scan verification. |
| `server/src/modules/events/event.controller.js` | HTTP controllers for event and ticketing CRUD operations. |
| `server/src/modules/events/event.routes.js` | Express router for events and ticketing endpoints. |
| `server/src/modules/merchandise/merchandise.model.js` | Mongoose schema for apparel products with size matrix stock levels. |
| `server/src/modules/merchandise/merchandise.validation.js` | Zod schemas for product creation and sales order payloads. |
| `server/src/modules/merchandise/merchandise.service.js` | Merchandise POS logic: SO/2026/XXXX sequence, size stock deduction, double-entry stock transfer. |
| `server/src/modules/merchandise/merchandise.controller.js` | HTTP controllers for catalog, checkout, and stock ledger endpoints. |
| `server/src/modules/merchandise/merchandise.routes.js` | Express router for merchandise and stock ledger endpoints. |
| `server/src/modules/activities/activity.model.js` | Mongoose schema for Bake Sale Kanban tasks with 5-stage FSM and budget allocation. |
| `server/src/modules/activities/activity.validation.js` | Zod schemas for task creation and stage-advance payloads. |
| `server/src/modules/activities/activity.service.js` | Kanban business logic: stage transitions, budget utilization tracking. |
| `server/src/modules/activities/activity.controller.js` | HTTP controllers for Kanban CRUD and stage advancement operations. |
| `server/src/modules/activities/activity.routes.js` | Express router for activities/Kanban endpoints. |
| `server/src/modules/accounting/journalEntry.model.js` | Re-export of Mongoose JournalEntryModel from doubleEntryLedger for modular schema imports. |
| `server/src/modules/accounting/accounting.model.js` | Mongoose schemas for general ledger journal entries and expense reimbursement claims. |
| `server/src/modules/accounting/accounting.validation.js` | Zod schemas for ledger posting and reimbursement submission payloads. |
| `server/src/modules/accounting/accounting.service.js` | Treasury business logic: double-entry journal posting, debit/credit parity verification, claim sign-off. |
| `server/src/modules/accounting/accounting.controller.js` | HTTP controllers for ledger, reimbursements, and P&L report endpoints. |
| `server/src/modules/accounting/accounting.routes.js` | Express router for accounting and treasury endpoints. |
| `server/src/modules/broadcasts/broadcast.model.js` | Mongoose schema for club broadcast announcements with audience tier targeting. |
| `server/src/modules/broadcasts/broadcast.validation.js` | Zod schemas for broadcast composition payloads. |
| `server/src/modules/broadcasts/broadcast.service.js` | Broadcast logic: message persistence and real-time Socket.IO emission to audience tiers. |
| `server/src/modules/broadcasts/broadcast.controller.js` | HTTP controllers for broadcast CRUD and read-receipt endpoints. |
| `server/src/modules/broadcasts/broadcast.routes.js` | Express router for broadcasts domain endpoints. |
| `server/src/modules/diagnostics/diagnostic.controller.js` | HTTP controllers for system telemetry, memory usage, and ring-buffer log streaming. |
| `server/src/modules/diagnostics/diagnostic.routes.js` | Express router exposing /health, /logs, and /ping system telemetry endpoints. |
| `server/src/seed/seedDatabase.js` | Standalone idempotent seeder populating 200+ realistic historical records across all ClubSphere domains. |
| `server/.env.example` | Template environment configuration specifying default ports, MongoDB connection string, and session secrets. |
| `client/package.json` | React 19 frontend manifest: Vite, Tailwind, Axios, Socket.IO-client, React Router DOM, Lucide React. |
| `client/vite.config.js` | Vite dev server configured with /api and /socket.io proxy to localhost:5000 backend. |
| `client/tailwind.config.js` | Custom Tailwind palette: Odoo plum primary (#714B67), teal accent (#00A09D), slate surfaces. |
| `client/postcss.config.js` | PostCSS pipeline enabling Tailwind CSS and Autoprefixer for the Vite build. |
| `client/index.html` | Vite HTML entry point with ClubSphere page title and #root mount target. |
| `client/src/main.jsx` | React 19 DOM entry-point mounting App under StrictMode with global theme stylesheet. |
| `client/src/App.jsx` | Root component composing BrowserRouter → AuthenticationProvider → SystemProcessingProvider → NavigationPaletteProvider → AppRouter. |
| `client/src/routes/AppRouter.jsx` | Complete RBAC-protected routing matrix binding all ClubSphere subdomains via ProtectedRoute guards. |
| `client/src/assets/theme.css` | Centralized Tailwind @apply utility directives for enterprise cards, status badges, and action buttons. |
| `client/src/services/apiNetworkClient.js` | Axios singleton with /api/v1 base URL, credential cookies, and global 401 redirect interceptor. |
| `client/src/services/socketClient.js` | Socket.IO client singleton factory and event connection manager. |
| `client/src/context/AuthenticationContext.jsx` | Session hydration via /me, login/logout handlers, and 4-tier role helpers. |
| `client/src/context/SystemProcessingContext.jsx` | Global execution overlay preventing double-click race conditions during async operations. |
| `client/src/context/SocketNotificationContext.jsx` | React Context managing real-time Socket.IO broadcasts and alert subscriptions. |
| `client/src/context/NavigationPaletteContext.jsx` | Ctrl+K command palette context managing query state and keyboard shortcut interception. |
| `client/src/components/common/ControlPanelHeader.jsx` | Pinned header bar with module breadcrumbs left and context action triggers right. |
| `client/src/components/common/ProgressWorkflowRibbon.jsx` | Odoo top-right state pipeline indicator: Draft → Waiting → Ready → Done. |
| `client/src/components/common/ProcessingOverlay.jsx` | Unclickable backdrop spinner blocking rapid double-clicks and race conditions during async operations. |
| `client/src/components/common/OfflineAlertBanner.jsx` | Dynamic top alert banner triggered on server timeout or network latency spikes. |
| `client/src/components/common/CommandPaletteModal.jsx` | Ctrl+K modal for instant keyboard-driven navigation across all club subdomains. |
| `client/src/components/common/Navbar.jsx` | Top workspace status bar: active persona badge, quick shortcuts, and logout trigger. |
| `client/src/layouts/EnterpriseAppLayout.jsx` | Multi-column master layout with slate sidebar app-rail and scrollable main viewport. |
| `client/src/layouts/PublicPortalLayout.jsx` | Clean, distraction-free layout for unauthenticated and student public portal routes. |
| `client/src/modules/auth/LoginView.jsx` | Enterprise sign-in with 1-click Demo Persona Switcher for President, Treasurer, Operations, and Member. |
| `client/src/modules/memberships/MembershipListView.jsx` | Dense Odoo member directory with tier badges, dues filters, and QR inspection triggers. |
| `client/src/modules/memberships/MemberCardModal.jsx` | Digital student ID card displaying MEM/2026/XXXX code and scannable QR badge. |
| `client/src/modules/memberships/TableSignupModal.jsx` | Campus table onboarding modal with cash dues collection toggle and auto ledger post. |
| `client/src/modules/events/EventListView.jsx` | Odoo event dashboard cards with live seat quotas, date badges, and pricing matrices. |
| `client/src/modules/events/TicketPurchaseModal.jsx` | Spring Gala checkout applying member discounts and locking capacity slots. |
| `client/src/modules/events/DoorScannerView.jsx` | High-velocity door scanner terminal: TKT/2026/XXXX input, audio/visual feedback, duplicate rejection. |
| `client/src/modules/merchandise/MerchandiseCatalogView.jsx` | Apparel catalog grid with interactive size matrix selectors and real-time stock badges. |
| `client/src/modules/merchandise/SalesOrderCheckoutModal.jsx` | POS checkout modal generating SO/2026/XXXX receipts with pickup/delivery options. |
| `client/src/modules/merchandise/StockLedgerView.jsx` | Immutable double-entry inventory audit table: Club_Storage_Room → Customers transfers. |
| `client/src/modules/activities/VolunteerKanbanView.jsx` | 5-column Kanban board with category pills, budget utilization headers, and stage-advance controls. |
| `client/src/modules/activities/TaskCreationModal.jsx` | Task creation modal with volunteer assignee, budget cap, and category tag fields. |
| `client/src/modules/accounting/GeneralLedgerView.jsx` | Double-entry journal audit table with JRN/2026/XXXX badges and live debit/credit parity. |
| `client/src/modules/accounting/ReimbursementsListView.jsx` | Expense claim queue with receipt preview, submission form, and Treasurer sign-off buttons. |
| `client/src/modules/accounting/FinancialReportView.jsx` | End-of-semester P&L: Gross Dues + Gala + Merch vs Event + Supply + Admin = Net Surplus. |
| `client/src/modules/broadcasts/BroadcastsView.jsx` | Club announcements feed with audience filters, read-receipt toggles, and Socket.IO live alerts. |
| `client/src/modules/diagnostics/SystemLogsView.jsx` | Admin-only monospace terminal HUD: live backend logs, Node.js memory, and MongoDB health. |

