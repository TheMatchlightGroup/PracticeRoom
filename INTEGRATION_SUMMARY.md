# PracticeRoom.io - Supabase & OpenAI Integration Summary

## What's Been Implemented

### ✅ Environment Setup
- `.env.example` - Template for backend environment variables
- Support for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- Support for `OPENAI_API_KEY`
- Frontend Vite environment variables (`VITE_*`)

### ✅ Backend Infrastructure

#### Supabase Admin Client (`server/lib/supabaseAdmin.ts`)
- Service role authenticated client for backend operations
- User session verification
- Role checking utilities (isTeacher, isStudent, getUserRole)
- Only uses SUPABASE_SERVICE_ROLE_KEY (never exposed to frontend)

#### Frontend Supabase Client (`client/lib/supabaseClient.ts`)
- Anon key authenticated client
- Authentication functions: signUp, signIn, signOut
- Session and user management
- Auth state listeners

#### Auth Middleware (`server/lib/auth-middleware.ts`)
- JWT token verification from Supabase
- User attachment to Express requests
- Role-based access control (requireTeacher, requireStudent)
- Data ownership verification

### ✅ API Routes

#### Pieces Management (`server/routes/pieces.ts`)
- POST `/api/pieces` - Create new piece
- GET `/api/pieces` - List user's pieces
- GET `/api/pieces/:id` - Get piece with analysis
- PUT `/api/pieces/:id` - Update piece
- DELETE `/api/pieces/:id` - Delete piece

#### Practice Plan Generation (`server/routes/practice-plan.ts`)
- POST `/api/practice-plan/generate` - Generate AI practice plan
- GET `/api/practice-plan/:pieceId` - Get latest plan for piece
- GET `/api/practice-plan` - List all practice plans
- Uses OpenAI integration for intelligent generation
- Falls back to mocks if API key missing

#### Memorization (`server/routes/memorization.ts`)
- POST `/api/memorization/cards` - Create memorization card
- GET `/api/memorization/cards/due` - Get due cards
- GET `/api/memorization/cards/piece/:pieceId` - Get piece cards
- POST `/api/memorization/review` - Submit review with SM-2 calculation
- GET `/api/memorization/stats/:pieceId` - Get memorization stats
- SM-2 algorithm implementation for spacing

#### File Uploads (`server/routes/upload.ts`)
- POST `/api/upload/score` - Upload score file to Supabase Storage
- DELETE `/api/upload/score/:path` - Delete uploaded file
- Supports PDF, MusicXML, MIDI
- 10MB file size limit
- User ownership verification

### ✅ Intelligence Integration

#### OpenAI Integration (`server/lib/openai.ts`)
- GPT-4 powered practice plan generation
- Conservatory-level vocal pedagogy prompting
- Structured 7-day practice plan JSON output
- Mock fallback for testing without API key
- Supports Vaccai, Lamperti, Garcia, Bel Canto methods

#### SM-2 Algorithm (`server/lib/sm2Algorithm.ts`)
- Full SM-2 spaced repetition implementation
- Confidence-based scheduling (0-5 scale)
- Easiness factor tracking (1.3 - 2.5 range)
- Repetition counting
- Mastery progress calculation
- Debug statistics function

### ✅ Frontend Auth Context

#### Supabase Auth Context (`client/lib/auth-context-supabase.tsx`)
- Replace old mock context with Supabase-backed auth
- Real user session management
- Profile loading (student/teacher)
- Automatic role-specific data fetching
- getAuthToken() for API requests
- Identical API to old context (drop-in replacement)

#### API Helper (`client/lib/api.ts`)
- Authenticated API request wrapper
- Automatic JWT token attachment
- Helper functions: apiGet, apiPost, apiPut, apiDelete
- File upload with authentication
- Error handling

## File Structure

```
server/
├── lib/
│   ├── supabaseAdmin.ts      # Backend Supabase client
│   ├── auth-middleware.ts    # Express auth middleware
│   ├── openai.ts             # OpenAI integration
│   └── sm2Algorithm.ts       # Spaced repetition logic
├── routes/
│   ├── pieces.ts             # Piece CRUD operations
│   ├── practice-plan.ts      # Practice generation
│   ├── memorization.ts       # Spaced repetition
│   └── upload.ts             # File uploads
└── index.ts                  # Updated with new routes

client/
├── lib/
│   ├── supabaseClient.ts          # Frontend Supabase client
│   ├── auth-context-supabase.tsx  # NEW: Supabase-backed auth
│   └── api.ts                     # NEW: Authenticated API helper
└── [existing pages & components]
```

