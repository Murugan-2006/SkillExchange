# Payment Integration Setup Guide

This guide explains the new payment system with **Credits** and **Stripe** payment options.

## Features Implemented

### 1. **Pay with Credits**
- Students can use their earned credits to enroll in courses
- Courses can require credits
- Credits are deducted upon successful enrollment
- Transaction history is maintained

### 2. **Pay with Stripe (Credit Card)**
- Students can pay with credit cards via Stripe
- Courses can have a USD price
- Secure payment processing
- Payment history tracking

### 3. **Free Courses**
- Courses with no credits required and no price are free to enroll

---

## Backend Setup

### 1. Database Models

#### New Model: `Payment` (/server/models/Payment.js)
Tracks all payment transactions with fields:
- `student` - Reference to student
- `course` - Reference to course
- `paymentMethod` - 'credits' | 'stripe' | 'razorpay'
- `amount` - Payment amount
- `status` - 'pending' | 'completed' | 'failed' | 'cancelled'
- `stripePaymentIntentId` - For Stripe payments
- `transactionId` - Unique transaction ID

#### Updated Model: `Course` (/server/models/Course.js)
Added fields:
- `price` - Course price in USD (default: 0)
- `isPaid` - Boolean flag for paid courses
- `creditsRequired` - Credits needed to enroll (already existed)

### 2. Payment Controller (/server/controllers/paymentController.js)

**Available Functions:**
- `payCourseWithCredits()` - Handle credit payment
- `createStripePaymentIntent()` - Initiate Stripe payment
- `verifyStripePayment()` - Verify and complete Stripe payment
- `getPaymentHistory()` - Get student's payment history
- `getPaymentDetails()` - Get specific payment details
- `getAllPayments()` - Admin: Get all payments with summary

### 3. Payment Routes (/server/routes/payments.js)

```
POST   /api/payments/credits          - Pay with credits
POST   /api/payments/stripe/intent    - Create Stripe intent
POST   /api/payments/stripe/verify    - Verify Stripe payment
GET    /api/payments/history          - Get payment history
GET    /api/payments/:paymentId       - Get payment details
GET    /api/payments                  - Admin: Get all payments
```

### 4. Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration (if using Stripe)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# Payment Configuration
ADMIN_ACTION_TOKEN=admin-secret
```

**To get Stripe keys:**
1. Go to https://dashboard.stripe.com
2. Get your Secret Key and Publishable Key
3. Add them to `.env`

### 5. Install Stripe Package (Server)

```bash
cd server
npm install stripe
```

---

## Frontend Setup

### 1. New Component: PaymentModal (/client/src/components/PaymentModal.jsx)

Modal component with:
- Credit payment option
- Stripe payment option
- Free course option
- Credit balance display
- Payment method selection

### 2. Updated Component: CourseCard

Enhanced with:
- Payment modal integration
- Price and credits display
- Dynamic enroll button text
- Free/Paid/Credit-based course detection

### 3. Payment Service (/client/src/services/api.js)

```javascript
export const paymentService = {
  payWithCredits: (courseId) => api.post('/payments/credits', { courseId }),
  createStripeIntent: (courseId) => api.post('/payments/stripe/intent', { courseId }),
  verifyStripePayment: (paymentId, paymentIntentId) => 
    api.post('/payments/stripe/verify', { paymentId, paymentIntentId }),
  getPaymentHistory: () => api.get('/payments/history'),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
  getAllPayments: () => api.get('/payments'),
};
```

### 4. Install Stripe Package (Client)

```bash
cd client
npm install @stripe/react-stripe-js @stripe/js
```

---

## How It Works

### Credit Payment Flow

1. Student clicks "Enroll Now" on a course
2. PaymentModal opens showing:
   - Course details
   - Available payment methods
   - Their credit balance
3. Student selects "Pay with Credits"
4. Clicks "Pay X Credits" button
5. Backend:
   - Verifies sufficient credits
   - Deducts credits from account
   - Creates enrollment
   - Creates payment record
6. Frontend redirects to dashboard

### Stripe Payment Flow

1. Student clicks "Enroll Now" on paid course
2. PaymentModal opens with Stripe option
3. Student clicks "Pay $X.XX"
4. Backend creates Stripe PaymentIntent
5. Frontend redirects to Stripe Checkout (to be implemented)
6. Student completes payment on Stripe
7. Backend verifies payment
8. Creates enrollment and payment record

---

## Creating Courses with Prices

### Using API

```bash
POST /api/courses
{
  "title": "Advanced React",
  "description": "Learn advanced React patterns",
  "instructor": "instructor_id",
  "skillsCovered": ["React", "Hooks", "State Management"],
  "level": "advanced",
  "category": "Web Development",
  "price": 49.99,          # Price in USD (optional)
  "creditsRequired": 0,    # Credits needed (optional)
  "isPaid": true
}
```

### Course Types

1. **Free Course**
   ```json
   { "price": 0, "creditsRequired": 0 }
   ```

2. **Credits Only**
   ```json
   { "price": 0, "creditsRequired": 50 }
   ```

3. **Paid Course**
   ```json
   { "price": 49.99, "creditsRequired": 0 }
   ```

4. **Hybrid** (Credit or Pay)
   ```json
   { "price": 49.99, "creditsRequired": 50 }
   ```

---

## Testing

### Test Credit Payment

```bash
# 1. Create a course
POST /api/courses
{
  "title": "Test Course",
  "description": "Test",
  "creditsRequired": 10
}

