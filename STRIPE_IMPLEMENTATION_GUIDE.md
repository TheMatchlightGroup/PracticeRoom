# Stripe Subscription Architecture - Complete Implementation Guide

## 📋 Overview

This guide provides everything needed to implement and deploy the complete Stripe subscription system for VocalStudy. The system provides:

- **6 Subscription Tiers**: 3 student plans, 3 teacher plans
- **14-Day Free Trial**: All new subscriptions
- **Usage-Based Quotas**: AI calls, analysis calls, storage limits
- **Centralized Configuration**: All features defined in one place
- **Plan Guards**: Middleware to enforce capabilities
- **Webhook Integration**: Automatic subscription status updates
- **Zero Breaking Changes**: Integrates cleanly with existing code

---

## 🏗️ Architecture

```
Frontend (React)
    ↓
    ├─ POST /api/subscription/create-checkout
    ├─ POST /api/subscription/create-portal
    ├─ GET /api/subscription/current
    └─ POST /api/stripe/webhook (Stripe calls)
    
Backend (Express)
    ├─ server/lib/stripe.ts (Stripe SDK)
    ├─ server/config/planCapabilities.ts (Plan definitions)
    ├─ server/middleware/planGuard.ts (Access control)
    ├─ server/services/usageService.ts (Quota tracking)
    └─ server/routes/subscription.ts (Endpoints)
    
Database (Supabase)
    ├─ subscriptions (user plans)
    ├─ usage_logs (monthly quotas)
    └─ RLS policies (security)
```

---

## 📦 Files Created

### Core Integration Files

1. **shared/subscription-types.ts** (163 lines)
   - TypeScript interfaces for all subscription models
   - Plan types, subscription statuses, usage tracking
   - Type-safe development across client and server

2. **server/lib/stripe.ts** (233 lines)
   - Stripe SDK initialization
   - Price ID mapping from environment variables
   - Helper functions: createCustomer, checkout, portal, webhook validation
   - Error handling with graceful fallbacks

3. **server/config/planCapabilities.ts** (221 lines)
   - Centralized definition of all 6 plans
   - Feature toggles: maxPieces, aiCallsPerMonth, analyticsLevel, etc.
   - Helper functions: getCapability, compareP lans, validateCapability
   - **Single source of truth** for plan features

4. **server/middleware/planGuard.ts** (324 lines)
   - `requireActiveSubscription`: Validate user has active subscription
   - `requireCapability`: Enforce specific feature access
   - `checkAiQuota`: Prevent quota overages before API call
   - `requireStudentCapacity`: Enforce teacher student limits
   - `recordAiUsage`: Track usage after successful operation

5. **server/routes/subscription.ts** (413 lines)
   - `POST /api/subscription/create-checkout`: Create Stripe session
   - `POST /api/subscription/create-portal`: Billing portal access
   - `GET /api/subscription/current`: Get user's subscription
   - `POST /api/subscription/webhook`: Handle Stripe events
   - Webhook events: checkout.session.completed, subscription.updated, subscription.deleted

6. **server/services/usageService.ts** (300 lines)
   - `recordAiCall()`: Track AI practice plan generation
   - `recordAnalysisCall()`: Track music analysis calls
   - `recordStorageUsage()`: Track file storage
   - `hasExceededQuota()`: Check usage limits
   - `getUsageSummary()`: Dashboard-ready stats

### Documentation Files

7. **STRIPE_DATABASE_SCHEMA.md** (350 lines)
   - Complete SQL schema for subscriptions and usage_logs tables
   - RLS policies for security
   - Migration scripts ready to run
   - Query examples and troubleshooting

8. **STRIPE_IMPLEMENTATION_GUIDE.md** (This file)
   - Step-by-step implementation instructions
   - API reference
   - Common patterns and best practices

### Modified Files

9. **.env.example**
   - Added 14 Stripe environment variables
   - Price IDs for all 6 plans × 2 billing cycles

10. **server/index.ts**
    - Added Stripe webhook middleware
    - Registered subscription routes
    - Logging for Stripe configuration status

---

## 🚀 Implementation Steps

### Step 1: Install Dependencies

```bash
cd /root/app/code
npm install stripe
```

Verify installation:
```bash
npm list stripe
```

### Step 2: Create Stripe Account & Products

1. Go to https://dashboard.stripe.com
2. Create products for each plan:
   - Student Beginner
   - Student Intermediate
   - Student Advanced
   - Teacher Studio
   - Teacher Pro
   - Teacher Elite

3. Create prices for each:
   - Monthly variant
   - Annual variant (typically 20% discount)

4. Get price IDs from Stripe Dashboard (look like `price_1234567890`)

### Step 3: Database Migration

Copy and run SQL from `STRIPE_DATABASE_SCHEMA.md`:

1. In Supabase dashboard → SQL Editor
2. Create subscriptions table
3. Create usage_logs table
4. Enable RLS policies
5. Create indexes

