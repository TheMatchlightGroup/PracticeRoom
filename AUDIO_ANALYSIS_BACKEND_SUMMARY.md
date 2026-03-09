# Audio Analysis Backend - Implementation Complete

## Overview

The backend infrastructure for audio pitch stability detection is now fully implemented. All components for receiving, validating, storing, and querying audio analysis data are ready for use.

---

## What Was Implemented

### 1. **Supabase Database Migration** ✅
**File**: `supabase/migrations/20250225_create_audio_analysis_logs.sql`

Creates the `audio_analysis_logs` table with:
- **Columns**: id, user_id, piece_id, created_at, duration_seconds, sample_rate, analysis_version, target_pitch_midi, metrics_json, contour_json, notes
- **Constraints**: Valid JSONB, non-negative values, foreign key constraints
- **Indexes**: Optimized for user queries and time-based filtering
- **RLS Policies**: Users can only access/modify their own records; records are immutable after creation

**Status**: Ready to deploy to Supabase

### 2. **Plan Guard Middleware** ✅
**File**: `server/middleware/planGuard.ts`

Added new middleware:
- `checkAnalysisQuota()` - Enforces monthly analysis call quota (like `checkAiQuota`)
- `recordAnalysisUsage()` - Helper to increment usage_logs.analysis_calls

Extended Express Request type with:
- `usageAnalysisCalls` - Current month's analysis calls used
- `usageAnalysisLimit` - User's plan limit

**Plan Capabilities** (from `planCapabilities.ts`):
```
student_beginner:     pitchAnalyticsEnabled: false,  analysisCallsPerMonth: 10
student_intermediate: pitchAnalyticsEnabled: true,   analysisCallsPerMonth: 50
student_advanced:     pitchAnalyticsEnabled: true,   analysisCallsPerMonth: 500
teacher_studio:       pitchAnalyticsEnabled: true,   analysisCallsPerMonth: 100
teacher_pro:          pitchAnalyticsEnabled: true,   analysisCallsPerMonth: 500
teacher_elite:        pitchAnalyticsEnabled: true,   analysisCallsPerMonth: 2000
```

### 3. **Express API Routes** ✅
**File**: `server/routes/audio-analysis.ts`

Three endpoints implemented:

#### **POST /api/audio-analysis** (Store Analysis)
- **Auth**: Required (verifyAuth + requireStudent)
- **Capabilities**: Requires `pitchAnalyticsEnabled` + `analysisCallsPerMonth` quota
- **Validation**: 
  - Contour max 200 points
  - Metrics schema validation (voiced_ratio 0-1, confidence 0-1, etc.)
  - Sample rate minimum 8000 Hz
- **Response**: `{ id, created_at, metrics, contour }`
- **Errors**:
  - 400: Invalid data
  - 401: Not authenticated
  - 402: Subscription required or quota exceeded
  - 403: Feature not enabled for plan

#### **GET /api/audio-analysis** (List Analyses)
- **Auth**: Required (verifyAuth + requireStudent)
- **Query Params**: limit (max 100), offset, piece_id (optional filter)
- **Response**: `{ data: AudioAnalysisLog[], total: number, limit, offset }`
- **Performance**: Uses indexed queries on user_id + created_at

#### **GET /api/audio-analysis/summary** (Analytics Summary)
- **Auth**: Required (verifyAuth + requireStudent)
- **Query Params**: period ('7d' or '30d', default '30d')
- **Response**: `{ avg_instability_score, avg_voiced_ratio, avg_drift, total_recordings, best_score, worst_score, period }`
- **Calculations**: Aggregates metrics across time period

### 4. **Type System** ✅
**File**: `shared/audio-types.ts` (already created in previous phase)

