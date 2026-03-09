import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TeacherProfile } from "@/types";

export default function OnboardingTeacher() {
  const navigate = useNavigate();
  const { completeTeacherOnboarding, isLoading } = useAuth();
  const [step, setStep] = useState(1);

  const [bio, setBio] = useState("");
  const [methodsUsed, setMethodsUsed] = useState<
    ("Vaccai" | "Lamperti" | "Garcia" | "Bel Canto" | "Custom")[]
  >([]);
  const [instrumentsTaught, setInstrumentsTaught] = useState<string[]>([
    "Voice",
  ]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const toggleMethod = (
    method: "Vaccai" | "Lamperti" | "Garcia" | "Bel Canto" | "Custom"
  ) => {
    setMethodsUsed((prev) => {
      if (prev.includes(method)) {
        return prev.filter((m) => m !== method);
      }
      return [...prev, method];
    });
  };

  const toggleInstrument = (instrument: string) => {
    setInstrumentsTaught((prev) => {
      if (prev.includes(instrument)) {
        return prev.filter((i) => i !== instrument);
      }
      return [...prev, instrument];
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const profile: TeacherProfile = {
        userId: "",
        bio,
        methodsUsed,
        instrumentsTaught,
        yearsExperience: parseInt(yearsExperience) || 0,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      };

      await completeTeacherOnboarding(profile);
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
              Tell Us About Your Teaching
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

          {/* Step 1: Bio and Methods */}
          {step === 1 && (
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-2">
                Your Teaching Profile
              </h2>
              <p className="text-muted-foreground">
                Help students learn about you and your teaching approach.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <div>
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students about your experience, teaching philosophy, and what makes you unique as a teacher..."
                  rows={6}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {bio.length} characters
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Teaching Methods You Use
                </Label>
                <div className="space-y-2">
                  {["Vaccai", "Lamperti", "Garcia", "Bel Canto", "Custom"].map(
                    (method) => (
                      <button
                        key={method}
                        onClick={() =>
                          toggleMethod(
                            method as
                              | "Vaccai"
                              | "Lamperti"
                              | "Garcia"
                              | "Bel Canto"
                              | "Custom"
                          )
                        }
                        className={`w-full p-3 border rounded-lg text-left transition-all flex items-center gap-3 text-sm ${
                          methodsUsed.includes(
                            method as
                              | "Vaccai"
                              | "Lamperti"
                              | "Garcia"
                              | "Bel Canto"
                              | "Custom"
                          )
                            ? "border-primary bg-secondary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            methodsUsed.includes(
                              method as
                                | "Vaccai"
                                | "Lamperti"
                                | "Garcia"
                                | "Bel Canto"
                                | "Custom"
                            )
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {methodsUsed.includes(
                            method as
                              | "Vaccai"
                              | "Lamperti"
                              | "Garcia"
                              | "Bel Canto"
                              | "Custom"
                          ) && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span>{method}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Step 2: Experience and Instruments */}
          {step === 2 && (
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-2">
                Your Experience
              </h2>
              <p className="text-muted-foreground">
                This helps students understand your background.
              </p>
            </div>

            <div className="space-y-6 mt-8">
              <div>
                <Label htmlFor="years" className="text-sm font-medium">
                  Years of Teaching Experience
                </Label>
                <Input
                  id="years"
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="5"
                  min="0"
                  max="80"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Instruments You Teach
                </Label>
                <div className="space-y-2">
                  {["Voice", "Piano", "Violin", "Cello", "Flute", "Oboe"].map(
                    (instrument) => (
                      <button
                        key={instrument}
                        onClick={() => toggleInstrument(instrument)}
                        className={`w-full p-3 border rounded-lg text-left transition-all flex items-center gap-3 text-sm ${
                          instrumentsTaught.includes(instrument)
                            ? "border-primary bg-secondary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            instrumentsTaught.includes(instrument)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {instrumentsTaught.includes(instrument) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <span>{instrument}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Step 3: Pricing */}
          {step === 3 && (
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-2">
                Pricing & Availability
              </h2>
              <p className="text-muted-foreground">
                Optional. You can set this up later.
              </p>
            </div>

            <div className="space-y-6 mt-8">
              <div>
                <Label htmlFor="rate" className="text-sm font-medium">
                  Hourly Rate (Optional)
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="rate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="50"
                    min="0"
                    step="5"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This will be shown on your marketplace profile
                </p>
              </div>

              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Availability Calendar
                </p>
                <p className="text-sm text-muted-foreground">
                  You'll be able to set your availability after completing setup.
                </p>
              </div>
            </div>
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
                disabled={isLoading || (step === 1 && methodsUsed.length === 0)}
                className="flex-1"
                size="lg"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
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
