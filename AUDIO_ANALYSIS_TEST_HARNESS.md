# Audio Analysis API Test Harness

This document provides test examples for verifying the audio analysis backend implementation.

## Prerequisites

1. **Supabase Migration**: Run the migration to create `audio_analysis_logs` table:
   ```bash
   npm run db:migrate
   # or manually execute: supabase/migrations/20250225_create_audio_analysis_logs.sql
   ```

2. **Valid Auth Token**: You need a valid Supabase JWT from an authenticated user
   ```bash
   # Get from client-side or your auth mechanism
   AUTH_TOKEN="your-supabase-jwt-token-here"
   ```

3. **Base URL**:
   ```bash
   BASE_URL="http://localhost:3000" # or your deployment URL
   ```

## Endpoints Overview

| Method | Endpoint | Auth | Capability | Quota | Description |
|--------|----------|------|-----------|-------|-------------|
| POST | `/api/audio-analysis` | Yes | `pitchAnalyticsEnabled` | `analysisCallsPerMonth` | Store audio analysis result |
| GET | `/api/audio-analysis` | Yes | None | None | List user's audio analyses |
| GET | `/api/audio-analysis/summary` | Yes | None | None | Get 7d/30d analytics summary |

## Test Case 1: POST - Store Audio Analysis

**Endpoint**: `POST /api/audio-analysis`

**Required Headers**:
```
Authorization: Bearer {AUTH_TOKEN}
Content-Type: application/json
```

**Request Body** (Example with realistic sustained note):
```json
{
  "piece_id": null,
  "duration_seconds": 8.5,
  "sample_rate": 44100,
  "target_pitch_midi": 60,
  "metrics": {
    "voiced_ratio": 0.92,
    "mean_midi": 60.15,
    "std_midi": 0.35,
    "mean_cents_abs": 10.5,
    "std_cents": 5.2,
    "drift_cents_per_sec": -0.5,
    "instability_score_0_100": 78.5,
    "mode": "sustained_note",
    "jitter_cents": 5.2
  },
  "contour": [
    { "t": 0.0, "midi": 59.8, "cents": -20.5, "conf": 0.95 },
    { "t": 0.5, "midi": 60.1, "cents": 5.2, "conf": 0.94 },
    { "t": 1.0, "midi": 60.0, "cents": 0.0, "conf": 0.96 },
    { "t": 1.5, "midi": 60.2, "cents": 10.5, "conf": 0.93 },
    { "t": 2.0, "midi": 60.05, "cents": 2.8, "conf": 0.95 },
    { "t": 2.5, "midi": 59.95, "cents": -2.1, "conf": 0.94 },
    { "t": 3.0, "midi": 60.1, "cents": 5.2, "conf": 0.96 },
    { "t": 3.5, "midi": 60.0, "cents": 0.0, "conf": 0.95 },
    { "t": 4.0, "midi": 60.15, "cents": 7.9, "conf": 0.93 },
    { "t": 4.5, "midi": 60.05, "cents": 2.8, "conf": 0.94 },
    { "t": 5.0, "midi": 59.9, "cents": -5.3, "conf": 0.95 },
    { "t": 5.5, "midi": 60.08, "cents": 4.2, "conf": 0.96 },
    { "t": 6.0, "midi": 60.1, "cents": 5.2, "conf": 0.94 },
    { "t": 6.5, "midi": 60.0, "cents": 0.0, "conf": 0.95 },
    { "t": 7.0, "midi": 60.12, "cents": 6.3, "conf": 0.93 },
    { "t": 7.5, "midi": 60.05, "cents": 2.8, "conf": 0.94 },
    { "t": 8.0, "midi": 60.1, "cents": 5.2, "conf": 0.92 }
  ],
  "notes": "Test recording - sustained C4 with minor vibrato"
}
```

