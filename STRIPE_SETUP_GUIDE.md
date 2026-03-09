# Stripe Setup Guide

This guide teaches you how to set up Stripe for the VocalStudy subscription system.

---

## What We Just Did ✅

1. **Installed Stripe package**: `pnpm add stripe` (v20.3.1)
2. **Fixed TypeScript imports**: Changed route imports to relative paths
3. **Successfully built**: `npm run build` now passes both client and server
4. **Dev server running**: Ready to test

---

## What Stripe Does

Stripe handles:
- **Payment processing**: Collects credit cards securely
- **Subscriptions**: Recurring billing (monthly/annual)
- **Webhooks**: Notifies us when subscription events happen
- **Billing portal**: Let customers manage their own subscriptions
- **Customer management**: Stores billing info and plans

---

## Part 1: Create Stripe Account

### Step 1: Go to Stripe
Visit https://dashboard.stripe.com/register

### Step 2: Create Account
- Sign up with email
- Verify email
- Complete onboarding questionnaire

### Step 3: Verify Your Business
- Add business info
- Verify phone number
- (You might see a modal in dashboard, approve it)

### Step 4: Get to Dashboard
Once verified, you'll see the Stripe dashboard.

---

## Part 2: Get Your API Keys

### Step 1: Navigate to API Keys
In Stripe dashboard:
1. Click **Developers** (left sidebar)
2. Click **API Keys**

### Step 2: Find Your Keys
You'll see:
- **Publishable Key** (starts with `pk_test_` or `pk_live_`)
- **Secret Key** (starts with `sk_test_` or `sk_live_`)

**Important**: Use `test` keys for development, `live` keys for production.

