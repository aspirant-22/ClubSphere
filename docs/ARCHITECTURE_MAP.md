# 🗺️ ClubSphere: Architectural Directory Map & API Specifications
## Target Organization: Skyline Student Association
**Document Status:** LOCKED BASELINE  
**Author:** Garima Mittal  

---

### 1. Master Codebase Directory Layout

```text
ClubSphere/
├── ARCHITECTURE.md                  # Single-sentence structural log mapping every file
├── ROUTES.md                        # Master API trigger pathways & controller ledger
├── STATE.md                         # Context state inventory & component hooks ledger
├── ENVIRONMENT.md                   # Environment variables & runbook specifications
├── MODIFICATIONS.md                 # Maintenance modification runbook & release notes
├── docs/
│   ├── PRODUCT_SPEC.md              # Functional requirements for Skyline Association
│   ├── ARCHITECTURE_MAP.md          # Folder tree layout & complete REST API inventory
│   └── ENGINEERING_AUDIT.md         # Zod schemas, ledger formulas & error matrices
│
├── server/                          # Production Express, Mongoose, Socket.IO Backend
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── config/
│   │   │   ├── databaseConnection.js       # Resilient MongoDB connection pooling
│   │   │   └── erpConfig.js                # ERP_SYSTEM_PARAMETERS business rules
│   │   ├── core/
│   │   │   ├── sequenceRegistry.js         # ir.sequence atomic sequential code generator
│   │   │   ├── finiteStateMachine.js       # Lifecycle state transition & lock engine
│   │   │   ├── doubleEntryLedger.js        # Immutable debit/credit aggregation ledger
│   │   │   ├── stockLedger.js              # Double-entry physical inventory engine
│   │   │   └── socketServer.js             # Real-time WebSocket event dispatcher
│   │   ├── middleware/
│   │   │   ├── authenticationGate.js       # HTTP-Only JWT session verifier
│   │   │   ├── rbacAuthorization.js        # 4-tier Role-Based Access Control gate
│   │   │   ├── schemaValidator.js          # Zod schema network interception gate
│   │   │   ├── errorHandler.js             # Standardized enterprise error transformer
│   │   │   └── auditLogger.js              # Transaction logging & diagnostic capture
│   │   ├── modules/
│   │   │   ├── auth/                       # User credentials, JWT cookies, profile
│   │   │   │   ├── auth.model.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── auth.validation.js
│   │   │   │   └── auth.routes.js
│   │   │   ├── memberships/                # Membership tiers, dues, QR card registry
│   │   │   │   ├── membership.model.js
│   │   │   │   ├── membership.controller.js
│   │   │   │   ├── membership.service.js
│   │   │   │   ├── membership.validation.js
│   │   │   │   └── membership.routes.js
│   │   │   ├── events/                     # Events, tickets, seat limits, QR gate scanner
│   │   │   │   ├── event.model.js
│   │   │   │   ├── ticket.model.js
│   │   │   │   ├── event.controller.js
│   │   │   │   ├── event.service.js
│   │   │   │   ├── event.validation.js
│   │   │   │   └── event.routes.js
│   │   │   ├── merchandise/                # Hoodies, size variant arrays, stock orders
│   │   │   │   ├── product.model.js
│   │   │   │   ├── salesOrder.model.js
│   │   │   │   ├── merchandise.controller.js
│   │   │   │   ├── merchandise.service.js
│   │   │   │   ├── merchandise.validation.js
│   │   │   │   └── merchandise.routes.js
│   │   │   ├── activities/                 # Bake sale fundraiser task Kanban
│   │   │   │   ├── activity.model.js
│   │   │   │   ├── activity.controller.js
│   │   │   │   ├── activity.service.js
│   │   │   │   ├── activity.validation.js
│   │   │   │   └── activity.routes.js
│   │   │   ├── accounting/                 # General ledger, receipts, reimbursements
│   │   │   │   ├── journalEntry.model.js
│   │   │   │   ├── reimbursement.model.js
│   │   │   │   ├── accounting.controller.js
│   │   │   │   ├── accounting.service.js
│   │   │   │   ├── accounting.validation.js
│   │   │   │   └── accounting.routes.js
│   │   │   ├── broadcasts/                 # Centralized club bulletins & read logs
│   │   │   │   ├── broadcast.model.js
│   │   │   │   ├── broadcast.controller.js
│   │   │   │   ├── broadcast.service.js
│   │   │   │   ├── broadcast.validation.js
│   │   │   │   └── broadcast.routes.js
│   │   │   └── diagnostics/                # Live streaming /admin/system-logs
│   │   │       ├── diagnostic.controller.js
│   │   │       └── diagnostic.routes.js
│   │   ├── seed/
│   │   │   └── seedDatabase.js             # 200+ historical records mock seed script
│   │   └── server.js                       # Primary gateway with Helmet, CORS, Rate-Limiter
│   └── tests/
│
└── client/                                 # Enterprise React 19 + Vite Frontend
    ├── package.json
    ├── tailwind.config.js                  # Layout-first dynamic design system
    ├── vite.config.js
    └── src/
        ├── assets/
        │   └── theme.css                   # Tailwind @apply utility buttons and card directives
        ├── context/
        │   ├── AuthenticationContext.jsx   # Current session, role tier, credentials
        │   ├── SystemProcessingContext.jsx # Global isSystemProcessing blur spinner overlay
        │   ├── SocketNotificationContext.jsx# Live Socket.IO incoming event broadcaster
        │   └── NavigationPaletteContext.jsx# Ctrl+K global navigation listener & router
        ├── components/
        │   ├── common/
        │   │   ├── ControlPanelHeader.jsx  # Pinned breadcrumb navigation & action buttons
        │   │   ├── ProgressWorkflowRibbon.jsx# Visual Draft->Waiting->Ready->Done state bar
        │   │   ├── CommandPaletteModal.jsx # Ctrl+K keyboard navigation palette modal
        │   │   ├── ProcessingOverlay.jsx   # Global unclickable backdrop during async work
        │   │   └── OfflineAlertBanner.jsx  # Cloud node timeout / 500 error top alert
        ├── layouts/
        │   ├── EnterpriseAppLayout.jsx     # Dense multi-column Odoo workspace layout
        │   └── PublicPortalLayout.jsx      # Clean public-facing student portal layout
        ├── modules/
        │   ├── auth/                       # Login, Register, Profile Views
        │   ├── memberships/                # Member List, Detail Card, QR Badge View
        │   ├── events/                     # Event Matrix, Spring Gala Ticket POS, Scanner
        │   ├── merchandise/                # Hoodie SKU Catalog, Size Select, Orders List
        │   ├── activities/                 # Bake Sale Drag-and-Drop / State Kanban Board
        │   ├── accounting/                 # Double-Entry Ledger, Reimbursement Approval, P&L
        │   ├── broadcasts/                 # Club Bulletin Board & Publisher
        │   └── diagnostics/                # Monospace Live Console Stream View
        ├── services/
        │   ├── apiNetworkClient.js         # Axios client with timeout and error interceptors
        │   └── socketClient.js             # Socket.IO client connection
        ├── routes/
        │   └── AppRouter.jsx               # Protected route switches with RBAC gates
        ├── App.jsx
        └── main.jsx
```