# 2. Give student credits (if needed)
POST /api/credits/add
{ "userId": "student_id", "amount": 100 }

# 3. Pay with credits
POST /api/payments/credits
{ "courseId": "course_id" }
```

### Test Stripe Payment

```bash
# 1. Create a paid course
POST /api/courses
{
  "title": "Premium Course",
  "description": "Premium content",
  "price": 29.99
}

# 2. Create payment intent
POST /api/payments/stripe/intent
{ "courseId": "course_id" }

# 3. Verify payment (after user pays)
POST /api/payments/stripe/verify
{ "paymentId": "payment_id", "paymentIntentId": "intent_id" }
```

---

## Admin Dashboard Features

### View All Payments

```bash
GET /api/payments
```

Returns:
- List of all payments
- Payment summary:
  - Total payments count
  - Completed payments count
  - Total revenue
  - Pending payments count

---

## Troubleshooting

### "Insufficient Credits" Error
- Check student's credit balance: `GET /api/credits`
- Add credits if needed
- Verify `creditsRequired` in course

### Stripe Payment Intent Fails
- Verify Stripe API keys in `.env`
- Check if Stripe is in test mode
- Ensure course has a valid price

### Payment Record Not Created
- Check MongoDB connection
- Verify payment controller is mounted in routes
- Check server logs for errors

---

## Future Enhancements

1. **Razorpay Integration** - For Indian users
2. **PayPal Integration** - Broader payment options
3. **Refund Management** - Handle course cancellations
4. **Invoice Generation** - PDF receipts
5. **Payment Analytics** - Revenue charts and stats
6. **Subscription Courses** - Monthly/yearly payments
7. **Promo Codes** - Discount management
8. **Payment Disputes** - Chargeback handling

---

## File Changes Summary

### New Files Created
- `/server/models/Payment.js` - Payment model
- `/server/controllers/paymentController.js` - Payment logic
- `/server/routes/payments.js` - Payment routes
- `/client/src/components/PaymentModal.jsx` - Payment UI

### Modified Files
- `/server/models/Course.js` - Added price and isPaid fields
- `/server/server.js` - Added payment routes
- `/client/src/components/CourseCard.jsx` - Integrated payment modal
- `/client/src/services/api.js` - Added payment service methods

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs: `npm run dev` in server directory
3. Check browser console for frontend errors
4. Verify environment variables are set correctly
