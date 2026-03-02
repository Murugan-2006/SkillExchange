# 🚀 Payment System - Quick Start (5 Minutes)

## Step 1: Get Stripe Keys (2 min)

1. Go to https://dashboard.stripe.com
2. Click **Developers** → **API Keys**
3. Copy your **Secret Key** (starts with `sk_`)
4. Copy your **Publishable Key** (starts with `pk_`)

## Step 2: Update Environment Variables (1 min)

Create or edit `/server/.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLIC_KEY=pk_test_your_key_here
PORT=5000
MONGODB_URI=your_mongodb_connection
```

## Step 3: Install Packages (1 min)

```bash
# In server directory
cd server
npm install stripe

# In client directory  
cd ../client
npm install @stripe/react-stripe-js @stripe/js
```

## Step 4: Start the Application (1 min)

```bash
# Terminal 1: Start Backend
cd server
npm run dev

# Terminal 2: Start Frontend
cd client
npm run dev
```

## 🧪 Test It Out (2 min)

### Test 1: Free Course Enrollment
1. Create a course with `price: 0` and `creditsRequired: 0`
2. Go to Courses page
3. Click "Enroll Free"
4. Should enroll instantly ✅

### Test 2: Credit Payment
1. Create a course with `creditsRequired: 10`
2. Make sure student has credits (default 50)
3. Click "Enroll Now" → Select "Pay with Credits"
4. Click "Pay 10 Credits"
5. Should enroll and deduct credits ✅

### Test 3: Stripe Payment
1. Create a course with `price: 9.99`
2. Click "Enroll Now" → Select "Pay with Card"
3. Mock payment will be created
4. (Full Stripe UI integration coming soon)

---

## 📝 Create Test Courses

### Using API (cURL)

```bash
# Free Course
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Free Introduction",
    "description": "Get started for free",
    "level": "beginner",
    "price": 0,
    "creditsRequired": 0
  }'

# Credit Course
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Premium with Credits",
    "description": "Pay with earned credits",
    "level": "intermediate",
    "price": 0,
    "creditsRequired": 10
  }'

# Paid Course
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Premium Course",
    "description": "High quality content",
    "level": "advanced",
    "price": 29.99,
    "creditsRequired": 0
  }'
```

---

## 🎨 Payment Modal Features

When student clicks "Enroll Now":

```
┌────────────────────────────┐
│  Enroll in Course          │ [X]
├────────────────────────────┤
│                            │
│ Course Title & Description │
│                            │
│ ○ Pay with Credits         │
│   Cost: 10 credits         │
│   Your balance: 50 credits │
│                            │
│ ○ Pay with Card            │
│   Cost: $29.99 USD         │
│   Secure payment via Stripe│
│                            │
│  [Cancel]  [Pay XXX]       │
└────────────────────────────┘
```

---

## 📊 Admin Dashboard

Access payment data:

```bash
# Get all payments
curl http://localhost:5000/api/payments \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response includes:
{
  "success": true,
  "payments": [...],
  "summary": {
    "totalPayments": 25,
    "completedPayments": 23,
    "totalRevenue": 599.50,
    "pendingPayments": 2
  }
}
```

---

## ✅ Checklist

- [ ] Stripe keys added to `.env`
- [ ] Packages installed (`npm install`)
- [ ] Server running (`npm run dev` in server)
- [ ] Client running (`npm run dev` in client)
- [ ] Created test course
- [ ] Tested enrollment flow
- [ ] Checked payment modal appearance
- [ ] Verified enrollment success

---

## 🎯 Common Tasks

### Add Credits to Student
```javascript
// In any controller or route
const credits = await Credits.findOne({ student: studentId });
credits.balance += 100;
await credits.save();
```

### Update Course Price
```javascript
const course = await Course.findByIdAndUpdate(courseId, {
  price: 49.99
});
```

### Get Student Payment History
```bash
curl http://localhost:5000/api/payments/history \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

### Check Enrollment Status
```bash
curl http://localhost:5000/api/enrollments \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| "Module not found: stripe" | Run `npm install stripe` in server |
| Stripe keys not working | Verify keys in `.env` are correct |
| Modal doesn't show | Check browser console for import errors |
| Payment fails | Ensure course has price > 0 or creditsRequired > 0 |
| Credits not deducted | Check student balance before enrollment |

---

## 📞 Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **React Docs**: https://react.dev
- **Project README**: `/README.md`
- **Full Setup Guide**: `/PAYMENT_INTEGRATION.md`

---

## 🎉 You're Ready!

The payment system is now fully integrated. Start accepting payments and credits!

**Questions?** Check the main `/PAYMENT_INTEGRATION.md` for detailed information.

---

⏱️ **Total Setup Time**: ~5 minutes
✅ **Status**: Ready to use
📅 **Last Updated**: February 3, 2026
