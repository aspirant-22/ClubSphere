# 📘 ClubSphere: Product Specification Document
## Target Organization: Skyline Student Association
**Document Status:** LOCKED BASELINE  
**Author:** Garima Mittal 
**Architecture Paradigm:** Odoo ERP-Inspired Modular Web Platform (MERN)

---

### 1. Executive Summary & Core Campus Problem
The Skyline Student Association manages a rapidly growing campus community of students, student volunteers, and elected executive officers. Today, club operations rely on disconnected, error-prone manual tools:
- Member signups: unlinked spreadsheets without dues validation or expiration tracking.
- Event tickets: door cash collection leading to accounting discrepancies, long queues, and zero capacity control.
- Club finances: hand-recorded notebooks, lost receipts, and contentious volunteer reimbursement delays.
- Communications: scattered WhatsApp groups causing announcement fatigue and message drop-off.
- Merchandise: manual paper tallies causing stock-outs, wrong sizes, and uncollected money.
- Volunteer tasks: informal chats resulting in duplicated effort and forgotten responsibilities during fundraisers.

**ClubSphere** replaces these ad-hoc tools with an enterprise-grade, integrated Odoo ERP-style application platform featuring an immutable double-entry ledger, atomic sequence generation (`ir.sequence`), multi-role access control, and real-time dashboard synchronizations.

---

### 2. User Personas & 4-Tier RBAC Architecture

| Role Tier | Target User | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Admin / Executive Board** | Club President, Treasurer, VP of Operations | Full system governance, general ledger approvals, expense reimbursement sign-off, sequence configuration, membership pricing management, full audit trail visibility. |
| **Operations Staff / Officers** | Event Leads, Merchandise Coordinators, Volunteer Managers | Ticket scanning & gate validation, inventory stock movements, fundraiser task management, official announcement broadcasting, membership verification at tables. |
| **Active Member / Student Customer** | Registered Students (Paid Dues) | View digital member ID cards, access discounted Spring Gala tickets, purchase branded hoodies/t-shirts, submit volunteer expense reimbursement claims with receipts, view announcements. |
| **Public Visitor / Guest** | Prospective Students, Campus Community | Browse public club landing page, read public announcements, apply for new club membership, purchase standard-tier event tickets. |

---

### 3. Deep-Dive Functional Modules

#### 3.1 Membership & CRM Module (`/memberships`)
*Real-World Scene: Table Sign-up on Campus & Renewal Reminders*
- **Membership Lifecycle:** `Draft` (Student submits application) ➔ `Waiting` (Payment verification pending) ➔ `Ready` (Payment recorded) ➔ `Done` (Member card generated & active) ➔ `Cancelled` / `Expired`.
- **Member Tier Registry:**
  - *Standard Annual Membership:* ₹500/year (or campus currency equivalent).
  - *Lifetime Member:* ₹1,500 one-time.
  - *Alumni Supporter:* ₹1,000/year.
- **Dues Verification & Receipting:** Automatic generation of sequence `MEM/2026/XXXX` and double-entry ledger debit to `Bank:Campus_Account` and credit to `Income:Membership_Dues`.
- **Digital Membership Card & QR Verification:**
  - Dynamic QR code embedding encrypted signature `{"memberSequence": "MEM/2026/0042", "checksum": "..."}`.
  - Door staff can scan the card via mobile device or camera to return immediate badge status: `ACTIVE`, `LAPSED`, or `NOT_FOUND`.
- **Automated Renewal & Expiration Engine:** 
  - Tracks `membershipStartDate` and `membershipEndDate` (defaults to 365 days).
  - Automated status triggers: `ACTIVE` (days remaining > 30), `EXPIRING_SOON` (<= 30 days remaining), and `EXPIRED` (past end date).
  - One-click renewal action endpoint generating sequential renewal invoice `INV/2026/XXXX`.

#### 3.2 Events & Ticketing Module (`/events`)
*Real-World Scene: The Annual Spring Gala & Rapid Gate Check-In*
- **Event Lifecycle:** `Draft` ➔ `Waiting` (Venue/Permits pending) ➔ `Ready` (Tickets on sale) ➔ `Done` (Event concluded & reconciled) ➔ `Cancelled`.
- **Multi-Tier Ticket Pricing Engine (Spring Gala Specifics):**
  - *VIP Member Pass:* ₹350 (Includes front-row seating & dinner; requires validated active membership).
  - *General Admission Member:* ₹150 (Discounted tier auto-verified against active member record).
  - *Non-Member / Public Guest:* ₹300 (Standard full price).
  - *Early Bird General:* ₹100 (Capped at first 50 tickets).
- **Seat & Capacity Quota Enforcement:**
  - Atomic inventory decrement lock preventing overbooking when tickets hit maximum venue capacity (e.g., 250 max seats).
  - Concurrency booking lock holding provisional tickets for 10 minutes during checkout.
- **High-Velocity Door Check-In Scanner:**
  - Validates `TKT/2026/XXXX` QR token in under 300ms.
  - Instant duplicate prevention: if scanned twice, displays visual warning: `⚠️ ALREADY CHECKED IN AT 19:14:02 BY STAFF_ID_04`.
