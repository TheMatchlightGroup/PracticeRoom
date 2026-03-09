# Supabase Setup Guide for PracticeRoom.io

This guide walks through setting up Supabase for PracticeRoom.io with authentication, database, and storage.

## Prerequisites

- Supabase account (https://supabase.com)
- Node.js and npm/pnpm installed
- Git

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Enter project name: `practiceroom`
4. Set a strong database password
5. Select your region
6. Click "Create new project" (takes 1-2 minutes)

## Step 2: Get Your Credentials

Once project is created:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY` (frontend)
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (backend only)

## Step 3: Create Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'student',
  profile_photo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Student profiles
CREATE TABLE public.student_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  vocal_range_low TEXT,
  vocal_range_high TEXT,
  experience_level TEXT,
  goals TEXT[],
  primary_instrument TEXT DEFAULT 'Voice'
);

-- Teacher profiles
CREATE TABLE public.teacher_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  methods_used TEXT[],
  instruments_taught TEXT[],
  years_experience INTEGER,
  availability_json JSONB,
  hourly_rate NUMERIC(10,2)
);

-- Pieces (repertoire)
CREATE TABLE public.pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  composer TEXT NOT NULL,
  language TEXT,
  key_signature TEXT,
  difficulty TEXT DEFAULT 'Intermediate',
  instrument TEXT DEFAULT 'Voice',
  upload_url TEXT,
  analysis_json JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Practice plans
CREATE TABLE public.practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id UUID NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  generated_json JSONB NOT NULL,
  weekly_structure_json JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Technique modules (exercise library)
CREATE TABLE public.technique_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT DEFAULT 'system',
  source_method TEXT,
  difficulty_level TEXT,
  description TEXT,
  instructions TEXT,
  media_url TEXT,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Memorization cards (spaced repetition)
CREATE TABLE public.memorization_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id UUID NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL,
  content TEXT NOT NULL,
  next_review_date DATE,
  interval_days INTEGER DEFAULT 1,
  easiness_factor NUMERIC(3,2) DEFAULT 2.5,
  repetition_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  read_status BOOLEAN DEFAULT FALSE
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  datetime TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pieces_user_id ON public.pieces(user_id);
CREATE INDEX idx_practice_plans_user_id ON public.practice_plans(user_id);
CREATE INDEX idx_practice_plans_piece_id ON public.practice_plans(piece_id);
CREATE INDEX idx_memorization_cards_user_id ON public.memorization_cards(user_id);
CREATE INDEX idx_memorization_cards_piece_id ON public.memorization_cards(piece_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
```

## Step 4: Set Up Row Level Security (RLS)

Enable RLS on all tables:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorization_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

Create basic RLS policies:

```sql
-- Users: can read own profile
CREATE POLICY "Users can read own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

-- Pieces: can read own pieces
CREATE POLICY "Users can read own pieces" 
  ON public.pieces FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pieces" 
  ON public.pieces FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pieces" 
  ON public.pieces FOR UPDATE 
  USING (auth.uid() = user_id);

-- Similar policies for other tables...
```

## Step 5: Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create new public bucket: `scores`
3. Create new public bucket: `media`

## Step 6: Configure Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
NODE_ENV=development
PORT=8080
```

### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 7: Enable Authentication Methods

1. Go to **Authentication** → **Providers**
2. Enable "Email"
3. (Optional) Enable "Google" for OAuth

## Step 8: Install Dependencies

```bash
pnpm install @supabase/supabase-js openai dotenv multer
```

## Step 9: Test Connection

Run the dev server:

```bash
pnpm dev
```

Check console logs for:
- ✅ Supabase configured
- ✅ OpenAI API configured

If either shows warnings, check your .env files.

## Step 10: Switch Auth Context

Update `client/App.tsx` to use the new Supabase auth context:

```typescript
// OLD
import { AuthProvider } from "@/lib/auth-context";

// NEW
import { AuthProvider } from "@/lib/auth-context-supabase";
```

## Troubleshooting

### "Supabase credentials not found"
- Check `.env` file exists in project root
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- Restart dev server after updating .env

### "Failed to connect to Supabase"
- Verify internet connection
- Check SUPABASE_URL is correct (no typos)
- Ensure project is not paused in Supabase dashboard

### "OpenAI API key missing"
- Add OPENAI_API_KEY to .env
- Practice plan generation will use mocks without it
- This is OK for development/testing

### "RLS policy violation"
- Go to Supabase **Authentication** → check user is created
- Verify RLS policies are set up correctly
- Temporarily disable RLS for debugging (NOT for production)

## Next Steps

1. ✅ Set up Supabase
2. Create admin user for testing
3. Test auth flow (signup/login)
4. Test piece creation via frontend
5. Test practice plan generation
6. Deploy to production

## Production Checklist

- [ ] Set stronger database password
- [ ] Enable 2FA for Supabase account
- [ ] Configure RLS policies for all tables
- [ ] Set up backups
- [ ] Use service role key ONLY in backend (never expose)
- [ ] Rotate API keys regularly
- [ ] Monitor usage limits
- [ ] Set up error logging/monitoring
