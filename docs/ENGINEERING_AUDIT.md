# 🔬 ClubSphere: Engineering Audit Document
## Target Organization: Skyline Student Association
**Document Status:** LOCKED BASELINE  
**Author:** Garima Mittal  

---

### 1. Zod Ingestion Validation Schemas

Every incoming request payload is intercepted at the Express gateway router before hitting any controller or service function. Below are the definitive Zod validation schemas for all key domain operations.

#### 1.1 Authentication & User Schemas
```javascript
import { z } from 'zod';

export const UserRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must have at least 2 characters").max(80),
  studentIdentificationNumber: z.string().min(4).max(20),
  emailAddress: z.string().email("Invalid student email address"),
  passwordCredential: z.string().min(8, "Password must be at least 8 characters long"),
  phoneNumber: z.string().optional()
});

export const UserLoginSchema = z.object({
  emailAddress: z.string().email("Invalid student email address"),
  passwordCredential: z.string().min(1, "Password credential is required")
});
```

#### 1.2 Membership Schemas
```javascript
export const MembershipApplicationSchema = z.object({
  membershipTier: z.enum(['STANDARD_ANNUAL', 'LIFETIME', 'ALUMNI_SUPPORTER']),
  academicDepartment: z.string().min(2).max(100),
  academicYear: z.enum(['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'ALUMNI']),
  emergencyContactName: z.string().min(2).max(80),
  emergencyContactPhone: z.string().min(7).max(15)
});

export const MembershipPaymentSchema = z.object({
  paymentMethod: z.enum(['CASH_PAYMENT', 'BANK_TRANSFER', 'CAMPUS_CARD', 'ONLINE_GATEWAY']),
  paymentReferenceIdentifier: z.string().min(3).max(64),
  paidAmount: z.number().positive("Paid amount must be greater than zero")
});

export const MembershipQrVerifySchema = z.object({
  qrTokenPayload: z.string().min(10, "Invalid QR payload token")
});
```

#### 1.3 Event & Ticket Schemas (Spring Gala Specifics)
```javascript
export const EventCreationSchema = z.object({
  eventTitle: z.string().min(5).max(120),
  eventDescription: z.string().min(10).max(2000),
  venueLocation: z.string().min(3).max(150),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  maximumCapacityLimit: z.number().int().positive(),
  ticketTiers: z.array(z.object({
    tierIdentifier: z.string(),
    tierName: z.string(),
    priceAmount: z.number().min(0),
    isMemberExclusive: z.boolean(),
    maximumSeatLimit: z.number().int().positive()
  })).min(1, "At least one ticket tier must be configured")
});

export const TicketPurchaseSchema = z.object({
  ticketTierIdentifier: z.string(),
  ticketQuantity: z.number().int().min(1).max(10),
  paymentMethod: z.enum(['ONLINE_PAYMENT', 'CASH_AT_DOOR', 'CAMPUS_WALLET']),
  attendeeNotes: z.string().max(250).optional()
});

export const TicketQrValidationSchema = z.object({
  ticketTrackingCode: z.string().min(5),
  scannerLocation: z.string().default('MAIN_ENTRANCE_DOOR')
});
```

#### 1.4 Merchandise Schemas (Hoodies & Apparel)
```javascript
export const MerchandiseCreationSchema = z.object({
  productName: z.string().min(3).max(100),
  skuIdentifier: z.string().min(3).max(30),
  productCategory: z.enum(['HOODIES', 'T_SHIRTS', 'ACCESSORIES', 'MEMORABILIA']),
  memberPrice: z.number().positive(),
  nonMemberPrice: z.number().positive(),
  sizeMatrixStock: z.array(z.object({
    sizeVariant: z.enum(['XS', 'S', 'M', 'L', 'XL', '2XL']),
    initialInventoryQuantity: z.number().int().min(0)
  })).min(1)
});

export const SalesOrderSubmissionSchema = z.object({
  orderItems: z.array(z.object({
    productId: z.string().min(1),
    sizeVariant: z.enum(['XS', 'S', 'M', 'L', 'XL', '2XL']),
    itemQuantity: z.number().int().positive()
  })).min(1),
  deliveryMethod: z.enum(['CAMPUS_TABLE_PICKUP', 'DORM_DELIVERY']),
  specialInstructions: z.string().max(300).optional()
});
```

