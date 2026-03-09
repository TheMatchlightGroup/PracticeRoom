# Pedagogy Intelligence Engine - Implementation Guide

## Overview

This document provides a comprehensive guide to the Pedagogy Intelligence Engine upgrade for VocalStudy. The system implements a sophisticated pedagogy framework that combines:

- **Musical Demand Analysis**: Normalized scoring of piece characteristics (0-10 scale)
- **Technique Mapping**: Deterministic mapping to Old Italian School pedagogical methods
- **Dynamic Module Retrieval**: Intelligent combination of system and teacher-created modules
- **Adaptive Intensity**: Practice recommendations based on fatigue and vocal stability monitoring
- **Teacher Overrides**: Full control for instructor customization of generated plans
- **Performance Analytics**: Comprehensive tracking of student progress and performance

## Architecture Overview

### 1. Music Analysis Pipeline

```
Piece Metadata → analyzeMusicalDemands() → MusicalDemandScores
                   (musicAnalysisService.ts)
                   
- Range span scoring (0-10)
- Tessitura pressure analysis
- Breath length demands
- Agility complexity
- Dynamic range requirements
- Registration transition difficulty
- Stylistic period classification
```

**Key File**: `server/services/musicAnalysisService.ts`

**Features**:
- Heuristic-based scoring from piece metadata
- MIDI-based range and tessitura analysis
- Stylistic period detection from composer
- Future-ready for music21 microservice integration

### 2. Technique Mapping Matrix

```
MusicalDemandScores → mapMusicalDemandsToTechniques() → TechniqueRecommendation
  (techniqueMapping.ts)
  
Mapping Rules:
- breath_length_score > 7 → Lamperti appoggio
- agility_score > 6 → Vaccai progressive vocalises
- registration_transition_score > 5 → Garcia balanced onset
- dynamic_control_score > 6 → Messa di Voce
- tessitura_pressure_score high → reduce daily minutes
- range_span_score > 7 → range flexibility work
```

**Key File**: `server/lib/techniqueMapping.ts`

**Returns**:
- List of recommended technique categories
- Adjusted practice duration
- Warmup priority level
- Focus areas for the week

### 3. Dynamic Module Retrieval

```
TechniqueCategories → retrieveModulesForPracticePlan() → Combined Module List
  (moduleRetrievalService.ts)
  
Priority Order:
1. System modules (for pedagogical consistency)
2. Teacher-created modules (for customization)
3. Randomization within categories (for weekly variety)
```

**Key File**: `server/services/moduleRetrievalService.ts`

**Features**:
- Fetch system modules by category
- Fetch teacher-specific modules
- Combine with priority weighting
- Randomize for variety

### 4. Adaptive Intensity Engine

```
Recent Practice Logs → analyzePracticeTrends() → Adaptive Recommendations
  (practiceLogsService.ts)
  
Logic:
- Average fatigue > 4 → Reduce daily minutes by 20%
- Vocal stability < 3 → Increase warmup ratio
- Track 7-day rolling average
```

**Key File**: `server/services/practiceLogsService.ts`

**Data Tracked**:
- `total_minutes`: Duration of practice session
- `fatigue_rating`: 1-5 student self-assessment
- `vocal_stability_rating`: 1-5 vocal quality assessment

### 5. OpenAI Integration

```
TechniqueRecommendations → generatePracticePlan() → GeneratedPracticePlan JSON
  (openai.ts)
  
Prompt Structure:
- Musical demand scores (0-10 normalized)
- Recommended technique categories with rationale
- Student profile and goals
- Instrument-specific time allocation
- Constraints (max daily minutes, warmup ratios)
```

**Key Features**:
- Structured system prompt emphasizing Old Italian School
- Requirement for strict JSON output
- Fallback to mock plans if API unavailable
- Validation of plan structure

### 6. Teacher Override System

```
AI-Generated Plan → Teacher Modifications → Teacher-Approved Plan
  (teacherPlanOverrideService.ts)
  
Operations:
- Lock exercises (prevent AI overwrite)
- Add custom exercises
- Remove AI-selected exercises
- Save versioned plan copies
```

**Key File**: `server/services/teacherPlanOverrideService.ts`

**Database Fields**:
- `is_teacher_modified`: Boolean flag
- `teacher_id`: Who modified it
- `teacher_notes`: Rationale
- `parent_plan_id`: Link to original
- `plan_version`: Version tracking

## Database Schema Changes

### New Tables

#### PRACTICE_LOGS
Tracks daily practice sessions for adaptive intensity.

