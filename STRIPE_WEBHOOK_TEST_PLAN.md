# Stripe Webhook Testing & Verification Guide

This guide walks through testing the end-to-end Stripe webhook → Supabase SUBSCRIPTIONS sync flow.

## Prerequisites

- ✅ Stripe test account with webhook endpoint configured
- ✅ Supabase project with SUBSCRIPTIONS table
- ✅ Dev server running (`npm run dev`)
- ✅ F12 Console and Network tabs ready

## Architecture Overview

```
Stripe Event → Webhook Endpoint → Signature Verification
    ↓
Idempotency Check (WEBHOOK_EVENTS table)
    ↓
Event Handler (checkout.session.completed, subscription.created, etc.)
    ↓
Upsert SUBSCRIPTIONS table
    ↓
Mark Event Processed
```

## Step-by-Step Test Plan

### Phase 1: Setup Verification

#### 1.1 Verify Webhook Secret is Configured
```bash
# Check server logs during startup
# You should see: ✅ Stripe configured
```

If not configured:
```bash
# Set via DevServerControl
set_env_variable: ["STRIPE_WEBHOOK_SECRET", "whsec_..."]
# Get whsec from: https://dashboard.stripe.com/webhooks
```

#### 1.2 Verify WEBHOOK_EVENTS Table Exists
```sql
-- In Supabase SQL Editor
SELECT * FROM webhook_events LIMIT 1;
-- Should return empty (no error means table exists)
```

If table doesn't exist:
1. Go to Supabase → SQL Editor
2. Paste contents of: `supabase/migrations/20250225_create_webhook_events.sql`
3. Click "Run"

#### 1.3 Test the Debug Endpoint
```bash
# Use this to check current subscription + capabilities
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  http://localhost:3000/api/subscription/me

# Response should show subscription and capabilities
{
  "subscription": null,  // or subscription data if exists
  "capabilities": {
    "planKey": "free",
    "status": "none",
    "pitchAnalyticsEnabled": false,
    "analysisCallsPerMonth": 0
  }
}
```

---

### Phase 2: Complete a Checkout (Full Flow)

#### 2.1 Open F12 Console and Filter for Logs
1. Open F12 (Developer Tools)
2. Go to **Console** tab
3. Filter for: `stripe`, `webhook`, `🔄`, `✅`, `🔔`

#### 2.2 Start Checkout
1. Navigate to `/subscription`
2. Login if needed
3. Select a plan (e.g., "Student Intermediate")
4. Click "Choose Plan"
5. You should see console logs:
   ```
   🔄 Stripe Checkout: origin=..., successUrl=...
   Opening checkout: https://checkout.stripe.com/...
   ```

#### 2.3 Complete Payment with Test Card
When Stripe checkout opens:
- **Email:** Any email (e.g., test@example.com)
- **Card:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 567)
- **Name:** Test User
- **Billing Address:** Any valid address

Click **Pay $X.XX**

#### 2.4 Expect Redirect
You should be redirected to `/dashboard?success=true` with a success toast:
```
"Subscription Confirmed! Your payment was successful."
```

---

### Phase 3: Verify Webhook Receipt & Database

#### 3.1 Check Server Logs for Webhook Processing
Server console should show (in order):
```
🔔 Webhook received: checkout.session.completed (evt_...)
🔄 Stripe Checkout Debug: ...
⏭️  Webhook ... already processed, skipping  (if duplicate)
✅ Subscription upserted: sub_... for user ...
```

**Key logs to look for:**
- `🔔 Webhook received:` - Webhook was received
- `✅ Subscription upserted:` - DB sync successful
- If you see `🔴` messages - check error details

#### 3.2 Check WEBHOOK_EVENTS Table
```sql
SELECT 
  event_id, 
  event_type, 
  processed, 
  processed_at,
  error
FROM webhook_events
ORDER BY created_at DESC
LIMIT 5;
```

Expected rows:
- `checkout.session.completed` → processed = true
- `customer.subscription.created` → processed = true (if triggered)
- `customer.subscription.updated` → processed = true (if triggered)

#### 3.3 Check SUBSCRIPTIONS Table
```sql
SELECT 
  id,
  user_id,
  plan_key,
  billing_cycle,
  status,
  trial_end,
  current_period_end,
  created_at
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

Expected values:
- `plan_key`: "student_intermediate" (or your selected plan)
- `billing_cycle`: "monthly" or "annual"
- `status`: "trialing" (during trial period)
- `trial_end`: ~14 days from now
- `current_period_end`: ~30 days from now (or 1 year if annual)

#### 3.4 Test the /me Endpoint Again
```bash
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  http://localhost:3000/api/subscription/me
```

Expected response (for Student Intermediate):
```json
{
  "subscription": {
    "id": "...",
    "planKey": "student_intermediate",
    "billingCycle": "monthly",
    "status": "trialing",
    "trialEnd": "2026-03-11T...",
    "currentPeriodEnd": "2026-03-25T..."
  },
  "capabilities": {
    "planKey": "student_intermediate",
    "status": "trialing",
    "pitchAnalyticsEnabled": true,
    "analysisCallsPerMonth": 30,
    "aiCallsPerMonth": 50,
    "maxPieces": 10
  }
}
```

---

### Phase 4: Test Subscription Lifecycle Events

#### 4.1 Cancel Subscription in Stripe Dashboard
1. Go to **Stripe Test Dashboard** → **Customers**
2. Find your test customer (search by email from checkout)
3. Click to open customer details
4. Find the active subscription (status: "Active")
5. Click **Cancel Subscription** button
6. Confirm cancellation in Stripe

#### 4.2 Monitor Server Logs
You should see:
```
🔔 Webhook received: customer.subscription.deleted (evt_...)
✅ Subscription canceled: sub_...
```

#### 4.3 Verify Database Update
```sql
SELECT status FROM subscriptions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `status` = `"canceled"`