- **Post-Event Revenue & Attendance Analytics:**
  - Live reconciliation dashboard: Total tickets issued, total attendees checked in, total gross receipts, and attendance yield percentage.

#### 3.3 Merchandise & Inventory POS Module (`/merchandise`)
*Real-World Scene: Branded Hoodies & T-Shirts Online Ordering*
- **SKU Matrix & Size Variant Arrays:**
  - Products contain structured size arrays: `['XS', 'S', 'M', 'L', 'XL', '2XL']` with discrete physical inventory counts per size.
  - Variant attributes: Color (`Navy Blue`, `Heather Grey`, `Burgundy`), Garment Type (`Heavyweight Hoodie`, `Cotton Crewneck`, `Enamel Pin`).
  - Pricing: Member price (e.g., ₹799) vs Non-Member price (e.g., ₹999).
- **Double-Entry Stock Movements:**
  - Physical stock is tracked via source/destination locations: `Location:Suppliers` ➔ `Location:Club_Storage_Room` ➔ `Location:Customers`.
  - Zero destructive modifications: Stock balances computed exclusively from aggregated journal transfers (`stock.move`).
  - Pre-order management: If `ALLOW_NEGATIVE_INVENTORY` is false, orders exceeding available size stocks are routed to backorder status with expected restock dates.
- **Sales Order Lifecycle:**
  - Sequential code: `SO/2026/XXXX`.
  - Lifecycle: `Draft` (Cart populated) ➔ `Waiting` (Payment confirmation) ➔ `Ready` (Packed for pick-up) ➔ `Done` (Handed over at club table) ➔ `Cancelled`.

#### 3.4 Volunteer Task Management & Kanban Module (`/activities`)
*Real-World Scene: Bake Sale Fundraiser Planning & Resource Allocation*
- **Project Structure:**
  - Structured for multi-workstream initiatives (e.g., "Spring Bake Sale Fundraiser", "Club Orientation Week").
- **Kanban Pipeline Columns:**
  - `Backlog` ➔ `To Do` ➔ `In Progress` ➔ `Review` ➔ `Completed`.
- **Role & Responsibility Assignment Matrix:**
  - Specific task cards with assigned volunteer lead (`assignedVolunteerId`), priority tier (`Low`, `Medium`, `High`, `Critical`), due date, and budget allocation.
  - Explicit task categories:
    - *Baking & Kitchen Production:* Recipe prep, allergen labeling, batch targets.
    - *Supplies & Logistics:* Buying flour, sugar, packaging boxes, folding tables.
    - *Day-of Table Management:* Shift scheduling (10:00-12:00, 12:00-14:00, 14:00-16:00), cash float management.
- **Visual Progress & Blockers:**
  - Visual completion percentage bar on project headers.
  - Blocker tag alerts highlighting dependent tasks (e.g., "Cannot start Table Shift until Permits Approved").

#### 3.5 Accounting & Expense Reimbursement Module (`/accounting`)
*Real-World Scene: End-of-Semester Treasurer Close-Out & Volunteer Receipt Claims*
- **Volunteer Reimbursement Claims:**
  - Sequential reference: `EXP/2026/XXXX`.
  - Volunteers submit: Amount, Category (`Bake Sale Supplies`, `Event Decor`, `Printing`), Description, Vendor Name, and Cloud Receipt Attachment (URL/Image).
  - Lifecycle: `Draft` ➔ `Waiting` (Submitted for Treasurer review) ➔ `Ready` (Executive approved) ➔ `Done` (Bank transfer dispatched) ➔ `Cancelled`.
- **Immutable Double-Entry General Ledger:**
  - Built on Chart of Accounts:
    - Assets: `1010 Bank:Campus_Account`, `1020 Cash:Petty_Cash_Float`, `1030 Inventory:Merchandise_Stock`.
    - Liabilities: `2010 Accounts_Payable:Volunteer_Reimbursements`.
    - Equity / Reserves: `3010 Retained_Club_Surplus`.
    - Income: `4010 Income:Membership_Dues`, `4020 Income:Ticket_Sales`, `4030 Income:Merchandise_Sales`, `4040 Income:Fundraiser_Donations`.
    - Expenses: `5010 Expense:Event_Operations`, `5020 Expense:Merchandise_COGS`, `5030 Expense:Supplies_Logistics`, `5040 Expense:Administrative`.
- **Treasurer Close-Out Financial Reports:**
  - Instant One-Click Balance Sheet & P&L Statement showing Semester Gross Inflow, Gross Outflow, Net Surplus/Deficit, and Outstanding Unpaid Reimbursements.

#### 3.6 Communications & Broadcast Feed Module (`/broadcasts`)
*Real-World Scene: Replacing WhatsApp Chaos with Single-Source Announcements*
- **Broadcast Publication Workflow:**
  - Drafted by authorized Officers; published with target scope: `All Members`, `Active Executives`, `Volunteer Committee`, or `Public`.
  - Categories: `Emergency Meeting`, `Event Announcement`, `Opportunity / Elections`, `General Update`.
- **Read-Receipts & Historical Audit Ledger:**
  - Tracks timestamped delivery and acknowledged reads per member to establish accountability for missed deadlines.