```sql
CREATE TABLE practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_minutes INTEGER NOT NULL,
  fatigue_rating INTEGER NOT NULL (1-5),
  vocal_stability_rating INTEGER NOT NULL (1-5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### INSTRUMENT_LIBRARY
Instrument-specific configuration defaults.

```sql
CREATE TABLE instrument_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_name VARCHAR(100) UNIQUE NOT NULL,
  default_daily_minutes INTEGER DEFAULT 60,
  warmup_ratio NUMERIC(3,2) DEFAULT 0.30,
  technique_ratio NUMERIC(3,2) DEFAULT 0.40,
  repertoire_ratio NUMERIC(3,2) DEFAULT 0.20,
  memorization_ratio NUMERIC(3,2) DEFAULT 0.10
);
```

**Default Data**:
- Voice: 60 min/day, 30% warmup, 40% technique
- Piano: 75 min/day, 25% warmup, 50% technique
- Violin: 60 min/day, 25% warmup, 45% technique
- Cello: 60 min/day, 25% warmup, 45% technique

#### PERFORMANCE_LOGS
Records performance simulation attempts.

```sql
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  piece_id UUID NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  success_rating NUMERIC(3,2) (0-5),
  notes TEXT,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Tables

#### PIECES
Added normalized musical demand scores.

```sql
-- New columns (JSONB for flexibility):
ALTER TABLE pieces ADD COLUMN analysis_json JSONB;

-- New columns (numeric for indexing/analytics):
ALTER TABLE pieces ADD COLUMN range_span_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN tessitura_pressure_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN breath_length_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN agility_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN dynamic_control_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN registration_transition_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN repetition_density_score NUMERIC(3,1);
ALTER TABLE pieces ADD COLUMN stylistic_period VARCHAR(50);
```

#### PRACTICE_PLANS
Added teacher override capabilities.

```sql
ALTER TABLE practice_plans ADD COLUMN is_teacher_modified BOOLEAN DEFAULT FALSE;
ALTER TABLE practice_plans ADD COLUMN teacher_id UUID;
ALTER TABLE practice_plans ADD COLUMN teacher_notes TEXT;
ALTER TABLE practice_plans ADD COLUMN recommended_techniques JSONB;
ALTER TABLE practice_plans ADD COLUMN musical_demand_scores JSONB;
ALTER TABLE practice_plans ADD COLUMN plan_version INTEGER DEFAULT 1;
ALTER TABLE practice_plans ADD COLUMN parent_plan_id UUID;
```

## API Endpoints

### Analytics API

**GET /api/analytics/student**
- Comprehensive 30-day analytics
- Practice minutes trend
- Memorization success rate by day
- Technique frequency
- Fatigue & vocal stability trends
- Piece progress
- Smart recommendations

**GET /api/analytics/practice-trends**
- Last 7 days practice analysis
- Average fatigue and stability
- Should reduce intensity flag
- Should increase warmup flag

### Performance API

**POST /api/performance/log**
- Log a performance attempt
- Accepts success_rating (0-5)
- Optional notes and recording timestamp

**GET /api/performance/piece/:pieceId**
- Get all performance logs for a piece
- Calculate average rating and attempts

**GET /api/performance/summary**
- Summary across all pieces
- Last 30 days
- Piece-by-piece breakdown

**DELETE /api/performance/:logId**
- Delete a performance log

## File Structure

```
server/
├── lib/
│   ├── techniqueMapping.ts          # Mapping logic
│   └── openai.ts                    # Updated with structured prompts
├── services/
│   ├── musicAnalysisService.ts      # Heuristic scoring
│   ├── practiceLogsService.ts       # Fatigue tracking
│   ├── moduleRetrievalService.ts    # Module combining
│   └── teacherPlanOverrideService.ts # Teacher modifications
└── routes/
    ├── pieces.ts                    # Updated with analysis
    ├── practice-plan.ts             # Updated with mapping
    ├── analytics.ts                 # New analytics endpoint
    └── performance.ts               # New performance endpoint

PEDAGOGY_DATABASE_SCHEMA.md         # Database schema reference
PEDAGOGY_ENGINE_IMPLEMENTATION.md   # This file
```

## Implementation Steps

### 1. Database Setup

1. Create new tables:
   ```bash
   # In Supabase SQL editor, run PEDAGOGY_DATABASE_SCHEMA.md scripts
   ```

2. Add columns to existing tables:
   ```bash
   # Run PIECES and PRACTICE_PLANS ALTER TABLE statements
   ```

3. Enable RLS:
   ```bash
   # Run RLS policy statements in schema file
   ```

4. Populate instrument library:
   ```bash
   # Run INSERT INTO instrument_library statements
   ```

### 2. Backend Code Deployment

1. Deploy new service files:
   - `server/services/musicAnalysisService.ts`
   - `server/services/practiceLogsService.ts`
   - `server/services/moduleRetrievalService.ts`
   - `server/services/teacherPlanOverrideService.ts`