#### 4.4 Test /me Endpoint
```bash
curl -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  http://localhost:3000/api/subscription/me
```

Expected: Should return `subscription: null` (no active subscription)

---

### Phase 5: Test Payment Failure (Optional)

#### 5.1 Use a Failing Test Card
Repeat checkout flow with this card to trigger failure:
- **Card:** `4000 0000 0000 0002` (Insufficient funds)

#### 5.2 Monitor Webhook
Server should log:
```
🔔 Webhook received: invoice.payment_failed (evt_...)
⚠️  Subscription marked past_due...
```

#### 5.3 Verify Status
```sql
SELECT status FROM subscriptions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `status` = `"past_due"`

---

### Phase 6: Test Idempotency (Duplicate Prevention)

Stripe will retry webhooks if it doesn't receive a 200 response. Our system should handle duplicates.

#### 6.1 Simulate Duplicate Webhook
In Stripe Dashboard:
1. Go to **Webhooks** → Select your endpoint
2. Look for "Recent Events"
3. Click an event and look for "Attempts"
4. If Stripe has already retried, you'll see multiple attempts

#### 6.2 Check WEBHOOK_EVENTS
```sql
SELECT 
  event_id,
  processed,
  processed_at,
  COUNT(*) 
FROM webhook_events
GROUP BY event_id
HAVING COUNT(*) > 1;
```

Should be empty (each event_id is unique). Our UNIQUE constraint prevents duplicates.

#### 6.3 Check Server Logs
If a duplicate is received, you should see:
```
🔔 Webhook received: checkout.session.completed (evt_...)
⏭️  Webhook evt_... already processed, skipping
```

The subscription should NOT be duplicated in the database.

---

## Troubleshooting

### Issue: Webhook not received
**Solution:**
1. Verify webhook secret is set: `echo $STRIPE_WEBHOOK_SECRET`
2. Check Stripe dashboard → Webhooks → Recent Events
3. Look for 4xx/5xx responses (signature mismatch usually returns 400)
4. Verify endpoint URL in Stripe is correct

### Issue: Subscription row not appearing
**Solution:**
1. Check server logs for `🔴` errors in webhook handler
2. Verify user_id is set correctly in Stripe customer metadata
3. Run: `SELECT * FROM subscriptions WHERE user_id = '...'`
4. Check WEBHOOK_EVENTS for processing errors

### Issue: Duplicate subscriptions created
**Solution:**
1. This shouldn't happen due to UNIQUE constraint on stripe_subscription_id
2. If it does occur, check logs for "Error upserting subscription"
3. Verify SUBSCRIPTIONS table has correct indexes

### Issue: Status not updating on cancel
**Solution:**
1. Verify customer.subscription.deleted webhook is being received
2. Check logs for handler errors
3. Ensure STRIPE_WEBHOOK_SECRET is correct (400 errors indicate signature mismatch)
4. Manually check subscription status in Stripe dashboard

---

## Success Criteria

✅ All tests pass when:

1. **Checkout Flow**
   - User is redirected to dashboard with success toast
   - No 400/500 errors in console

2. **Webhook Processing**
   - Server logs show `✅ Subscription upserted`
   - WEBHOOK_EVENTS table contains the event
   - SUBSCRIPTIONS table contains the user's subscription

3. **Capabilities**
   - GET `/api/subscription/me` returns correct plan capabilities
   - Features match the selected plan tier

4. **Lifecycle Events**
   - Canceling subscription updates status to "canceled"
   - Failed payments mark status as "past_due"

5. **Idempotency**
   - Duplicate webhooks don't create duplicate subscriptions
   - Server logs show "already processed, skipping"

---

## Production Checklist

Before deploying to production:

- [ ] STRIPE_WEBHOOK_SECRET is set in production env vars
- [ ] Webhook endpoint URL points to production domain
- [ ] Database migrations applied to production Supabase
- [ ] Test with real payment method (or use live test cards)
- [ ] Monitor logs for webhook errors for 24 hours
- [ ] Set up alerts for webhook processing failures
- [ ] Document rollback procedure if webhook processing breaks