**cURL Command**:
```bash
curl -X POST http://localhost:3000/api/audio-analysis \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "piece_id": null,
    "duration_seconds": 8.5,
    "sample_rate": 44100,
    "target_pitch_midi": 60,
    "metrics": {
      "voiced_ratio": 0.92,
      "mean_midi": 60.15,
      "std_midi": 0.35,
      "mean_cents_abs": 10.5,
      "std_cents": 5.2,
      "drift_cents_per_sec": -0.5,
      "instability_score_0_100": 78.5,
      "mode": "sustained_note",
      "jitter_cents": 5.2
    },
    "contour": [
      { "t": 0.0, "midi": 59.8, "cents": -20.5, "conf": 0.95 },
      { "t": 0.5, "midi": 60.1, "cents": 5.2, "conf": 0.94 },
      { "t": 1.0, "midi": 60.0, "cents": 0.0, "conf": 0.96 }
    ],
    "notes": "Test recording"
  }'
```

**Expected Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-02-25T12:30:45.123Z",
  "metrics": { ... },
  "contour": [ ... ]
}
```

**Error Responses**:
- `400 Bad Request` - Invalid data (e.g., contour > 200 points, invalid metrics)
- `401 Unauthorized` - Missing or invalid auth token
- `402 Payment Required` - Subscription required or quota exceeded
- `403 Forbidden` - Feature not enabled for this plan

---

## Test Case 2: GET - List Audio Analyses

**Endpoint**: `GET /api/audio-analysis`

**Query Parameters**:
- `limit` - Max results (default 20, max 100)
- `offset` - Pagination offset (default 0)
- `piece_id` - Optional filter by piece UUID

**cURL Command** (No filter):
```bash
curl -X GET "http://localhost:3000/api/audio-analysis?limit=10&offset=0" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**cURL Command** (Filter by piece):
```bash
curl -X GET "http://localhost:3000/api/audio-analysis?piece_id=550e8400-e29b-41d4-a716-446655440001&limit=20" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "auth-user-id",
      "piece_id": null,
      "created_at": "2025-02-25T12:30:45.123Z",
      "duration_seconds": 8.5,
      "sample_rate": 44100,
      "analysis_version": "1.0.0",
      "target_pitch_midi": 60,
      "metrics_json": { ... },
      "contour_json": [ ... ],
      "notes": "Test recording"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

## Test Case 3: GET - Analytics Summary

**Endpoint**: `GET /api/audio-analysis/summary`

**Query Parameters**:
- `period` - Time range: `7d` or `30d` (default: `30d`)

**cURL Command** (30 days):
```bash
curl -X GET "http://localhost:3000/api/audio-analysis/summary?period=30d" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**cURL Command** (7 days):
```bash
curl -X GET "http://localhost:3000/api/audio-analysis/summary?period=7d" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "avg_instability_score": 78.5,
  "avg_voiced_ratio": 0.92,
  "avg_drift": 0.5,
  "total_recordings": 1,
  "best_score": 85.0,
  "worst_score": 65.0,
  "period": "30d"
}
```

---

## Test Case 4: Validation Tests

### 4a. Contour exceeds max points
```bash
curl -X POST http://localhost:3000/api/audio-analysis \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_seconds": 8.5,
    "sample_rate": 44100,
    "metrics": { ... },
    "contour": [/* 201 points */]
  }'
```
**Expected**: `400 Bad Request` - "contour must have max 200 points"

### 4b. Invalid voiced_ratio
```bash
curl -X POST http://localhost:3000/api/audio-analysis \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_seconds": 8.5,
    "sample_rate": 44100,
    "metrics": {
      "voiced_ratio": 1.5,
      "mean_midi": 60,
      "std_midi": 0.3,
      "drift_cents_per_sec": 0,
      "instability_score_0_100": 75,
      "mode": "sustained_note"
    },
    "contour": []
  }'
```
**Expected**: `400 Bad Request` - "metrics.voiced_ratio must be between 0 and 1"

### 4c. Missing auth token
```bash
curl -X GET http://localhost:3000/api/audio-analysis
```
**Expected**: `401 Unauthorized` - "Missing or invalid authorization header"