Verify:
```sql
\d subscriptions
\d usage_logs
SELECT * FROM pg_tables WHERE tablename IN ('subscriptions', 'usage_logs');
```

### Step 4: Environment Configuration

Update `.env` with values from Stripe Dashboard:

```bash
# Get from Stripe API Keys page
STRIPE_SECRET_KEY=sk_live_...

# Get from Stripe Webhooks page after setting up endpoint
STRIPE_WEBHOOK_SECRET=whsec_...

# Get from Stripe Products → Prices (one for each plan × billing cycle)
STRIPE_PRICE_IDS_STUDENT_BEGINNER_MONTHLY=price_xxx
STRIPE_PRICE_IDS_STUDENT_BEGINNER_ANNUAL=price_xxx
... (repeat for all 12 prices)

# Your app's base URL
BASE_URL=https://yourdomain.com
```

### Step 5: Configure Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret → STRIPE_WEBHOOK_SECRET

### Step 6: Test Locally

```bash
# Option A: Stripe CLI webhook forwarding
stripe listen --forward-to localhost:3000/api/subscription/webhook
# Copy webhook signing secret to .env

# Option B: Use Stripe test mode
# Stripe Dashboard → API Keys → Select "Test"
```

### Step 7: Integrate with API Routes

Protected routes should use middleware:

```typescript
// Require active subscription
router.post("/api/some-feature", 
  verifyAuth,
  requireActiveSubscription,
  async (req, res) => {
    // User has active subscription
  }
);

// Require specific capability
router.post("/api/generate-plan", 
  verifyAuth,
  requireCapability("aiCallsPerMonth"),
  checkAiQuota,
  async (req, res) => {
    // Use practice plan generation
    await recordAiUsage(req.user.id, req.usageMonth);
  }
);

// Require student capacity (teachers)
router.post("/api/assign-student", 
  verifyAuth,
  requireStudentCapacity,
  async (req, res) => {
    // Assign student (up to limit)
  }
);
```

### Step 8: Build & Deploy

```bash
npm run build
npm start

# Or deploy to hosting (Netlify, Vercel, etc.)
```

---

## 📚 API Reference

### Frontend Endpoints

#### Create Checkout Session
```typescript
POST /api/subscription/create-checkout
Content-Type: application/json

{
  "plan_key": "student_intermediate",
  "billing_cycle": "annual"
}

// Response
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

#### Get Current Subscription
```typescript
GET /api/subscription/current

// Response
{
  "subscription": {
    "id": "uuid",
    "user_id": "uuid",
    "stripe_customer_id": "cus_...",
    "stripe_subscription_id": "sub_...",
    "plan_key": "student_intermediate",
    "billing_cycle": "annual",
    "status": "active",
    "trial_end": null,
    "current_period_end": "2025-03-25T...",
    "created_at": "2025-02-25T..."
  }
}
```

#### Create Billing Portal Session
```typescript
POST /api/subscription/create-portal

// Response
{
  "url": "https://billing.stripe.com/..."
}
```

### Backend Integration

#### Check Capability
```typescript
import { getCapability, isCapabilityEnabled } from "@/config/planCapabilities";

const capability = getCapability("student_intermediate");
console.log(capability.aiCallsPerMonth); // 20

const enabled = isCapabilityEnabled("student_intermediate", "pitchAnalyticsEnabled");
// true
```

#### Track Usage
```typescript
import { recordAiCall, hasExceededQuota } from "@/services/usageService";

// Before API call
const quota = await hasExceededQuota(userId, planKey, "aiCallsPerMonth");
if (quota.exceeded) {
  return res.status(402).json({ error: "Quota exceeded" });
}

// After successful call
await recordAiCall(userId);
```

#### Enforce Middleware
```typescript
router.post("/api/my-feature",
  verifyAuth,
  requireCapability("featureName"),
  checkAiQuota,
  async (req, res) => {
    // Protected route
  }
);
```

---

## 🔐 Security Considerations

### Webhook Validation

✅ **Implemented**: Stripe signature verification
```typescript
stripe.webhooks.constructEvent(body, signature, secret)
```

### RLS Policies

✅ **Implemented**: Users can only see their own subscriptions
```sql
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### Idempotency

✅ **Implemented**: Webhook events handled safely
```typescript
// Check if subscription already exists before inserting
const { data: existing } = await supabaseAdmin
  .from("subscriptions")
  .select("id")
  .eq("stripe_subscription_id", subscriptionId)
  .single();

if (existing) return; // Already processed
```

### API Rate Limiting

⚠️ **Not Implemented**: Consider adding rate limiting:
```typescript
import rateLimit from "express-rate-limit";

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many checkout requests"
});

router.post("/create-checkout", checkoutLimiter, ...);
```

### PCI Compliance