### Step 3: Copy Secret Key
Copy your **secret key** (you'll use it in `.env`)

---

## Part 3: Create Subscription Plans

### Step 1: Go to Products
In Stripe dashboard:
1. Click **Products** (left sidebar)
2. Click **+ Create Product**

### Step 2: Create First Plan (student_beginner)
Fill in:
- **Name**: `VocalStudy - Student Beginner`
- **Description**: `3 pieces, 5 AI calls/month, basic analytics`
- **Type**: Recurring
- **Pricing model**: Standard pricing
- **Price**: $9.99
- **Billing period**: Monthly
- **Recurring**: Monthly

Click **Create product**

### Step 3: Note the Price ID
After creating, you'll see a **Price section** with a Price ID:
- Copy it (starts with `price_...`)
- Store for later: `STRIPE_STUDENT_BEGINNER_MONTHLY=price_...`

### Step 4: Create Annual Price
Go back to your product:
1. Click **+ Add another price**
2. Set **Price**: $99.99
3. Set **Billing period**: Yearly
4. Copy the annual Price ID: `STRIPE_STUDENT_BEGINNER_ANNUAL=price_...`

### Step 5: Repeat for Other Plans

Create 5 more products:
1. **Student Intermediate** ($19.99/mo, $199.99/yr)
2. **Student Advanced** ($49.99/mo, $499.99/yr)
3. **Teacher Studio** ($29.99/mo, $299.99/yr)
4. **Teacher Pro** ($79.99/mo, $799.99/yr)
5. **Teacher Elite** ($199.99/mo, $1999.99/yr)

You'll end up with **12 Price IDs total** (6 products × 2 billing cycles).

---

## Part 4: Set Up Webhooks

Webhooks let Stripe notify your app when subscriptions change.

### Step 1: Go to Webhooks
In Stripe dashboard:
1. Click **Developers** (left sidebar)
2. Click **Webhooks**
3. Click **+ Add an endpoint**

### Step 2: Add Webhook Endpoint
Fill in:
- **Endpoint URL**: `https://your-domain.com/api/subscription/webhook` 
  - For local dev: You'll need to use a tunnel (see below)
  - For production: Use your actual domain

### Step 3: Select Events
Select these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.failed` (optional)

### Step 4: Create Endpoint
Click **Add endpoint**

### Step 5: Copy Signing Secret
After creating, you'll see:
- **Signing secret** (starts with `whsec_...`)
- Copy it: `STRIPE_WEBHOOK_SECRET=whsec_...`

### For Local Development (Webhooks)

You can't receive webhooks on localhost. Use **Stripe CLI**:

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Or Linux
curl https://files.stripe.com/stripe-cli/releases/latest/linux/x86_64/stripe_linux_x86_64.tar.gz | tar -xz

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

This gives you a test signing secret to use locally.

---

## Part 5: Add to Environment Variables

### Step 1: Open `.env` File
```bash
# Edit your .env or .env.local
```

### Step 2: Add Stripe Keys
```env
# Stripe API Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here

# Stripe Price IDs (Monthly)
STRIPE_STUDENT_BEGINNER_MONTHLY=price_1234567890
STRIPE_STUDENT_INTERMEDIATE_MONTHLY=price_0987654321
STRIPE_STUDENT_ADVANCED_MONTHLY=price_1111111111
STRIPE_TEACHER_STUDIO_MONTHLY=price_2222222222
STRIPE_TEACHER_PRO_MONTHLY=price_3333333333
STRIPE_TEACHER_ELITE_MONTHLY=price_4444444444

# Stripe Price IDs (Annual)
STRIPE_STUDENT_BEGINNER_ANNUAL=price_5555555555
STRIPE_STUDENT_INTERMEDIATE_ANNUAL=price_6666666666
STRIPE_STUDENT_ADVANCED_ANNUAL=price_7777777777
STRIPE_TEACHER_STUDIO_ANNUAL=price_8888888888
STRIPE_TEACHER_PRO_ANNUAL=price_9999999999
STRIPE_TEACHER_ELITE_ANNUAL=price_0000000000
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

You should see:
```
✅ Stripe configured
```

If you see:
```
⚠️ Stripe API key not configured
```

Check that `STRIPE_SECRET_KEY` is set correctly.

---

## Part 6: Test Stripe Integration

### Test Card Numbers

Stripe provides test cards for development:

| Card | Number | Result |
|------|--------|--------|
| Visa (success) | 4242 4242 4242 4242 | ✅ Succeeds |
| Visa (decline) | 4000 0000 0000 0002 | ❌ Declines |
| Visa (requires auth) | 4000 2500 0000 0002 | Requires 3D Secure |

- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Test Checkout Flow

1. Start dev server: `npm run dev`
2. Go to http://localhost:3000
3. Sign up for a student account
4. Click "Subscribe" → "Student Intermediate"
5. You'll be redirected to Stripe checkout
6. Enter test card: `4242 4242 4242 4242`
7. Expiry: `12/25`
8. CVC: `123`
9. Click **Pay**

You should see:
- ✅ Checkout succeeds
- ✅ Subscription created in database
- ✅ Redirected back to app

### Test Webhook Locally

With **Stripe CLI** running:
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

When you make a test payment:
- Stripe sends webhook to your local server
- Your app receives `checkout.session.completed` event
- Database is updated automatically

---

## Common Issues & Fixes

### "Stripe API key not configured"
**Problem**: STRIPE_SECRET_KEY not in .env  
**Fix**: 
1. Check .env file has the key
2. Restart dev server
3. Verify no typos in key name

### "Invalid API key provided"
**Problem**: Secret key is wrong or from wrong account  
**Fix**:
1. Go to Stripe dashboard
2. Copy the key again
3. Make sure it's the **Secret Key**, not Publishable
4. Make sure it's from the right account

### "No webhook endpoint configured"
**Problem**: Webhooks not set up  
**Fix**: Follow Part 4 above

### "Webhook signature verification failed"
**Problem**: STRIPE_WEBHOOK_SECRET is wrong  
**Fix**:
1. Copy the **Signing secret** from Stripe dashboard (or Stripe CLI output)
2. Update .env
3. Restart server

### "Cannot create checkout session"
**Problem**: Price IDs are wrong  
**Fix**:
1. Go to Stripe → Products
2. For each product, verify the Price ID is correct
3. Update STRIPE_*_MONTHLY and STRIPE_*_ANNUAL in .env
4. Make sure they all match exactly

### "Payment declined"
**Problem**: Using a real card or non-test card  
**Fix**: Use test card numbers from Part 6 above

---

## File References

Your Stripe integration uses these files:

| File | Purpose |
|------|---------|
| `server/lib/stripe.ts` | Stripe SDK setup and helpers |
| `server/routes/subscription.ts` | Checkout, webhook, and billing portal routes |
| `server/middleware/planGuard.ts` | Capability checking |
| `server/config/planCapabilities.ts` | Plan definitions |
| `.env` | API keys and price IDs |
| `shared/subscription-types.ts` | TypeScript types |

---

## Next Steps

### 1. Set Up Account & Keys ✅
- Create Stripe account
- Get API keys
- Add to .env

### 2. Create Products & Prices ✅
- Create 6 subscription products
- Get 12 price IDs (monthly + annual)
- Add to .env

### 3. Set Up Webhooks ✅
- Create webhook endpoint
- Get signing secret
- Add to .env

### 4. Test the Flow ✅
- Use test card numbers
- Complete a checkout
- Verify subscription in database

### 5. Deploy
When ready for production:
1. Switch to **Live keys** from Stripe dashboard
2. Update .env with live keys
3. Update all price IDs to live prices
4. Update webhook URL to production domain
5. Deploy!

---

## Production Checklist

Before going live:

- [ ] Switch to Stripe **Live API keys**
- [ ] Create live subscription products and prices
- [ ] Update .env with live keys and price IDs
- [ ] Update webhook endpoint URL to production domain
- [ ] Test full checkout flow with live payment method
- [ ] Set up email notifications for failed payments
- [ ] Configure fraud prevention rules (if needed)
- [ ] Set up billing email templates

---

## Resources

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe API Docs**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Subscription Setup**: https://stripe.com/docs/billing/subscriptions/fixed-price

---

## Quick Reference

```bash
# Build and test
npm run build
npm run dev

# Check Stripe config
# Look for "✅ Stripe configured" in logs

# Test with Stripe CLI locally
stripe listen --forward-to localhost:3000/api/subscription/webhook

# Get test keys
# Go to: https://dashboard.stripe.com/apikeys (use test mode toggle)

# Create products
# Go to: https://dashboard.stripe.com/products

# Create webhooks
# Go to: https://dashboard.stripe.com/webhooks
```

---

## Summary

You now have:
✅ Stripe package installed  
✅ Stripe SDK integrated in codebase  
✅ API routes ready for checkout/billing  
✅ Webhook handling configured  
✅ TypeScript types for subscriptions  

All you need to do is:
1. Create Stripe account
2. Get API keys
3. Create products and prices
4. Add keys to .env
5. Test the flow

The code is already written and ready to use!