---

## Testing Workflow

### Step 1: Setup
```bash
# Set environment variables
export AUTH_TOKEN="your-jwt-token"
export BASE_URL="http://localhost:3000"
```

### Step 2: Create Sample Analysis
```bash
RESPONSE=$(curl -s -X POST $BASE_URL/api/audio-analysis \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-payload.json)

ANALYSIS_ID=$(echo $RESPONSE | jq -r '.id')
echo "Created analysis: $ANALYSIS_ID"
```

### Step 3: Retrieve and Verify
```bash
# List all
curl -s $BASE_URL/api/audio-analysis \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq .

# Get summary
curl -s "$BASE_URL/api/audio-analysis/summary?period=30d" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq .
```

---

## Plan Capability Requirements

The API enforces plan-based gating:

| Plan | `pitchAnalyticsEnabled` | `analysisCallsPerMonth` |
|------|------------------------|----------------------|
| `student_beginner` | ❌ false | 10 |
| `student_intermediate` | ✅ true | 50 |
| `student_advanced` | ✅ true | 500 |
| `teacher_studio` | ✅ true | 100 |
| `teacher_pro` | ✅ true | 500 |
| `teacher_elite` | ✅ true | 2000 |

**Upgrade Required Error** (402 / 403):
```json
{
  "code": "UPGRADE_REQUIRED",
  "message": "This feature requires student_intermediate or higher",
  "requiredCapability": "pitchAnalyticsEnabled"
}
```

---

## Database Schema (For Reference)

```sql
-- Table: public.audio_analysis_logs
-- Columns:
--   id (UUID, PK) - Unique identifier
--   user_id (UUID, FK) - Owner of the analysis
--   piece_id (UUID, FK, nullable) - Associated piece
--   created_at (TIMESTAMP TZ) - Analysis timestamp
--   duration_seconds (NUMERIC) - Recording duration
--   sample_rate (INTEGER) - Sample rate in Hz
--   analysis_version (TEXT) - API version (1.0.0)
--   target_pitch_midi (NUMERIC, nullable) - Target MIDI note if provided
--   metrics_json (JSONB) - Audio metrics (stability, voiced ratio, etc.)
--   contour_json (JSONB) - Pitch contour (time, midi, confidence points)
--   notes (TEXT, nullable) - User notes

-- RLS Policies:
--   - Users can only SELECT/INSERT/DELETE their own records
--   - Records are immutable after creation (UPDATE disabled)
```

---

## Troubleshooting

### "Feature not enabled for this plan"
- **Cause**: User's subscription plan doesn't have `pitchAnalyticsEnabled`
- **Fix**: Upgrade to `student_intermediate` or higher

### "You have exceeded your analysis call quota"
- **Cause**: Monthly quota exhausted
- **Fix**: Wait until next month or upgrade plan

### "Not authenticated or no subscription"
- **Cause**: User lacks active subscription
- **Fix**: User must have active/trialing subscription

### "Contour must have max 200 points"
- **Cause**: Too many pitch contour points sent
- **Fix**: Downsample contour before sending (implementation handles this)

### Supabase RLS errors
- **Cause**: Database RLS policies not applied
- **Fix**: Run migration: `supabase/migrations/20250225_create_audio_analysis_logs.sql`

---

## Performance Notes

- **Contour downsampling**: Max 200 points per recording (reduces storage and API response size)
- **Query optimization**: Indexes on `user_id`, `user_id + created_at`, `piece_id`, `created_at`
- **Soft validation**: Metrics schema is flexible JSONB, allowing future additions

---

## Next Steps

After verifying this backend:
1. Implement pitch analysis utility (`client/lib/audio/pitchAnalysis.ts`)
2. Create audio recording component (`client/pages/AudioCheck.tsx`)
3. Integrate UI with these API endpoints
4. Add pedagogy integration flag on practice plan generation