---

### 2. Comprehensive REST API Specifications

#### 2.1 Authentication & Profile (`/api/v1/auth`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new student account with public default role |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user, return HTTP-Only JWT cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clear HTTP-Only session cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetch active user session with roles and profile |

#### 2.2 Membership & CRM (`/api/v1/memberships`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/memberships` | Operations, Admin | Fetch all membership records with filters & search |
| `GET` | `/api/v1/memberships/my-card` | Customer, Member | Fetch current user's digital membership card & QR payload |
| `POST` | `/api/v1/memberships/apply` | Authenticated | Submit new membership application (`Draft` state) |
| `POST` | `/api/v1/memberships/:membershipId/pay-dues`| Operations, Admin | Record dues payment, move to `Done`, credit ledger |
| `POST` | `/api/v1/memberships/:membershipId/renew` | Operations, Admin | Extend expiration date by 365 days, generate renewal record |
| `POST` | `/api/v1/memberships/verify-qr` | Operations, Admin | Scan QR token and return active verification badge |

#### 2.3 Events & Ticketing (`/api/v1/events`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events` | Public | List all published upcoming events with tier pricing |
| `GET` | `/api/v1/events/:eventId` | Public | Get detailed event info, remaining seat counts, tiers |
| `POST` | `/api/v1/events` | Operations, Admin | Create new event record with capacity and tier definitions |
| `PUT` | `/api/v1/events/:eventId/state` | Admin | Advance event lifecycle (`Draft` ➔ `Waiting` ➔ `Ready` ➔ `Done`) |
| `POST` | `/api/v1/events/:eventId/tickets/purchase` | Authenticated | Buy tickets (member discount validated against active dues) |
| `POST` | `/api/v1/events/tickets/validate-qr` | Operations, Admin | Gate scanner endpoint: validates ticket QR code and prevents duplicate entries |
| `GET` | `/api/v1/events/:eventId/reconciliation` | Operations, Admin | Post-event audit: total tickets sold, attended, revenue |