#### 1.5 Volunteer Task & Kanban Schemas (Bake Sale Fundraiser)
```javascript
export const ActivityTaskCreationSchema = z.object({
  projectName: z.string().default('Bake Sale Fundraiser'),
  taskTitle: z.string().min(3).max(120),
  taskDescription: z.string().max(1000).optional(),
  assignedVolunteerId: z.string().optional(),
  taskCategory: z.enum(['BAKING_PRODUCTION', 'SUPPLIES_LOGISTICS', 'TABLE_MANAGEMENT', 'MARKETING']),
  priorityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  targetCompletionDate: z.string().datetime(),
  allocatedBudgetAmount: z.number().min(0).default(0)
});

export const ActivityStageTransitionSchema = z.object({
  destinationStage: z.enum(['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']),
  transitionRemarks: z.string().max(200).optional()
});
```

#### 1.6 Accounting & Expense Schemas (Volunteer Reimbursement)
```javascript
export const ReimbursementClaimSubmissionSchema = z.object({
  expenseCategory: z.enum(['BAKE_SALE_SUPPLIES', 'EVENT_DECOR', 'PRINTING_SIGNAGE', 'FOOD_BEVERAGE', 'MISCELLANEOUS']),
  claimAmount: z.number().positive("Claim amount must be greater than zero"),
  vendorMerchantName: z.string().min(2).max(100),
  expenseDate: z.string().datetime(),
  receiptDocumentUrl: z.string().url("Valid receipt image/document URL is required"),
  businessPurposeJustification: z.string().min(5).max(500)
});

export const ReimbursementApprovalSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  treasurerNotes: z.string().max(300).optional(),
  disbursementSourceAccount: z.string().default('1010 Bank:Campus_Account')
});
```

---

### 2. Immutable Double-Entry Ledger Mathematical Specifications

#### 2.1 The Fundamental Balance Invariant
Every transaction in ClubSphere creates a balanced `JournalEntry` document containing at least two `JournalItem` line rows.
$$\sum \text{Debit Amounts} = \sum \text{Credit Amounts}$$
No balance is stored as a mutating integer in an account document. The authoritative account balance at any point in time $t$ is computed via database aggregation:
$$\text{AccountBalance}(A) = \sum_{j \in \text{Items}(A)} (\text{Debit}_j - \text{Credit}_j) \quad \text{[For Asset \& Expense Accounts]}$$
$$\text{AccountBalance}(L) = \sum_{j \in \text{Items}(L)} (\text{Credit}_j - \text{Debit}_j) \quad \text{[For Liability, Equity \& Income Accounts]}$$

#### 2.2 Standard Transaction Ledger Mappings for Skyline Association

| Real-World Campus Event | Source Node (Debit Account) | Destination Node (Credit Account) | Balance Effect |
| :--- | :--- | :--- | :--- |
| **Student Pays Annual Dues (₹500)** | `1010 Bank:Campus_Account` | `4010 Income:Membership_Dues` | Assets ↑ ₹500, Income ↑ ₹500 |
| **Spring Gala Member Ticket Sold (₹150)** | `1010 Bank:Campus_Account` | `4020 Income:Ticket_Sales` | Assets ↑ ₹150, Income ↑ ₹150 |
| **Spring Gala Door Ticket Cash (₹300)** | `1020 Cash:Petty_Cash_Float` | `4020 Income:Ticket_Sales` | Assets ↑ ₹300, Income ↑ ₹300 |
| **Hoodie Sold Online (₹799)** | `1010 Bank:Campus_Account` | `4030 Income:Merchandise_Sales` | Assets ↑ ₹799, Income ↑ ₹799 |
| **Volunteer Submits Bake Sale Receipt (₹1,200)** | `5030 Expense:Supplies_Logistics` | `2010 Accounts_Payable:Volunteer_Reimb` | Expenses ↑ ₹1,200, Liabilities ↑ ₹1,200 |
| **Treasurer Disburses Reimbursement (₹1,200)** | `2010 Accounts_Payable:Volunteer_Reimb` | `1010 Bank:Campus_Account` | Liabilities ↓ ₹1,200, Assets ↓ ₹1,200 |