Types used in routes:
- `AudioAnalysisMetrics` - Core metrics object
- `ContourPoint` - Single pitch measurement (time, midi, cents, confidence)
- `AudioAnalysisLog` - Database record
- `AudioAnalysisResponse` - API response
- `AudioAnalysisSummary` - Analytics summary
- Constants: `MAX_CONTOUR_POINTS = 200`

### 5. **Route Registration** ✅
**File**: `server/index.ts`

Added:
```typescript
import audioAnalysisRouter from "./routes/audio-analysis";
app.use("/api/audio-analysis", audioAnalysisRouter);
```

### 6. **Test Harness & Documentation** ✅
**File**: `AUDIO_ANALYSIS_TEST_HARNESS.md`

Comprehensive guide including:
- cURL examples for all 3 endpoints
- Real audio metrics data (e.g., sustained C4 with vibrato)
- Validation error cases
- Plan capability matrix
- Testing workflow
- Database schema reference

---

## Request/Response Examples

### POST - Store Analysis
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
      "drift_cents_per_sec": -0.5,
      "instability_score_0_100": 78.5,
      "mode": "sustained_note"
    },
    "contour": [
      { "t": 0.0, "midi": 59.8, "cents": -20.5, "conf": 0.95 },
      { "t": 0.5, "midi": 60.1, "cents": 5.2, "conf": 0.94 }
    ]
  }'
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-02-25T12:30:45.123Z",
  "metrics": { ... },
  "contour": [ ... ]
}
```

### GET - List with Summary
```bash
curl -X GET "http://localhost:3000/api/audio-analysis/summary?period=30d" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response** (200 OK):
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

## Validation Rules

### Metrics Schema
```typescript
{
  voiced_ratio: number (0-1),              // Fraction of voiced frames
  mean_midi: number,                       // Average MIDI note
  std_midi: number,                        // Variability
  mean_cents_abs?: number,                 // Absolute deviation from target
  std_cents?: number,                      // Deviation variability
  drift_cents_per_sec: number,             // Linear pitch drift
  instability_score_0_100: number (0-100), // Stability rating
  mode: "sustained_note" | "phrase" | "messa_di_voce",
  jitter_cents?: number                    // Additional metric
}
```

### Contour Points
```typescript
{
  t: number (≥0),          // Time in seconds
  midi: number | null,     // MIDI note or null if unvoiced
  cents: number | null,    // Cents deviation or null
  conf: number (0-1)       // Confidence score
}
```

### Constraints
- `contour.length ≤ 200 points`
- `duration_seconds > 0`
- `sample_rate ≥ 8000 Hz`
- `metrics.voiced_ratio ∈ [0, 1]`
- `metrics.instability_score_0_100 ∈ [0, 100]`

---

## Error Handling

| Status | Code | Meaning |
|--------|------|---------|
| 400 | Bad Request | Invalid data (validation failed) |
| 401 | Unauthorized | Missing/invalid auth token |
| 402 | Payment Required | No subscription or quota exceeded |
| 403 | Forbidden | Feature not enabled for plan |
| 500 | Server Error | Database or processing error |

**Example Error Response** (402 - Quota Exceeded):
```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "You have exceeded your analysis call quota (50/month)",
  "used": 50,
  "limit": 50
}
```

---

## Usage Tracking

When a user successfully uploads an audio analysis:
1. `checkAnalysisQuota()` middleware verifies quota ✅
2. API stores record in `audio_analysis_logs` ✅
3. `recordAnalysisUsage()` increments `usage_logs.analysis_calls` ✅
4. Next request's `checkAnalysisQuota()` sees updated count ✅

Monthly quota resets on the 1st of each month based on `YYYY-MM` key.

---

## Database Operations

### Insert (POST)
```sql
INSERT INTO audio_analysis_logs (user_id, piece_id, duration_seconds, ...)
VALUES ($1, $2, $3, ...)
RETURNING id, created_at;
```

