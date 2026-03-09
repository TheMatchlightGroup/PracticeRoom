# Pedagogy Intelligence Engine - Database Schema

## Overview
This document outlines all tables required for the Pedagogy Intelligence Engine, including new tables and modifications to existing ones.

## New Tables

### PRACTICE_LOGS
Tracks student practice sessions for adaptive intensity recommendations.

```sql
CREATE TABLE practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_minutes INTEGER NOT NULL,
  fatigue_rating INTEGER NOT NULL CHECK (fatigue_rating >= 1 AND fatigue_rating <= 5),
  vocal_stability_rating INTEGER NOT NULL CHECK (vocal_stability_rating >= 1 AND vocal_stability_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index for fast retrieval of recent logs
CREATE INDEX idx_practice_logs_user_date ON practice_logs(user_id, date DESC);
```

**Row Level Security:**
```sql
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own practice logs"
  ON practice_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice logs"
  ON practice_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### INSTRUMENT_LIBRARY
Defines instrument-specific practice parameters and module distribution.

```sql
CREATE TABLE instrument_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_name VARCHAR(100) NOT NULL UNIQUE,
  default_daily_minutes INTEGER NOT NULL DEFAULT 60,
  warmup_ratio NUMERIC(3,2) NOT NULL DEFAULT 0.30,
  technique_ratio NUMERIC(3,2) NOT NULL DEFAULT 0.40,
  repertoire_ratio NUMERIC(3,2) NOT NULL DEFAULT 0.20,
  memorization_ratio NUMERIC(3,2) NOT NULL DEFAULT 0.10,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Default Data (system-maintained):**
```sql
INSERT INTO instrument_library (instrument_name, default_daily_minutes, warmup_ratio, technique_ratio, repertoire_ratio, memorization_ratio, description)
VALUES
  ('Voice', 60, 0.30, 0.40, 0.20, 0.10, 'Vocal training (singing) configuration'),
  ('Piano', 75, 0.25, 0.50, 0.20, 0.05, 'Piano practice configuration'),
  ('Violin', 60, 0.25, 0.45, 0.25, 0.05, 'Violin practice configuration'),
  ('Cello', 60, 0.25, 0.45, 0.25, 0.05, 'Cello practice configuration');
```

---

### PERFORMANCE_LOGS
Records performance simulation attempts and actual performance data.

```sql
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  piece_id UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success_rating NUMERIC(3,2) CHECK (success_rating >= 0 AND success_rating <= 5),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance tracking
CREATE INDEX idx_performance_logs_user_piece ON performance_logs(user_id, piece_id);
CREATE INDEX idx_performance_logs_date ON performance_logs(date DESC);
```

**Row Level Security:**
```sql
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance logs"
  ON performance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance logs"
  ON performance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Modified Tables

### PIECES
Added analysis fields for structured musical demand scoring.

```sql
-- Add analysis_json column (if not exists)
ALTER TABLE pieces ADD COLUMN analysis_json JSONB DEFAULT NULL;

-- Add musical scores for cached analysis
ALTER TABLE pieces ADD COLUMN range_span_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN tessitura_pressure_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN breath_length_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN agility_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN dynamic_control_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN registration_transition_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN repetition_density_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN stylistic_period VARCHAR(50);
```

**Analysis JSON Structure:**
```json
{
  "range_span_score": 6.5,
  "tessitura_pressure_score": 7.0,
  "breath_length_score": 8.0,
  "agility_score": 5.0,
  "dynamic_control_score": 6.0,
  "registration_transition_score": 5.0,
  "repetition_density_score": 4.5,
  "stylistic_period": "Romantic"
}
```

---

### PRACTICE_PLANS
Added teacher override system and technique tracking.

```sql
-- Add teacher override columns
ALTER TABLE practice_plans ADD COLUMN is_teacher_modified BOOLEAN DEFAULT FALSE;
ALTER TABLE practice_plans ADD COLUMN teacher_id UUID REFERENCES auth.users(id);
ALTER TABLE practice_plans ADD COLUMN teacher_notes TEXT;

