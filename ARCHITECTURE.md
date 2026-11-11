/**
 * @FILE: ARCHITECTURE.md
 * @RESPONSIBILITY: Master architectural registry mapping every system file to its exact business purpose.
 * @DEPENDENCIES: System-wide modules across client and server tiers.
 * @MODIFICATION_HOTSPOT: Root file mapping table.
 * @AUTHOR: Garima Mittal, Principal Enterprise Solutions Architect
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