### Query (GET)
```sql
SELECT * FROM audio_analysis_logs
WHERE user_id = $1
  AND (piece_id = $2 OR $2 IS NULL)
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

### Analytics (GET /summary)
```sql
SELECT metrics_json FROM audio_analysis_logs
WHERE user_id = $1 AND created_at >= $2
ORDER BY created_at DESC;
-- Aggregate: avg, min, max of metrics_json fields
```

---

## Dependencies

### Required for Build
- `stripe` package (for subscription.ts import in server/index.ts)
  - Install: `npm install stripe --save`

### Database
- Supabase account with auth and database enabled
- Migration applied to create tables and RLS policies

### Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## Next Steps

### 1. **Deploy Migration to Supabase**
```bash
# Using Supabase CLI:
supabase migrations up

# Or manually execute the SQL in Supabase dashboard
```

### 2. **Test the API**
Use the test harness document:
- Test POST with sample data
- Verify quota enforcement
- Test filtering and analytics

### 3. **Implement Pitch Analysis** (client-side)
`client/lib/audio/pitchAnalysis.ts`:
- Decode audio blob to AudioBuffer
- Frame-by-frame pitch detection (2048 samples, 512 hop)
- MIDI and cents conversion
- Contour downsampling to 200 points

### 4. **Create Recording Component** (client-side)
`client/pages/AudioCheck.tsx`:
- MediaRecorder UI
- Mode selection (sustained note, phrase, messa di voce)
- Target pitch input
- Piece selection
- Recording/play/analyze controls

### 5. **Integrate with Practice Plans** (backend)
`server/routes/practice-plan.ts`:
- Flag if `instability_score < 60` or `voiced_ratio < 0.75`
- Suggest exercises to improve pitch stability
- Generate remedial practice modules

---

## Files Created/Modified

### New Files
- `supabase/migrations/20250225_create_audio_analysis_logs.sql` (60 lines)
- `server/routes/audio-analysis.ts` (381 lines)
- `AUDIO_ANALYSIS_TEST_HARNESS.md` (377 lines)
- `AUDIO_ANALYSIS_BACKEND_SUMMARY.md` (this file)

### Modified Files
- `server/middleware/planGuard.ts` (+96 lines - added checkAnalysisQuota, recordAnalysisUsage)
- `server/index.ts` (+2 lines - imported and registered audio-analysis router)

### Already Existed
- `shared/audio-types.ts` (190 lines - full type system)
- `server/config/planCapabilities.ts` (already had pitchAnalyticsEnabled & analysisCallsPerMonth)

---

## Code Quality

✅ **TypeScript**: Fully typed, no `any` unless necessary  
✅ **Validation**: Input validation on metrics and contour  
✅ **Error Handling**: Structured error responses with codes  
✅ **Security**: RLS policies, auth middleware, capability checks  
✅ **Performance**: Indexed queries, pagination support  
✅ **Documentation**: Comprehensive test harness and examples  

---

## Testing Checklist

Before proceeding to UI implementation:

- [ ] Supabase migration deployed
- [ ] Stripe package installed (`npm install`)
- [ ] npm build succeeds (client + server)
- [ ] POST /api/audio-analysis accepts valid data
- [ ] Quota enforcement blocks request at limit
- [ ] GET /api/audio-analysis returns paginated results
- [ ] GET /api/audio-analysis/summary aggregates correctly
- [ ] Validation rejects invalid contour (>200 points)
- [ ] Validation rejects invalid metrics
- [ ] Auth token required (401 without token)
- [ ] Student role required (401 for non-students)

---

## Architecture Notes

The audio analysis system follows the established VocalStudy patterns:

1. **Middleware Layer**: Auth → Subscription → Capability → Quota
2. **Validation Layer**: Request validation before database write
3. **Usage Tracking**: Incremental counters in USAGE_LOGS
4. **RLS Enforcement**: Database policies for user isolation
5. **Error Codes**: Structured responses with action hints

No breaking changes to existing routes or types. All audio analysis is additive to the existing system.