-- Add technique tracking
ALTER TABLE practice_plans ADD COLUMN recommended_techniques JSONB;
ALTER TABLE practice_plans ADD COLUMN musical_demand_scores JSONB;

-- Track plan version for rollback capability
ALTER TABLE practice_plans ADD COLUMN plan_version INTEGER DEFAULT 1;
ALTER TABLE practice_plans ADD COLUMN parent_plan_id UUID REFERENCES practice_plans(id);
```

**Example Recommended Techniques JSON:**
```json
{
  "categories": [
    {
      "categoryId": "lamperti-breath",
      "categoryName": "Breath Support & Appoggio",
      "school": "Lamperti",
      "description": "Exercises for sustainable breath management",
      "reason": "High breath demand (8.5/10)"
    }
  ],
  "adjustedDailyMinutes": 55,
  "warmupRatioPriority": "high",
  "focusAreas": ["Breath control", "Phrase endurance"]
}
```

---

### TECHNIQUE_MODULES
No schema changes, but ensure index on system modules.

```sql
-- Ensure system modules are queryable
CREATE INDEX idx_technique_modules_system ON technique_modules(created_by_user_id) WHERE created_by_user_id IS NULL;
CREATE INDEX idx_technique_modules_category ON technique_modules(category);
```

---

### STUDENT_PROFILES
No new fields, but ensure instrument tracking.

```sql
-- Verify instrument field exists
-- student_profiles should have: instrument VARCHAR(100) DEFAULT 'Voice'
```

---

## View: Recent Practice Analytics
Helpful for analytics queries.

```sql
CREATE OR REPLACE VIEW recent_practice_analytics AS
SELECT 
  pl.user_id,
  DATE(pl.date) as practice_date,
  COUNT(*) as session_count,
  SUM(pl.total_minutes) as total_minutes,
  AVG(pl.fatigue_rating)::NUMERIC(3,2) as avg_fatigue,
  AVG(pl.vocal_stability_rating)::NUMERIC(3,2) as avg_stability
FROM practice_logs pl
WHERE pl.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY pl.user_id, DATE(pl.date)
ORDER BY pl.user_id, practice_date DESC;
```

---

## Migration Steps

1. **Create new tables:**
   ```bash
   -- In Supabase SQL editor, run table creation scripts above
   ```

2. **Add columns to existing tables:**
   ```bash
   -- Pieces table analysis fields
   -- Practice plans table teacher override fields
   ```

3. **Enable RLS on new tables:**
   ```bash
   -- Run RLS policies above
   ```

4. **Create indexes for performance:**
   ```bash
   -- Run index creation scripts
   ```

5. **Populate INSTRUMENT_LIBRARY:**
   ```bash
   -- Run insert script with default instruments
   ```

---

## TypeScript Type Definitions

Located in `shared/api.ts`:

```typescript
export interface MusicalDemandScores {
  range_span_score: number;
  tessitura_pressure_score: number;
  breath_length_score: number;
  agility_score: number;
  dynamic_control_score: number;
  registration_transition_score: number;
  repetition_density_score: number;
  stylistic_period: string;
}

export interface PracticeLog {
  id: string;
  user_id: string;
  date: string;
  total_minutes: number;
  fatigue_rating: number;
  vocal_stability_rating: number;
  notes?: string;
  created_at: string;
}

export interface PerformanceLog {
  id: string;
  user_id: string;
  piece_id: string;
  date: string;
  success_rating?: number;
  notes?: string;
  recorded_at?: string;
  created_at: string;
}

export interface InstrumentConfig {
  instrument_name: string;
  default_daily_minutes: number;
  warmup_ratio: number;
  technique_ratio: number;
  repertoire_ratio: number;
  memorization_ratio: number;
}
```

---

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE` for consistency
- UUID primary keys for all tables
- RLS enabled on all user-data tables
- Indexes created on frequently-queried columns
- JSONB columns allow flexible schema evolution
- Soft deletes not implemented (use ON DELETE CASCADE for hard deletes)
- No triggers required at database level (validation at application layer)
