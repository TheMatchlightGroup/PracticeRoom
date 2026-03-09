# Stripe Subscription Database Schema

## Overview

This document outlines the database schema required for the Stripe subscription system integration with VocalStudy.

## Required Tables

### SUBSCRIPTIONS
Main table for tracking user subscriptions.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  plan_key VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('trialing', 'active', 'canceled', 'past_due')),
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
```

**Fields Explanation:**
- `id`: Unique identifier (UUID)
- `user_id`: Reference to auth.users table
- `stripe_customer_id`: Stripe customer identifier
- `stripe_subscription_id`: Stripe subscription identifier
- `plan_key`: One of:
  - `student_beginner`, `student_intermediate`, `student_advanced`
  - `teacher_studio`, `teacher_pro`, `teacher_elite`
- `billing_cycle`: `monthly` or `annual`
- `status`: 
  - `trialing`: During trial period
  - `active`: Paid and active
  - `canceled`: User cancelled
  - `past_due`: Payment failed
- `trial_end`: When trial period ends (NULL if no trial)
- `current_period_end`: When current billing period ends

**Row Level Security:**
```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "No INSERT allowed (Stripe webhook only)"
  ON subscriptions FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "Stripe webhook can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (current_user = 'postgres') -- Webhook runs as service role
  WITH CHECK (current_user = 'postgres');
```

---

### USAGE_LOGS
Track API usage and quotas by month.

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  ai_calls INTEGER NOT NULL DEFAULT 0,
  analysis_calls INTEGER NOT NULL DEFAULT 0,
  storage_mb_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_key)
);

-- Indexes for fast queries
CREATE INDEX idx_usage_logs_user_month ON usage_logs(user_id, month_key);
CREATE INDEX idx_usage_logs_month_key ON usage_logs(month_key);
```

**Fields Explanation:**
- `id`: Unique identifier (UUID)
- `user_id`: Reference to auth.users table
- `month_key`: Format `YYYY-MM` (e.g., `2025-02`)
- `ai_calls`: Count of AI practice plan generations used
- `analysis_calls`: Count of musical analysis calls used
- `storage_mb_used`: Total storage used in MB
- `created_at`: When record was created
- `updated_at`: When record was last updated

**Row Level Security:**
```sql
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update usage"
  ON usage_logs FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role can insert usage"
  ON usage_logs FOR UPDATE
  USING (current_user = 'postgres')
  WITH CHECK (current_user = 'postgres');
```

---

## Migration Steps

### 1. Create Tables

Run the following SQL in your Supabase SQL editor:

```sql
-- Create SUBSCRIPTIONS table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  plan_key VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('trialing', 'active', 'canceled', 'past_due')),
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Create USAGE_LOGS table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key VARCHAR(7) NOT NULL,
  ai_calls INTEGER NOT NULL DEFAULT 0,
  analysis_calls INTEGER NOT NULL DEFAULT 0,
  storage_mb_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_month ON usage_logs(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_usage_logs_month_key ON usage_logs(month_key);
```

### 2. Enable Row Level Security

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usage logs RLS
CREATE POLICY "Users can view their own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);
```

### 3. Test Access

```sql
-- Test as authenticated user (will be restricted by RLS)
SELECT * FROM subscriptions WHERE user_id = auth.uid();

-- Test usage logs
SELECT * FROM usage_logs WHERE user_id = auth.uid();
```

---

## Relationship Diagram

```
auth.users
    |
    |-- (1:1) subscriptions
    |         ├── stripe_customer_id
    |         ├── stripe_subscription_id
    |         ├── plan_key
    |         ├── billing_cycle
    |         └── status
    |
    └-- (1:many) usage_logs
              ├── month_key
              ├── ai_calls
              ├── analysis_calls
              └── storage_mb_used
```

---

## Query Examples

### Get User's Current Subscription

```sql
SELECT * FROM subscriptions 
WHERE user_id = 'user-uuid' 
  AND status IN ('trialing', 'active')
ORDER BY created_at DESC 
LIMIT 1;
```

### Get Current Month Usage

```sql
SELECT * FROM usage_logs 
WHERE user_id = 'user-uuid' 
  AND month_key = '2025-02';
```

### Get All Active Subscriptions

```sql
SELECT * FROM subscriptions 
WHERE status = 'active' 
ORDER BY created_at DESC;
```

### Check Usage Against Limit

```sql
SELECT 
  u.ai_calls,
  u.analysis_calls,
  u.storage_mb_used,
  s.plan_key
FROM usage_logs u
JOIN subscriptions s ON u.user_id = s.user_id
WHERE u.user_id = 'user-uuid'
  AND u.month_key = '2025-02'
  AND s.status IN ('trialing', 'active');
```

---

## Data Types Reference

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| stripe_customer_id | VARCHAR(255) | Stripe customer ID |
| stripe_subscription_id | VARCHAR(255) | Stripe subscription ID |
| plan_key | VARCHAR(50) | Plan identifier |
| billing_cycle | VARCHAR(10) | 'monthly' or 'annual' |
| status | VARCHAR(20) | Subscription status |
| trial_end | TIMESTAMP | Trial end time or NULL |
| current_period_end | TIMESTAMP | When billing period ends |
| month_key | VARCHAR(7) | YYYY-MM format |
| ai_calls | INTEGER | Count of AI calls used |
| analysis_calls | INTEGER | Count of analysis calls used |
| storage_mb_used | INTEGER | Storage in MB |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record update time |

---

## Notes

- All timestamps are in **UTC/ISO 8601** format
- Month key format is **YYYY-MM** (e.g., `2025-02`)
- Stripe webhook runs as Postgres service role (full access, bypasses RLS)
- Usage logs are created/updated by application code, not user directly
- Subscriptions are created by Stripe webhook events
- Trial period is optional (trial_end may be NULL)
- Plan keys are validated in application (see `planCapabilities.ts`)

---

## Backup Strategy

### Before Migration

```bash
# Export existing data
pg_dump -h <supabase-host> -U postgres -d postgres \
  -t subscriptions -t usage_logs \
  > backup_subscriptions.sql
```

### After Migration

```bash
# Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('subscriptions', 'usage_logs');
```

---

## Troubleshooting

### Issue: "relation 'subscriptions' does not exist"
**Solution**: Run the table creation SQL in Supabase SQL editor

### Issue: "permission denied for schema public"
**Solution**: Ensure your Supabase service role has adequate permissions

### Issue: RLS policies not working
**Solution**: Verify RLS is enabled and policies are created correctly:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('subscriptions', 'usage_logs');
```

---

## Performance Considerations

- Indexes on `user_id` for fast lookups
- Indexes on `status` for subscription queries
- Unique constraint on `(user_id, month_key)` prevents duplicates
- Indexes on foreign keys for join optimization

---

## Future Enhancements

- Add `invoice_history` table for payment records
- Add `feature_access_logs` table for audit trail
- Add `discount_codes` table for promotional offers
- Add `payment_methods` table for stored payment info
