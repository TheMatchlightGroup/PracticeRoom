/**
 * PracticeRoom.io - Type Definitions
 * Structured for Supabase integration
 */

/* ============ Auth & User Types ============ */

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePhoto?: string;
  createdAt: string;
  teacher_id?: string; // For students to reference their teacher
  onboardingCompleted?: boolean; // Tracks if user has finished onboarding
}

export interface StudentProfile {
  userId: string;
  vocalRangeLow: string; // e.g., "C3"
  vocalRangeHigh: string; // e.g., "C6"
  experienceLevel: "Beginner" | "Intermediate" | "Advanced" | "Professional";
  goals: ("Technique" | "Audition Prep" | "Memorization" | "General Development")[];
  primaryInstrument: "Voice" | "Piano" | "Other";
}

export interface TeacherProfile {
  userId: string;
  bio: string;
  methodsUsed: ("Vaccai" | "Lamperti" | "Garcia" | "Bel Canto" | "Custom")[];
  instrumentsTaught: string[];
  yearsExperience: number;
  availabilityJson?: Record<string, unknown>;
  hourlyRate?: number;
}

/* ============ Music Content Types ============ */

export interface Piece {
  id: string;
  userId: string;
  title: string;
  composer: string;
  language?: string;
  keySignature?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Professional";
  instrument: "Voice" | "Piano" | "Other";
  uploadUrl?: string;
  analysisJson?: PieceAnalysis;
  createdAt: string;
}

export interface PieceAnalysis {
  range?: string;
  tessitura?: string;
  phraseLengthEstimate?: number;
  agilityScore?: number; // 0-100
  dynamicDensity?: number; // 0-100
  passaggiRisk?: number; // 0-100
  repetitionPatterns?: string[];
}

export interface PracticePlan {
  id: string;
  pieceId: string;
  userId: string;
  generatedJson: DailyPracticePlan;
  weeklyStructureJson?: Record<string, unknown>;
  createdAt: string;
}

export interface DailyPracticePlan {
  dailyMinutesTotal: number;
  days: DayPlan[];
}

export interface DayPlan {
  dayNumber: number;
  focusArea: string;
  exercises: ExerciseTask[];
  repertoireTasks: RepertoireTask[];
  memorizationTasks: MemorizationTask[];
}

export interface ExerciseTask {
  techniqueModuleId: string;
  durationMinutes: number;
  notes?: string;
}

export interface RepertoireTask {
  pieceId: string;
  section?: string;
  durationMinutes: number;
  notes?: string;
}

export interface MemorizationTask {
  cardId: string;
  cardType: "lyrics" | "rhythm" | "pitch_outline" | "translation";
  durationMinutes: number;
}

export interface TechniqueModule {
  id: string;
  instrument: "Voice" | "Piano" | "Other";
  category: "breath" | "legato" | "agility" | "registration" | "memorization";
  source: "system" | "teacher";
  sourceMethod: "Vaccai" | "Lamperti" | "Garcia" | "Bel Canto" | "Czerny" | "Hanon" | "Custom";
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  instructions: string;
  mediaUrl?: string;
  createdByUserId?: string;
  isPublic: boolean;
}

export interface MemorizationCard {
  id: string;
  pieceId: string;
  userId: string;
  cardType: "lyrics" | "rhythm" | "pitch_outline" | "translation";
  content: string;
  nextReviewDate: string; // ISO date
  intervalDays: number;
  easinessFactor: number; // SM-2 algorithm
  repetitionCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readStatus: boolean;
}

export interface Booking {
  id: string;
  teacherId: string;
  studentId: string;
  datetime: string; // ISO datetime
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

/* ============ API Response Types ============ */

export interface AnalyzePieceResponse {
  range?: string;
  tessitura?: string;
  phraseLengthEstimate?: number;
  agilityScore?: number;
  dynamicDensity?: number;
  passaggiRisk?: number;
  repetitionPatterns?: string[];
}

export interface GeneratePracticePlanResponse {
  dailyMinutesTotal: number;
  days: DayPlan[];
}
