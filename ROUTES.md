/**
 * @FILE: ROUTES.md
 * @RESPONSIBILITY: Master ledger tracking API trigger pathways, controller bindings, and database write impacts.
 * @DEPENDENCIES: Express router definitions across all server modules.
 * @MODIFICATION_HOTSPOT: API endpoint specification matrix.
 * @AUTHOR: Garima Mittal
 */

# 🛣️ ClubSphere: REST API Pathways & Database Impacts

| HTTP Method | Network Pathway | Controller Handler | RBAC Tier | Database Collection Write Impact |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | `registerNewUser` | Public | Inserts new document in `users` collection |
| `POST` | `/api/v1/auth/login` | `authenticateUserSession` | Public | Sets HTTP-Only JWT cookie; updates `lastLoginTimestamp` |
| `POST` | `/api/v1/auth/logout` | `terminateUserSession` | Authenticated | Clears HTTP-Only cookie |
| `GET` | `/api/v1/auth/me` | `fetchAuthenticatedUserProfile`| Authenticated | Read-only projection from `users` collection |
| `GET` | `/api/v1/memberships` | `listAllMemberships` | Operations, Admin| Read query over `memberships` with pagination |
| `GET` | `/api/v1/memberships/my-card`| `fetchUserMemberCard` | Customer, Member | Read query generating verified digital QR token |
| `POST` | `/api/v1/memberships/apply` | `submitMembershipApplication` | Authenticated | Inserts `memberships` (`Draft` state, `ir.sequence`) |
| `POST` | `/api/v1/memberships/:id/pay-dues`| `recordDuesPayment` | Operations, Admin| Transitions `memberships` to `Done`; posts to `journal_entries` |
| `POST` | `/api/v1/memberships/:id/renew` | `renewMembershipRecord` | Operations, Admin| Updates expiration date; inserts renewal `journal_entries` |
| `POST` | `/api/v1/memberships/verify-qr` | `verifyMemberQrToken` | Operations, Admin| Read validation; logs scan in `audit_logs` |
| `GET` | `/api/v1/events` | `listPublishedEvents` | Public | Read query with tier pricing and seat availability |
| `POST` | `/api/v1/events` | `createEventRecord` | Operations, Admin| Inserts `events` (`Draft` state, `ir.sequence`) |
| `PUT` | `/api/v1/events/:id/state` | `transitionEventLifecycle` | Admin | Updates `lifecycleState` (`Draft`➔`Waiting`➔`Ready`➔`Done`) |
| `POST` | `/api/v1/events/:id/tickets/purchase` | `purchaseEventTickets` | Authenticated | Concurrency check; inserts `tickets`; posts to `journal_entries` |
| `POST` | `/api/v1/events/tickets/validate-qr` | `validateTicketQrAdmission` | Operations, Admin| Atomic check-in update; prevents duplicate entry |
| `GET` | `/api/v1/merchandise/products` | `listProductsWithStock` | Public | Aggregates `stock_moves` to return live size inventory |
| `POST` | `/api/v1/merchandise/products` | `createProductRecord` | Admin | Inserts `products` with size variant matrices |
| `POST` | `/api/v1/merchandise/orders` | `submitMerchandiseOrder` | Authenticated | Inserts `sales_orders`; creates reservation `stock_moves` |
| `PUT` | `/api/v1/merchandise/orders/:id/state`| `transitionOrderLifecycle`| Operations, Admin| Updates order state; posts definitive debit/credit journal |
| `GET` | `/api/v1/activities` | `listVolunteerActivities` | Authenticated | Read query for Bake Sale Kanban tasks |
| `POST` | `/api/v1/activities` | `createVolunteerTask` | Operations, Admin| Inserts `activities` task record |
| `PUT` | `/api/v1/activities/:id/stage`| `updateTaskKanbanStage` | Operations, Admin| Updates stage (`Backlog`➔`To Do`➔`In Progress`➔`Review`➔`Done`)|
| `GET` | `/api/v1/accounting/ledger` | `fetchGeneralLedgerReport` | Admin | Aggregation pipeline over `journal_entries` |
| `GET` | `/api/v1/accounting/financial-report`| `generateTreasurerSummary`| Admin | Aggregates income vs expense ledger accounts |
| `POST` | `/api/v1/accounting/reimbursements` | `submitReimbursementClaim`| Authenticated | Inserts `reimbursements` with receipt attachment |
| `PUT` | `/api/v1/accounting/reimbursements/:id/state`| `reviewReimbursementClaim`| Admin | Updates state; on `Done` creates disbursement journal |
| `GET` | `/api/v1/broadcasts` | `listAnnouncements` | Public / Auth | Read query filtered by audience tier |
| `POST` | `/api/v1/broadcasts` | `publishClubAnnouncement` | Operations, Admin| Inserts `broadcasts`; emits real-time WebSocket event |
| `GET` | `/api/v1/diagnostics/logs` | `streamDiagnosticLogs` | Admin | Read query over live in-memory diagnostic buffer |