✅ **Compliant**: Never handle raw card data
- Stripe Checkout handles all payment processing
- No card data stored in your database
- Webhook secret validates authenticity

---

## 🐛 Troubleshooting

### Webhook Not Firing

**Problem**: Stripe webhook events not received

**Solutions**:
1. Check endpoint URL is accessible
2. Verify webhook signing secret matches
3. Check Stripe Dashboard → Webhooks → Recent Deliveries
4. Ensure `STRIPE_WEBHOOK_SECRET` is set in .env
5. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Checkout Session Creation Fails

**Problem**: "Price configuration missing"

**Solutions**:
1. Verify all 12 price IDs are set in .env
2. Check price IDs are valid in Stripe Dashboard
3. Ensure `STRIPE_SECRET_KEY` is correct
4. Test with: `stripe prices list`

### User Can't Access Feature

**Problem**: 402 "UPGRADE_REQUIRED" error

**Solutions**:
1. Check user has active subscription: `SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'`
2. Verify plan has capability enabled in `planCapabilities.ts`
3. Check trial hasn't expired: `trial_end < now()`
4. Run `GET /api/subscription/current` to see actual status

### Storage Quota Issues

**Problem**: Users hitting storage limit

**Solutions**:
1. Verify storageGbPerMonth in planCapabilities matches plan
2. Check usage logs: `SELECT * FROM usage_logs WHERE user_id = ? AND month_key = '2025-02'`
3. Reset usage (admin): `UPDATE usage_logs SET storage_mb_used = 0 WHERE user_id = ?`

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

```typescript
// 1. Subscription growth
SELECT DATE(created_at), COUNT(*) FROM subscriptions GROUP BY DATE(created_at);

// 2. Plan distribution
SELECT plan_key, COUNT(*) FROM subscriptions WHERE status IN ('active', 'trialing') GROUP BY plan_key;

// 3. Trial to paid conversion
SELECT 
  COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trialing,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as paid
FROM subscriptions;

// 4. Usage by plan
SELECT 
  s.plan_key,
  AVG(u.ai_calls) as avg_ai_calls,
  AVG(u.analysis_calls) as avg_analysis_calls,
  AVG(u.storage_mb_used) as avg_storage_mb
FROM subscriptions s
JOIN usage_logs u ON s.user_id = u.user_id
WHERE s.status IN ('active', 'trialing')
GROUP BY s.plan_key;
```

### Dashboards

Create charts in your analytics tool:
- Subscription trend (active/trialing/canceled)
- Revenue by plan (ARPU)
- Feature usage by plan tier
- Churn rate
- Trial conversion rate

---

## 🔄 Billing Cycles

### Monthly
- Renews every 30 days
- Good for testing or flexibility

### Annual
- Renews every 365 days
- Typically 20% discount
- Higher customer lifetime value

---

## 🎯 Future Enhancements

### Phase 2: Advanced Billing
- Support for multiple payment methods
- Automatic invoice emails
- Payment retry logic for failed charges
- Dunning management for past_due

### Phase 3: Promotions
- Coupon/discount code system
- Promotional pricing
- Loyalty rewards
- Team/enterprise pricing

### Phase 4: Analytics
- Comprehensive billing dashboard
- Revenue reports
- Churn analysis
- Cohort analysis

---

## ✅ Checklist Before Production

- [ ] Stripe account created and API keys obtained
- [ ] All 12 price IDs created and configured
- [ ] Database tables created with RLS policies
- [ ] Webhook endpoint configured in Stripe
- [ ] Environment variables set and tested
- [ ] Checkout flow tested end-to-end
- [ ] Webhook events tested with Stripe CLI
- [ ] Plan capabilities reviewed and correct
- [ ] Usage tracking integrated with AI routes
- [ ] Student capacity limits enforced
- [ ] 14-day trial verified
- [ ] Billing portal working
- [ ] Rate limiting implemented (optional)
- [ ] Monitoring and alerting configured
- [ ] Team trained on subscription system

---

## 📞 Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase SQL Editor**: https://supabase.com/dashboard/projects
- **Status Page**: Check webhook delivery in Stripe Dashboard

---

## 📝 Notes

- Trial period is always 14 days (configurable in checkout creation)
- All timestamps are UTC
- Month key format is YYYY-MM
- Plan keys are validated in TypeScript (type-safe)
- Webhook secret is critical - rotate annually
- Test mode and live mode are separate - ensure correct keys

---

## Summary

This implementation provides a production-ready Stripe subscription system with:

✅ 6 subscription tiers (3 student, 3 teacher)
✅ Centralized plan capability management
✅ Usage quota enforcement
✅ Teacher student limits
✅ Automatic webhook processing
✅ 14-day free trial
✅ Type-safe TypeScript throughout
✅ RLS security policies
✅ Zero breaking changes to existing code
✅ Comprehensive documentation

**Status**: Ready for production deployment
