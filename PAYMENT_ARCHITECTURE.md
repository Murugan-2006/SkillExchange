# Payment System Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐        ┌─────────────────┐                │
│  │ CourseCard   │───────▶│ PaymentModal    │                │
│  │ Component    │        │ Component       │                │
│  └──────────────┘        └────────┬────────┘                │
│                                   │                          │
│  ┌──────────────────────────────┐ │                                 │
│  │ Payment Service API          │◀┘                               │
│  │ - payWithCredits()           │                                 │
│  │ - createStripeIntent()       │                                 │
│  │ - verifyStripePayment()      │                                 │
│  └──────────────┬───────────────┘                            │
└─────────────────┼──────────────────────────────────────────┘
                  │ HTTP/HTTPS
                  │
┌─────────────────▼──────────────────────────────────────────┐
│                    Backend (Node.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Express Routes (/api/payments/*)                     │  │
│  └──────────────────┬─────────────────────────────────┘  │
│                     │                                      │
│  ┌──────────────────▼──────────────────────────────────┐  │
│  │ PaymentController                                    │  │
│  │ ┌────────────────────────────────────────────────┐  │  │
│  │ │ - payCourseWithCredits()                       │  │  │
│  │ │ - createStripePaymentIntent()                  │  │  │
│  │ │ - verifyStripePayment()                        │  │  │
│  │ │ - getPaymentHistory()                          │  │  │
│  │ │ - getAllPayments()                             │  │  │
│  │ └────────────────────────────────────────────────┘  │  │
│  └──────────────────┬─────────────────────────────────┘  │
│                     │                                      │
│  ┌──────────────────▼──────────────────────────────────┐  │
│  │ Database Layer (MongoDB)                           │  │
│  │ ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │  │
│  │ │ Payment     │  │ Course      │  │ Enrollment   │ │  │
│  │ │ Collection  │  │ Collection  │  │ Collection   │ │  │
│  │ └─────────────┘  └─────────────┘  └──────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ External Services                                    │  │
│  │ ┌──────────────┐      ┌──────────────┐             │  │
│  │ │ Stripe API   │      │ Email Service│             │  │
│  │ └──────────────┘      └──────────────┘             │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## Payment Flows

### Flow 1: Credit Payment

```
Student Views Course
        │
        ▼
Click "Enroll Now"
        │
        ▼
PaymentModal Opens ◀─── Display Options
        │              - Pay with Credits
        ▼              - Price/Credits
Select Credits Method
        │
        ▼
Click "Pay X Credits"
        │
        ▼
Frontend → API: POST /payments/credits
                {courseId}
        │
        ▼
Backend ─────────────────┐
│                        │
├─ Get Course           │
├─ Check Student Credits│
├─ Validate Balance     │
├─ Deduct Credits       │
├─ Create Enrollment    │
├─ Create Payment Record│
└─ Update Course Count ─┘
        │
        ▼
Response: ✅ Success
        │
        ▼
Frontend: Show Success Message
        │
        ▼
Navigate to Dashboard
```

### Flow 2: Stripe Payment

```
Student Views Course
        │
        ▼
Click "Enroll Now"
        │
        ▼
PaymentModal Opens
        │
        ▼
Select Card Payment
        │
        ▼
Click "Pay $X.XX"
        │
        ▼
Frontend → API: POST /payments/stripe/intent
                {courseId}
        │
        ▼
Backend:
├─ Get Course
├─ Create Stripe PaymentIntent
├─ Create Payment Record (pending)
└─ Return clientSecret
        │
        ▼
Frontend: (Stripe Elements - to be implemented)
├─ Collect Card Details
├─ Confirm Payment with Stripe
└─ Return paymentIntentId
        │
        ▼
Frontend → API: POST /payments/stripe/verify
                {paymentId, paymentIntentId}
        │
        ▼
Backend:
├─ Verify with Stripe
├─ Check Payment Status
├─ Create Enrollment
├─ Update Payment Record
└─ Update Course Count
        │
        ▼
Response: ✅ Success or ❌ Failed
        │
        ▼
Frontend: Navigate to Dashboard
```

### Flow 3: Free Course

```
Student Views Course
        │
        ▼
See "Enroll Free" Button
        │
        ▼
Click "Enroll Free"
        │
        ▼
Direct Enrollment
(No Modal, No Payment)
        │
        ▼
✅ Enrolled Successfully
        │
        ▼
Navigate to Dashboard
```

---

## Database Schema Relationships

```
┌─────────────────┐
│     User        │
│  (Student)      │
└────────┬────────┘
         │
         │ has many
         ▼
┌─────────────────┐
│    Credits      │
│  (Balance)      │
└─────────────────┘

┌─────────────────┐
│     User        │
│  (Instructor)   │
└────────┬────────┘
         │
         │ creates
         ▼
┌─────────────────┐
│     Course      │
│ (price, credits)│
└────────┬────────┘
         │
         │ referenced by
         ▼
┌─────────────────┐
│    Payment      │
│  (Transaction)  │
└────────┬────────┘
         │
         │ results in
         ▼
┌─────────────────┐
│   Enrollment    │
│  (Student took  │
│   this course)  │
└─────────────────┘
```

---

## API Endpoint Hierarchy

```
/api/payments/
│
├─ POST /credits
│  │
│  ├─ Auth: Required
│  ├─ Body: {courseId}
│  ├─ Response: {enrollment, payment}
│  └─ Errors: Insufficient credits, Already enrolled
│
├─ POST /stripe/intent
│  │
│  ├─ Auth: Required
│  ├─ Body: {courseId}
│  ├─ Response: {clientSecret, paymentId}
│  └─ Errors: Course not found, No price set
│
├─ POST /stripe/verify
│  │
│  ├─ Auth: Required
│  ├─ Body: {paymentId, paymentIntentId}
│  ├─ Response: {enrollment, payment}
│  └─ Errors: Payment failed, Invalid status
│
├─ GET /history
│  │
│  ├─ Auth: Required
│  ├─ Response: [payments]
│  └─ Filters: Date range, Status
│
├─ GET /:paymentId
│  │
│  ├─ Auth: Required
│  ├─ Response: {payment details}
│  └─ Errors: Payment not found
│
└─ GET / (Admin)
   │
   ├─ Auth: Required (Admin)
   ├─ Response: {payments[], summary}
   └─ Includes: Revenue, stats
```

---

## Payment Lifecycle States

```
┌──────────────┐
│ INITIATED    │ (Only for Stripe)
│  (pending)   │
└──────┬───────┘
       │
       ├─────────────────┬───────────────────┐
       │                 │                   │
       ▼                 ▼                   ▼
    COMPLETED         FAILED            CANCELLED
    (success)        (error)           (user abort)
       │
       ├─ Creates Enrollment
       ├─ Issues Certificate (if applicable)
       ├─ Sends Email
       └─ Updates Progress
```

---

## Error Handling Flow

```
Payment Request
       │
       ▼
Validate Input ─────────────────────┐
       │                            │
       ├─ courseId exists?          │
       ├─ User authenticated?       │
       ├─ Already enrolled?         │
       │                            │
       ▼                            │
Check Payment Method                │
       │                            │
       ├─ CREDITS:                  │
       │  └─ Check balance          │
       │                            │
       ├─ STRIPE:                   │
       │  └─ Verify API key         │
       │                            │
       ▼                            │
Process Payment                     │
       │                            │
       ├─ Execute transaction       │
       ├─ Verify response           │
       │                            │
       ▼                            │
Record Payment                      │
       │                            │
       ├─ Create Payment doc        │
       ├─ Create Enrollment        │
       ├─ Update Course count       │
       │                            │
       ▼                            │
Send Response ◀─────────────────────┘
       │
       ├─ ✅ Success
       └─ ❌ Error (with reason)
```

---

## Transaction Safety

```
ACID Compliance:

Atomicity:    ✅ MongoDB Transactions
              - Multiple documents updated together
              - All or nothing

Consistency:  ✅ Schema Validation
              - Type checking
              - Required fields
              - Enum validation

Isolation:    ✅ JWT Authentication
              - Each user isolated
              - No cross-user access

Durability:   ✅ MongoDB Persistence
              - Permanent storage
              - Backups available
```

---

## Security Layers

```
Request → [Auth Middleware]
           ├─ Verify JWT token
           ├─ Extract user ID
           └─ Attach to request
           │
           ▼
        [Rate Limiting] (future)
           ├─ Max requests/minute
           └─ Prevent abuse
           │
           ▼
        [Input Validation]
           ├─ Check data types
           ├─ Validate amounts
           └─ Sanitize strings
           │
           ▼
        [Business Logic]
           ├─ Verify ownership
           ├─ Check balance
           └─ Prevent duplicates
           │
           ▼
        [External Service]
           ├─ (Stripe verification)
           └─ Cryptographic signing
           │
           ▼
        [Database]
           ├─ Encrypted fields
           └─ Transaction logs
           │
           ▼
        Response ✅
```

---

## Monitoring & Analytics

```
Payment System Metrics:

1. SUCCESS RATE
   ├─ Total attempts
   ├─ Successful payments
   └─ Failure rate (%)

2. REVENUE METRICS
   ├─ Total collected
   ├─ By payment method
   ├─ By course
   └─ By time period

3. PERFORMANCE METRICS
   ├─ Average response time
   ├─ Peak load handling
   └─ Error frequencies

4. USER METRICS
   ├─ Active payers
   ├─ Repeat purchases
   ├─ Average transaction value
   └─ Retention rate
```

---

## Integration Points

```
SkillExchange Payment System

┌───────────────────────────────────┐
│   Payment Integration Touchpoints  │
├────────────────────────────────────┤
│                                    │
│ 1. Course Module                   │
│    ├─ Price field                  │
│    ├─ Credits required             │
│    └─ Enrollment validation        │
│                                    │
│ 2. User/Credits Module             │
│    ├─ Balance management           │
│    ├─ Transaction history          │
│    └─ Credit operations            │
│                                    │
│ 3. Enrollment Module               │
│    ├─ Payment status check         │
│    ├─ Progress tracking            │
│    └─ Certificate issuance         │
│                                    │
│ 4. Email System                    │
│    ├─ Payment receipts             │
│    ├─ Enrollment confirmation      │
│    └─ Transaction notifications    │
│                                    │
│ 5. Admin Dashboard                 │
│    ├─ Payment analytics            │
│    ├─ Revenue reports              │
│    └─ Transaction management       │
│                                    │
└────────────────────────────────────┘
```

---

## Performance Optimization

```
Query Optimization:
├─ Indexed fields:
│  ├─ Payment.student
│  ├─ Payment.course
│  ├─ Payment.status
│  └─ Payment.createdAt
│
└─ Aggregation Pipeline:
   └─ Summary calculations (fast)

Caching Strategy:
├─ Student credits (cache 5 min)
├─ Course prices (cache 1 hour)
└─ Payment summary (cache 30 min)

Load Handling:
├─ Connection pooling
├─ Query batching
└─ Async processing
```

---

**Last Updated**: February 3, 2026
**Version**: 1.0
**Status**: ✅ Complete Architecture
