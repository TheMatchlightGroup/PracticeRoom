import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentProfile } from "@/types";

// Generate all notes from A1 to G8 for vocal range selection
const generateNotes = () => {
  const noteNames = ["A", "B", "C", "D", "E", "F", "G"];
  const notes: Record<string, string> = {};

  for (let octave = 1; octave <= 8; octave++) {
    for (const note of noteNames) {
      const key = `${note}${octave}`;
      const label = note === "C" && octave === 4
        ? `${note}${octave} (Middle C)`
        : `${note}${octave}`;
      notes[key] = label;
    }
  }

  return notes;
};

const NOTES = generateNotes();

export default function OnboardingStudent() {
  const navigate = useNavigate();
  const { completeStudentOnboarding, isLoading } = useAuth();
  const [step, setStep] = useState(1);

  const [vocalRangeLow, setVocalRangeLow] = useState("A2");
  const [vocalRangeHigh, setVocalRangeHigh] = useState("A4");
  const [experienceLevel, setExperienceLevel] = useState<
    "Beginner" | "Intermediate" | "Advanced" | "Professional"
  >("Beginner");
  const [goals, setGoals] = useState<
    ("Technique" | "Audition Prep" | "Memorization" | "General Development")[]
  >([]);

  const toggleGoal = (
    goal: "Technique" | "Audition Prep" | "Memorization" | "General Development"
  ) => {
    setGoals((prev) => {
      if (prev.includes(goal)) {
        return prev.filter((g) => g !== goal);
      }
      return [...prev, goal];
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const profile: StudentProfile = {
        userId: "", // Will be set by backend
        vocalRangeLow,
        vocalRangeHigh,
        experienceLevel,
        goals,
        primaryInstrument: "Voice",
      };

      await completeStudentOnboarding(profile);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Logo */}
      <header className="border-b border-border px-4 sm:px-6 lg:px-8 py-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-serif font-semibold text-primary">
              Set Up Your Profile
            </h1>
            <span className="text-sm text-muted-foreground">
              Step {step} of 3
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

          {/* Step 1: Vocal Range */}
          {step === 1 && (
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-2">
                What's your vocal range?
              </h2>
              <p className="text-muted-foreground">
                Select your lowest and highest comfortable notes. This helps
                tailor your practice plans.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-8">
              <div>
                <Label htmlFor="low-note" className="text-sm font-medium">
                  Lowest Note
                </Label>
                <Select value={vocalRangeLow} onValueChange={setVocalRangeLow}>
                  <SelectTrigger id="low-note" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="high-note" className="text-sm font-medium">
                  Highest Note
                </Label>
                <Select
                  value={vocalRangeHigh}
                  onValueChange={setVocalRangeHigh}
                >
                  <SelectTrigger id="high-note" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-4 text-sm">
              <p className="text-foreground font-medium mb-2">
                Not sure about your range?
              </p>
              <p className="text-muted-foreground">
                Sing the lowest note you can comfortably sustain, then the
                highest. You can update this later in your profile.
              </p>
            </div>
          </div>
        )}

          {/* Step 2: Experience Level */}
          {step === 2 && (
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-2">
                What's your experience level?
              </h2>
              <p className="text-muted-foreground">
                This helps us generate appropriate exercises and practice plans.
              </p>
            </div>

            <div className="space-y-3 mt-8">
              {["Beginner", "Intermediate", "Advanced", "Professional"].map(
                (level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setExperienceLevel(
                        level as
                          | "Beginner"
                          | "Intermediate"
                          | "Advanced"
                          | "Professional"
                      )
                    }
                    className={`w-full p-4 border rounded-lg text-left transition-all ${
                      experienceLevel === level
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{level}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {level === "Beginner" &&
                        "Less than 1 year of formal study"}
                      {level === "Intermediate" &&
                        "1-5 years of consistent practice"}
                      {level === "Advanced" && "5-10 years of formal training"}
                      {level === "Professional" &&
                        "10+ years or performance background"}
                    </p>
                  </button>
                )
              )}
            </div>
          </div>
        )}

          {/* Step 3: Goals */}
          {step === 3 && (
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-2">
                What are your learning goals?
              </h2>
              <p className="text-muted-foreground">
                Select all that apply. Your practice plans will focus on these
                areas.
              </p>
            </div>

            <div className="space-y-3 mt-8">
              {["Technique", "Audition Prep", "Memorization", "General Development"].map(
                (goal) => (
                  <button
                    key={goal}
                    onClick={() =>
                      toggleGoal(
                        goal as
                          | "Technique"
                          | "Audition Prep"
                          | "Memorization"
                          | "General Development"
                      )
                    }
                    className={`w-full p-4 border rounded-lg text-left transition-all flex items-center gap-3 ${
                      goals.includes(
                        goal as
                          | "Technique"
                          | "Audition Prep"
                          | "Memorization"
                          | "General Development"
                      )
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        goals.includes(
                          goal as
                            | "Technique"
                            | "Audition Prep"
                            | "Memorization"
                            | "General Development"
                        )
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {goals.includes(
                        goal as
                          | "Technique"
                          | "Audition Prep"
                          | "Memorization"
                          | "General Development"
                      ) && <span className="text-white text-sm">✓</span>}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{goal}</p>
                      {goal === "Technique" && (
                        <p className="text-sm text-muted-foreground">
                          Develop fundamental vocal skills
                        </p>
                      )}
                      {goal === "Audition Prep" && (
                        <p className="text-sm text-muted-foreground">
                          Prepare for auditions and performances
                        </p>
                      )}
                      {goal === "Memorization" && (
                        <p className="text-sm text-muted-foreground">
                          Build memorization skills
                        </p>
                      )}
                      {goal === "General Development" && (
                        <p className="text-sm text-muted-foreground">
                          Overall musical growth
                        </p>
                      )}
                    </div>
                  </button>
                )
              )}
            </div>

            {goals.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Please select at least one goal to continue.
              </div>
            )}
          </div>
        )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="flex-1"
                size="lg"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading || goals.length === 0}
                className="flex-1"
                size="lg"
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
