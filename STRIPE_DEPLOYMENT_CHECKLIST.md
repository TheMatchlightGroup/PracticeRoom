# Stripe Subscription Deployment Checklist

**Status**: 🟢 Implementation Complete - Ready for Deployment  
**Target Date**: [When you're ready to go live]

---

## Phase 1: Preparation (Day 1)

### Stripe Account Setup
- [ ] Create Stripe account at https://stripe.com
- [ ] Verify email address
- [ ] Enable API access
- [ ] Get API keys from Dashboard → API Keys
  - [ ] Copy Secret Key → `STRIPE_SECRET_KEY`
  - [ ] Copy Publishable Key → `STRIPE_PUBLISHABLE_KEY` (for frontend)

### Stripe Product & Price Setup
- [ ] Create 6 Products in Stripe Dashboard:
  - [ ] Student Beginner
  - [ ] Student Intermediate
  - [ ] Student Advanced
  - [ ] Teacher Studio
  - [ ] Teacher Pro
  - [ ] Teacher Elite

- [ ] Create 12 Prices (each product gets monthly + annual):
  - [ ] 6 monthly prices
    - [ ] Student Beginner Monthly (e.g., $9/month)
    - [ ] Student Intermediate Monthly (e.g., $19/month)
    - [ ] Student Advanced Monthly (e.g., $49/month)
    - [ ] Teacher Studio Monthly (e.g., $29/month)
    - [ ] Teacher Pro Monthly (e.g., $79/month)
    - [ ] Teacher Elite Monthly (e.g., $199/month)
  
  - [ ] 6 annual prices (20% discount):
    - [ ] Student Beginner Annual (e.g., $99/year)
    - [ ] Student Intermediate Annual (e.g., $199/year)
    - [ ] Student Advanced Annual (e.g., $499/year)
    - [ ] Teacher Studio Annual (e.g., $299/year)
    - [ ] Teacher Pro Annual (e.g., $799/year)
    - [ ] Teacher Elite Annual (e.g., $1999/year)

- [ ] Copy all 12 Price IDs:
  - [ ] STRIPE_PRICE_IDS_STUDENT_BEGINNER_MONTHLY=price_xxx
  - [ ] STRIPE_PRICE_IDS_STUDENT_BEGINNER_ANNUAL=price_xxx
  - [ ] STRIPE_PRICE_IDS_STUDENT_INTERMEDIATE_MONTHLY=price_xxx
  - [ ] STRIPE_PRICE_IDS_STUDENT_INTERMEDIATE_ANNUAL=price_xxx
  - [ ] STRIPE_PRICE_IDS_STUDENT_ADVANCED_MONTHLY=price_xxx
  - [ ] STRIPE_PRICE_IDS_STUDENT_ADVANCED_ANNUAL=price_xxx
  - [ ] STRIPE_PRICE_IDS_TEACHER_STUDIO_MONTHLY=price_xxx
  - [ ] STRIPE_PRICE_IDS_TEACHER_STUDIO_ANNUAL=price_xxx
  - [ ] STRIPE_PRICE_IDS_TEACHER_PRO_MONTHLY=price_xxx
  - [ ] STRIPE_PRICE_IDS_TEACHER_PRO_ANNUAL=price_xxx
  - [ ] STRIPE_PRICE_IDS_TEACHER_ELITE_MONTHLY=price_xxx
  - [ ] STRIPE_PRICE_IDS_TEACHER_ELITE_ANNUAL=price_xxx

### Webhook Configuration
- [ ] Get Webhook Signing Secret:
  - [ ] Go to Stripe Dashboard → Developers → Webhooks
  - [ ] Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

- [ ] Create Webhook Endpoint:
  - [ ] Set endpoint URL: `https://yourdomain.com/api/subscription/webhook`
  - [ ] Select events:
    - [ ] `checkout.session.completed`
    - [ ] `customer.subscription.updated`
    - [ ] `customer.subscription.deleted`
  - [ ] Copy webhook signing secret

### Code Installation
- [ ] Run: `npm install stripe`
- [ ] Verify: `npm list stripe` (should show version)

---

## Phase 2: Database Setup (Day 2)

### Database Migration
- [ ] Open Supabase SQL Editor
- [ ] Copy SQL from **STRIPE_DATABASE_SCHEMA.md**
- [ ] Create SUBSCRIPTIONS table
- [ ] Create USAGE_LOGS table
- [ ] Create indexes
- [ ] Enable RLS:
  - [ ] ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY
  - [ ] ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY
- [ ] Create RLS policies:
  - [ ] User SELECT on own subscriptions
  - [ ] User SELECT on own usage_logs
  - [ ] Service role full access (webhooks)

### Verification
- [ ] Test queries in Supabase SQL Editor:
  - [ ] `SELECT * FROM subscriptions` (empty, expected)
  - [ ] `SELECT * FROM usage_logs` (empty, expected)
  - [ ] `\d subscriptions` (shows table schema)
  - [ ] `\d usage_logs` (shows table schema)

---

## Phase 3: Environment Configuration (Day 2)

### Update .env File
- [ ] Copy .env.example → .env (if not exists)
- [ ] Update Stripe variables:
  - [ ] STRIPE_SECRET_KEY=sk_live_xxx (from API Keys)
  - [ ] STRIPE_WEBHOOK_SECRET=whsec_xxx (from Webhooks)
- [ ] Update Price IDs (12 total):
  - [ ] All STRIPE_PRICE_IDS_* variables
- [ ] Update BASE_URL:
  - [ ] Development: `http://localhost:5173`
  - [ ] Production: `https://yourdomain.com`

### Verify Configuration
- [ ] Run: `npm run build` (should compile without errors)
- [ ] Check: All Stripe env vars are set
- [ ] Verify: No errors about missing price IDs

---

## Phase 4: Testing - Development (Day 3)

### Local Testing Setup
- [ ] Install Stripe CLI: https://stripe.com/docs/stripe-cli
- [ ] Authenticate: `stripe login`
- [ ] Forward webhooks: `stripe listen --forward-to localhost:5173/api/subscription/webhook`
- [ ] Copy webhook signing secret and update `.env`

### Test Stripe Checkout Flow
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to pricing page (when built)
- [ ] Click "Subscribe" button
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date (e.g., 12/25)
- [ ] CVC: Any 3 digits
- [ ] Complete checkout
- [ ] Verify:
  - [ ] Redirected to success page
  - [ ] Subscription created in Supabase
  - [ ] Trial end date set (14 days from now)

### Test Webhook Events
- [ ] In Stripe CLI terminal, trigger events:
  - [ ] `stripe trigger checkout.session.completed`
  - [ ] `stripe trigger customer.subscription.updated`
  - [ ] Verify webhook handled correctly (check logs)
- [ ] Verify:
  - [ ] Webhook events logged
  - [ ] Database updated correctly
  - [ ] No errors in application logs

### Test Billing Portal
- [ ] Call GET /api/subscription/current
- [ ] Should return user's subscription
- [ ] Call POST /api/subscription/create-portal
- [ ] Should return Stripe portal URL
- [ ] Click portal URL
- [ ] Verify:
  - [ ] Can see subscription details
  - [ ] Can update payment method (test card)
  - [ ] Can cancel subscription

### Test Usage Tracking
- [ ] Implement AI route with middleware:
  ```typescript
  router.post("/api/test-quota",
    verifyAuth,
    requireCapability("aiCallsPerMonth"),
    checkAiQuota,
    async (req, res) => {
      await recordAiUsage(req.user.id, req.usageMonth);
      res.json({ success: true });
    }
  );
  ```
- [ ] Call endpoint multiple times
- [ ] Verify usage tracked in USAGE_LOGS
- [ ] Exceed quota (after X calls)
- [ ] Verify 402 error returned
- [ ] Verify error message includes quota

### Test Student Capacity Limits
- [ ] As teacher, try to assign student
- [ ] Verify middleware checks limit
- [ ] Assign until reaching limit
- [ ] Verify next assignment blocked

---

## Phase 5: Frontend Integration (Day 4)

### Pricing Page (if building)
- [ ] Create pricing page showing 6 plans
- [ ] Include toggle: Monthly | Annual
- [ ] Display features from planCapabilities.ts
- [ ] Add "Subscribe" buttons
- [ ] Buttons call `/api/subscription/create-checkout`
- [ ] Handle response: redirect to `url`

### Subscription Status Display
- [ ] Show current plan on dashboard
- [ ] Show trial end date (if trialing)
- [ ] Show renewal date
- [ ] Add "Manage Billing" button
- [ ] Button calls `/api/subscription/create-portal`

### Trial Banner (Optional)
- [ ] If subscription.status === "trialing"
- [ ] Calculate days remaining
- [ ] Show: "Trial ends in X days"
- [ ] Add upgrade prompt

### Upgrade Prompts (Optional)
- [ ] When user hits gated feature
- [ ] Show modal: "Upgrade to access this feature"
- [ ] Button opens pricing page
- [ ] Pass `?feature=aiCallsPerMonth` in URL

---

## Phase 6: Testing - Production (Day 5)

### Deploy to Staging
- [ ] Build: `npm run build`
- [ ] Deploy to staging environment
- [ ] Update environment variables (staging Stripe keys)
- [ ] Run full test suite

### Production Stripe Keys
- [ ] Stripe Dashboard → toggle to Live keys (not Test)
- [ ] Copy Live Secret Key
- [ ] Copy Live Webhook Secret
- [ ] Create Live Webhook Endpoint
- [ ] DO NOT use Test keys in production

### Deploy to Production
- [ ] Deploy code to production
- [ ] Update environment variables with Live keys
- [ ] Verify deployment successful
- [ ] Check application logs

### Smoke Testing - Production
- [ ] Navigate to pricing page
- [ ] Test checkout with real card (small amount)
  - [ ] Use your own card
  - [ ] Should charge real money (refund if needed)
- [ ] Verify subscription in Supabase
- [ ] Verify webhook processed
- [ ] Test billing portal
- [ ] Check that features are accessible

---

## Phase 7: Monitoring & Maintenance

### Daily Monitoring
- [ ] Check Stripe Dashboard for transactions
- [ ] Monitor application logs for errors
- [ ] Verify webhook deliveries (Stripe Dashboard → Webhooks)
- [ ] Check failed payments (if any)

### Weekly Review
- [ ] Review subscription statistics:
  ```sql
  SELECT plan_key, COUNT(*) FROM subscriptions 
  WHERE status IN ('active', 'trialing') 
  GROUP BY plan_key;
  ```
- [ ] Check usage patterns
- [ ] Verify all price IDs are working
- [ ] Check webhook success rate

### Monthly Tasks
- [ ] Review Stripe billing
- [ ] Check churn rate (canceled subscriptions)
- [ ] Analyze by plan tier
- [ ] Plan any adjustments

---

## Troubleshooting

### Issue: "Price configuration missing"
**Solution**: Verify all 12 STRIPE_PRICE_IDS_* variables are set

### Issue: Webhook not received
**Solution**: 
1. Check endpoint URL is correct
2. Verify webhook signing secret matches
3. Check Stripe Dashboard → Webhooks → Recent Deliveries
4. Ensure .env has correct STRIPE_WEBHOOK_SECRET

### Issue: Checkout fails with "stripe module not found"
**Solution**: Run `npm install stripe`

### Issue: Database error when creating subscription
**Solution**: Run migration SQL from STRIPE_DATABASE_SCHEMA.md

### Issue: "permission denied" on webhook
**Solution**: Verify RLS allows service role (postgres) full access

---

## Rollback Plan

If something goes wrong:

1. **Code Rollback**: Revert to previous commit
2. **Database Rollback**: 
   ```sql
   DROP TABLE IF EXISTS usage_logs;
   DROP TABLE IF EXISTS subscriptions;
   ```
3. **Stripe Rollback**: Disable webhook endpoint
4. **Notify Users**: Communication plan for issues

---

## Success Criteria

- [ ] All 6 subscription tiers working
- [ ] Checkout flow complete (test + live cards)
- [ ] Webhooks processing successfully
- [ ] Trial period (14 days) enforced
- [ ] Usage quotas enforced
- [ ] Billing portal accessible
- [ ] No errors in logs
- [ ] All tests passing
- [ ] Users can subscribe and access features
- [ ] Support team trained

---

## Sign-Off

- [ ] Code Review: __________________ Date: ______
- [ ] QA Testing: __________________ Date: ______
- [ ] Product Owner: ________________ Date: ______
- [ ] DevOps/Deployment: ____________ Date: ______

---

## Post-Launch

### Week 1
- [ ] Monitor for issues daily
- [ ] Respond to customer billing questions
- [ ] Verify all webhook types working
- [ ] Check payment success rate

### Month 1
- [ ] Analyze usage patterns
- [ ] Identify any pricing adjustments needed
- [ ] Gather customer feedback
- [ ] Plan any improvements

### Quarterly
- [ ] Review churn rate
- [ ] Analyze plan distribution
- [ ] Consider new features or tiers
- [ ] Plan next iteration

---

## Important Notes

⚠️ **Critical Reminders**:
- Never commit `.env` with real secrets to git
- Test webhook with Stripe CLI before live
- Use test keys for development, live keys for production
- Keep webhook signing secret secure
- Regularly review webhook delivery logs
- Set up alerts for payment failures
- Plan for PCI compliance audit (optional)

---

## Support Contacts

- **Stripe Support**: support.stripe.com
- **Supabase Support**: supabase.com/support
- **Your Team**: [Contact information]

---

**Ready to launch your subscription system!** 🚀