#### 2.4 Merchandise & Inventory POS (`/api/v1/merchandise`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/merchandise/products` | Public | List apparel & merchandise with size matrices and stock levels |
| `POST` | `/api/v1/merchandise/products` | Admin | Create product SKU with sizes `['XS','S','M','L','XL','2XL']` |
| `POST` | `/api/v1/merchandise/orders` | Authenticated | Submit merchandise sales order (`Draft` state) |
| `PUT` | `/api/v1/merchandise/orders/:orderId/state` | Operations, Admin | Advance order lifecycle (`Draft` ➔ `Waiting` ➔ `Ready` ➔ `Done`) |
| `GET` | `/api/v1/merchandise/orders/my-orders` | Authenticated | View current user's past and active merchandise orders |
| `GET` | `/api/v1/merchandise/stock-ledger` | Admin | View immutable double-entry stock movement journal |

#### 2.5 Fundraiser Volunteer Activities (`/api/v1/activities`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/activities` | Authenticated | List all volunteer projects & tasks (e.g. Bake Sale) |
| `POST` | `/api/v1/activities` | Operations, Admin | Create new volunteer task or project |
| `PUT` | `/api/v1/activities/:activityId/stage` | Operations, Admin | Transition Kanban stage (`Backlog` ➔ `To Do` ➔ `In Progress` ➔ `Review` ➔ `Completed`) |
| `PUT` | `/api/v1/activities/:activityId/assign` | Operations, Admin | Reassign task volunteer lead or update due date |

#### 2.6 Accounting & Reimbursements (`/api/v1/accounting`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/accounting/ledger` | Admin | Fetch double-entry general ledger entries & account balances |
| `GET` | `/api/v1/accounting/financial-report` | Admin | Generate Treasurer P&L report, revenue vs expenses summary |
| `GET` | `/api/v1/accounting/reimbursements` | Operations, Admin | List all volunteer reimbursement claims |
| `POST` | `/api/v1/accounting/reimbursements` | Authenticated | Submit volunteer reimbursement claim with receipt URL |
| `PUT` | `/api/v1/accounting/reimbursements/:id/state`| Admin | Advance claim state (`Draft` ➔ `Waiting` ➔ `Ready` ➔ `Done` ➔ `Cancelled`) |

#### 2.7 Broadcasts & Bulletins (`/api/v1/broadcasts`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/broadcasts` | Public / Auth | List official club bulletins scoped to user's permissions |
| `POST` | `/api/v1/broadcasts` | Operations, Admin | Publish new announcement with target audience tag |
| `POST` | `/api/v1/broadcasts/:broadcastId/ack` | Authenticated | Record read-receipt audit log for the current user |

#### 2.8 Live Infrastructure Diagnostics (`/api/v1/diagnostics`)
| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/diagnostics/logs` | Admin | Stream structured backend console diagnostic logs in real-time |
| `GET` | `/api/v1/diagnostics/health` | Public | System status check returning database latency and socket state |