2. Deploy updated library files:
   - `server/lib/techniqueMapping.ts` (new)
   - `server/lib/openai.ts` (modified)

3. Deploy updated route files:
   - `server/routes/pieces.ts` (modified with analysis)
   - `server/routes/practice-plan.ts` (modified with mapping)
   - `server/routes/analytics.ts` (new)
   - `server/routes/performance.ts` (new)

4. Update server registration:
   - `server/index.ts` (add new route registrations)

### 3. Type Safety

All new services include TypeScript interfaces:
- `MusicalDemandScores`
- `TechniqueCategory`
- `TechniqueRecommendation`
- `PracticeLog`
- `PracticeTrendAnalysis`
- `TechniqueModule`
- `PerformanceLog`

### 4. Testing Workflow

1. **Music Analysis**
   - Test piece creation with metadata
   - Verify score generation (0-10 scale)
   - Check MIDI note parsing

2. **Technique Mapping**
   - Test different score combinations
   - Verify recommended categories
   - Check daily minute adjustments

3. **Practice Plan Generation**
   - Create piece with scores
   - Generate practice plan
   - Verify structured JSON output

4. **Analytics**
   - Log practice sessions
   - Fetch analytics endpoint
   - Verify trend calculations

5. **Performance Logs**
   - Log performance attempts
   - Fetch performance summary
   - Verify piece-by-piece stats

## Backward Compatibility

### Non-Breaking Changes
- All new columns are nullable or have defaults
- Old API endpoints remain unchanged
- Legacy `analysis_json` field still supported
- Fallback to heuristic scores if structured data missing

### Migration Path
1. Deploy new code
2. Existing pieces continue to work
3. New pieces get full analysis
4. Practice plan generation enhanced but compatible
5. Old plans still readable

## Performance Considerations

### Indexing
```sql
-- Key indexes for performance
CREATE INDEX idx_practice_logs_user_date ON practice_logs(user_id, date DESC);
CREATE INDEX idx_performance_logs_user_piece ON performance_logs(user_id, piece_id);
CREATE INDEX idx_performance_logs_date ON performance_logs(date DESC);
CREATE INDEX idx_technique_modules_system ON technique_modules(created_by_user_id);
CREATE INDEX idx_pieces_analysis ON pieces(stylistic_period, agility_score);
```

### Query Optimization
- Practice logs: Indexed on (user_id, date) for fast 7-day queries
- Performance logs: Indexed on (user_id, piece_id) for piece summaries
- Technique modules: Filtered by null created_by_user_id for system modules

## Future Enhancements

### Phase 2: Music21 Integration
- Replace heuristic scoring with actual file analysis
- Parse MusicXML/MIDI files
- Extract pitch data, rhythm, dynamics
- Call external Python microservice for analysis
- Cache results for performance

### Phase 3: Advanced Analytics
- Piece complexity trends
- Technique mastery tracking
- Prediction models for practice recommendations
- Student cohort analysis

### Phase 4: Teacher Dashboard
- Visual builder for custom practice plans
- Module creation and assignment
- Student progress overview
- Class management features

## Configuration

### Environment Variables
No new environment variables required. Existing configuration:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (optional, falls back to mocks)

### Feature Flags
Consider adding flags for:
- `ENABLE_MUSIC_ANALYSIS` (default: true)
- `ENABLE_ADAPTIVE_INTENSITY` (default: true)
- `FORCE_MOCK_OPENAI` (default: false, uses API if available)

## Troubleshooting

### Issue: "No valid JSON found in OpenAI response"
**Solution**: Check if API is returning markdown-wrapped JSON. The code handles extraction.

### Issue: Piece analysis shows all scores as 5.0
**Solution**: Piece metadata likely missing. Provide:
- `estimatedRangeLow` and `estimatedRangeHigh`
- `estimatedPhraseLengthMeasures`
- `estimatedAgilityLevel`
- `estimatedDynamicRange`

### Issue: Practice logs not affecting recommendations
**Solution**: Ensure at least 3 practice logs exist in last 7 days for meaningful trends.

### Issue: Teacher modules not appearing in practice plans
**Solution**: Verify teacher_id is set in student_profiles and modules exist with matching teacher_id.

## Monitoring

Track these metrics:
- API response time for `/api/practice-plan/generate`
- OpenAI API error rate
- Average practice plan generation time
- Student practice log submission rate
- Performance log frequency by piece

## Support & Documentation

- **API Documentation**: See inline comments in route files
- **Type Definitions**: Check TypeScript interfaces in service files
- **Database Schema**: See `PEDAGOGY_DATABASE_SCHEMA.md`
- **Examples**: Mock practice plans in `openai.ts`
