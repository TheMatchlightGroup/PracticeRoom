# Audio Analysis Database Schema

## AUDIO_ANALYSIS_LOGS Table

Stores pitch analysis results from student vocal recordings.

```sql
CREATE TABLE audio_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  piece_id UUID REFERENCES pieces(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds NUMERIC NOT NULL,
  sample_rate INTEGER NOT NULL,
  analysis_version TEXT DEFAULT 'v1',
  target_pitch_midi NUMERIC,
  metrics_json JSONB NOT NULL,
  contour_json JSONB NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_audio_analysis_logs_user_id ON audio_analysis_logs(user_id);
CREATE INDEX idx_audio_analysis_logs_user_created ON audio_analysis_logs(user_id, created_at DESC);
CREATE INDEX idx_audio_analysis_logs_piece_id ON audio_analysis_logs(piece_id);
CREATE INDEX idx_audio_analysis_logs_created ON audio_analysis_logs(created_at DESC);
```

## Column Descriptions

- **id**: Unique identifier
- **user_id**: Recording student (required)
- **piece_id**: Associated piece (nullable, for context)
- **created_at**: When recording was analyzed
- **duration_seconds**: Recording length
- **sample_rate**: Audio sample rate (typically 44100 or 48000)
- **analysis_version**: Algorithm version (allows updates)
- **target_pitch_midi**: Optional target note for cents deviation
- **metrics_json**: Stability metrics (see below)
- **contour_json**: Downsampled pitch contour points
- **notes**: Optional user notes
- **updated_at**: Last modification

## Metrics JSON Schema

```json
{
  "voiced_ratio": 0.92,
  "mean_midi": 65.0,
  "std_midi": 0.4,
  "mean_cents_abs": 12.5,
  "std_cents": 8.2,
  "drift_cents_per_sec": -0.3,
  "instability_score_0_100": 78.5,
  "mode": "sustained_note",
  "jitter_cents": 8.2
}
```

### Metrics Definitions

- **voiced_ratio**: Fraction of frames with detected pitch (0-1)
- **mean_midi**: Average pitch in MIDI note number
- **std_midi**: Standard deviation of MIDI notes
- **mean_cents_abs**: Average absolute cents deviation from target
- **std_cents**: Standard deviation of cents
- **drift_cents_per_sec**: Pitch drift rate (linear regression slope)
- **instability_score_0_100**: Stability rating (0=very unstable, 100=very stable)
- **mode**: Recording mode ("sustained_note", "phrase", "messa_di_voce")
- **jitter_cents**: Converted from std_midi if no target

## Contour JSON Schema

Array of pitch frames (downsampled to max 200 points):

```json
[
  {
    "t": 0.0,
    "midi": 65.2,
    "cents": 12.5,
    "conf": 0.95
  },
  {
    "t": 0.128,
    "midi": 65.15,
    "cents": 10.2,
    "conf": 0.93
  }
]
```

### Point Fields

- **t**: Time in seconds from start
- **midi**: MIDI note number (null if unvoiced)
- **cents**: Cents deviation from target (null if no target or unvoiced)
- **conf**: Pitch detection confidence (0-1)

## Row Level Security

```sql
ALTER TABLE audio_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Users can view and insert their own logs
CREATE POLICY "Users can view own audio logs"
  ON audio_analysis_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio logs"
  ON audio_analysis_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio logs"
  ON audio_analysis_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio logs"
  ON audio_analysis_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Teachers can view assigned students' logs (future enhancement)
-- CREATE POLICY "Teachers can view assigned student logs"
--   ON audio_analysis_logs FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM student_profiles
--       WHERE student_profiles.user_id = audio_analysis_logs.user_id
--       AND student_profiles.teacher_id = auth.uid()
--     )
--   );
```

## Migration Script

Run in Supabase SQL Editor:

```sql
-- Create table
CREATE TABLE IF NOT EXISTS audio_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  piece_id UUID REFERENCES pieces(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds NUMERIC NOT NULL,
  sample_rate INTEGER NOT NULL,
  analysis_version TEXT DEFAULT 'v1',
  target_pitch_midi NUMERIC,
  metrics_json JSONB NOT NULL,
  contour_json JSONB NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audio_analysis_logs_user_id ON audio_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_logs_user_created ON audio_analysis_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_logs_piece_id ON audio_analysis_logs(piece_id);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_logs_created ON audio_analysis_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audio_analysis_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own audio logs"
  ON audio_analysis_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio logs"
  ON audio_analysis_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio logs"
  ON audio_analysis_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio logs"
  ON audio_analysis_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Verify
SELECT count(*) FROM audio_analysis_logs;
```

## TypeScript Types

```typescript
export interface AudioAnalysisMetrics {
  voiced_ratio: number;
  mean_midi: number;
  std_midi: number;
  mean_cents_abs?: number;
  std_cents?: number;
  drift_cents_per_sec: number;
  instability_score_0_100: number;
  mode: "sustained_note" | "phrase" | "messa_di_voce";
  jitter_cents?: number;
}

export interface ContourPoint {
  t: number;
  midi: number | null;
  cents: number | null;
  conf: number;
}

export interface AudioAnalysisLog {
  id: string;
  user_id: string;
  piece_id?: string;
  created_at: string;
  duration_seconds: number;
  sample_rate: number;
  analysis_version: string;
  target_pitch_midi?: number;
  metrics_json: AudioAnalysisMetrics;
  contour_json: ContourPoint[];
  notes?: string;
}
```

## Capacity Planning

For 1000 daily active users, 5 recordings per user per month:
- Monthly records: ~5,000
- Average record size: ~15 KB (metrics + downsampled contour)
- Monthly storage: ~75 MB
- Yearly storage: ~900 MB

No concerns for Supabase limits.

## Future Enhancements

- [ ] Add `recording_mode_metadata` JSONB for detailed settings
- [ ] Add `teacher_feedback` JSONB for instructor comments (plan-gated)
- [ ] Add `ai_insights` JSONB for AI-generated recommendations
- [ ] Archive old records to cold storage after 1 year
- [ ] Add `comparison_with_previous` for trend detection

---

**Status**: Ready for production

**Version**: 1.0

**Last Updated**: February 25, 2025