## Installation Steps

### 1. Install Dependencies
```bash
pnpm install @supabase/supabase-js openai dotenv multer
pnpm install -D @types/multer
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
SUPABASE_ANON_KEY=eyJh...
OPENAI_API_KEY=sk-...
```

Create `.env.local` for frontend:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

### 3. Create Supabase Tables
See `SUPABASE_SETUP.md` for full SQL schema

### 4. Update Frontend Auth Context
In `client/App.tsx`:
```typescript
// Replace this:
import { AuthProvider } from "@/lib/auth-context";

// With this:
import { AuthProvider } from "@/lib/auth-context-supabase";
```

The API is identical, so no component changes needed.

### 5. Test Connection
```bash
pnpm dev
```

Check console logs:
- ✅ Supabase configured
- ✅ OpenAI API configured

## API Usage Examples

### From Frontend (Using Auth Context)

```typescript
import { useAuth } from "@/lib/auth-context-supabase";
import { apiPost, apiGet } from "@/lib/api";

export function MyComponent() {
  const { user, getAuthToken } = useAuth();
  
  const createPiece = async () => {
    const response = await apiPost("/api/pieces", {
      title: "La Traviata",
      composer: "Verdi",
      difficulty: "Advanced"
    });
    
    if (response.success) {
      console.log("Piece created:", response.data);
    }
  };
  
  const generatePlan = async (pieceId: string) => {
    const response = await apiPost("/api/practice-plan/generate", {
      pieceId
    });
    
    if (response.success) {
      console.log("Plan generated:", response.data.plan);
    }
  };
  
  return <button onClick={createPiece}>Create Piece</button>;
}
```

### Memorization Review

```typescript
const submitReview = async (cardId: string, confidence: number) => {
  const response = await apiPost("/api/memorization/review", {
    cardId,
    confidenceScore: confidence // 0-5
  });
  
  if (response.success) {
    const { stats } = response.data;
    console.log("Mastery:", stats.masteryProgress + "%");
    console.log("Next review:", stats.daysUntilReview + " days");
  }
};
```

## Mocking & Fallbacks

### No OpenAI Key
- Practice plan generation returns mock 7-day plan
- Uses conservatory-standard template
- Good for development/testing

### No Supabase
- All database operations will fail with clear errors
- Check console logs for troubleshooting
- Set credentials in `.env` to continue

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to git
- Service role key ONLY used in Express backend
- Anon key is safe to expose on frontend
- All backend routes verify JWT tokens
- RLS policies protect database from unauthorized access
- Users can only access their own data

## Database Schema

All tables created with:
- Primary keys (UUID)
- Timestamps (created_at, updated_at)
- Foreign keys with ON DELETE CASCADE
- Indexes for performance
- Row Level Security enabled

See `SUPABASE_SETUP.md` for full schema details.

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Run database schema SQL
3. ✅ Configure .env files
4. ✅ Install dependencies
5. ✅ Update auth context
6. **Test authentication flow**
7. **Test piece creation**
8. **Test practice plan generation**
9. **Deploy to production**

## Troubleshooting

### "Supabase credentials not found"
- Ensure `.env` exists with proper values
- Restart dev server

### "OpenAI API error"
- Check `OPENAI_API_KEY` in `.env`
- Will fallback to mocks automatically
- Check API key has credits

### "JWT verification failed"
- Ensure token is being sent in Authorization header
- Token might be expired - user needs to re-login

### "RLS policy violation"
- User not authenticated or doesn't own the data
- Check Supabase auth logs
- Verify RLS policies are set up

## Performance Considerations

- Memorization cards use index on user_id for fast queries
- Practice plans cached as JSON blobs
- File uploads stored in Supabase Storage (scalable)
- SM-2 calculations done in backend (reduces client load)

## Future Enhancements

- Real-time messaging with Supabase subscriptions
- Advanced teacher-student relationships
- Studio management features
- Payment processing for bookings
- Music theory AI analysis
- Audio recording uploads