#### 2.3 Physical Stock Movement Ledger Formula
Physical merchandise units are tracked identically using double-entry stock journals (`StockMove`):
$$\text{StockAtLocation}(L, P, S) = \sum \text{Qty}(\text{Destination} = L) - \sum \text{Qty}(\text{Source} = L)$$
Where:
- $L$: Physical Location (e.g., `Location:Club_Storage_Room`, `Location:Suppliers`, `Location:Customers`).
- $P$: Product SKU (e.g., `SKU-HOODIE-NAVY`).
- $S$: Size Variant (e.g., `M`, `L`, `XL`).

Destructive arithmetic operations like `stock = stock - 1` are strictly prohibited.

---

### 3. Concurrency Protection & Overbooking Prevention Engine

To prevent the classic campus disaster where two students buy the final Spring Gala VIP seat or the last Medium Hoodie simultaneously:
1. **Pessimistic Reservation Hold:** When a student enters ticket checkout, a temporary reservation lease is created in the database with a 10-minute TTL.
2. **Atomic Verification Query:**
   ```javascript
   const totalReservedOrConfirmed = await TicketModel.countDocuments({
     eventId: targetEventId,
     tierIdentifier: targetTierId,
     lifecycleState: { $in: ['RESERVED', 'CONFIRMED', 'DONE'] }
   });
   if (totalReservedOrConfirmed + requestedQuantity > tierSeatLimit) {
     throw new ConcurrencyCapacityExceededError("Seat quota exhausted for requested tier");
   }
   ```
3. **Atomic Sequence Generation (`ir.sequence`):**
   Sequential tracking codes (e.g., `SO/2026/0042`) utilize MongoDB's atomic `$inc` update operation:
   ```javascript
   const sequenceDoc = await SequenceModel.findOneAndUpdate(
     { sequenceCode: 'SO_2026' },
     { $inc: { currentSequenceNumber: 1 } },
     { new: true, upsert: true }
   );
   ```

---

### 4. Standardized System Error Handling Matrix

| HTTP Status | Error Class Identifier | Client Display Response | Root Cause / System Condition |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_FAILED` | "Invalid request parameters provided." | Malformed Zod payload intercepted at routing layer. Details array attached. |
| `401 Unauthorized` | `AUTH_TOKEN_MISSING_OR_EXPIRED` | "Session expired. Please sign in again." | Missing or invalid HTTP-Only JWT session cookie. |
| `403 Forbidden` | `RBAC_PERMISSION_DENIED` | "Access forbidden. Required role missing." | User role tier lacks authority for requested endpoint. |
| `404 Not Found` | `RECORD_NOT_FOUND` | "The requested resource does not exist." | Provided identifier not present in database collection. |
| `409 Conflict` | `CONCURRENCY_LOCK_VIOLATION` | "Capacity limit reached or conflicting state." | Race condition detected; ticket quota exhausted or double-booking intercepted. |
| `422 Unprocessable`| `FSM_INVALID_STATE_TRANSITION` | "Illegal state transition attempted." | Attempting to move from `Done` or skipping mandatory lifecycle states. |
| `429 Too Many Req` | `RATE_LIMIT_EXCEEDED` | "Too many requests. Please slow down." | Rate limiting threshold tripped (e.g., > 100 requests / 15 mins). |
| `500 Server Error` | `INTERNAL_NODE_FAILURE` | "⚠️ [ERP System Alert]: Cloud Node latency detected. Transitioning to fallback offline processing state." | Unhandled exception or database connection drop. |

