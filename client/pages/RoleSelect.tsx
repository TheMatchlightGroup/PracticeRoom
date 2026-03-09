import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Music, Users, Shield, AlertCircle } from "lucide-react";

export default function RoleSelect() {
  const navigate = useNavigate();
  const { user, selectRole, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleLoading, setSelectedRoleLoading] = useState<string | null>(null);

  // Handle redirects in useEffect, not during render
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("🔐 Routing: No user, redirecting to /login");
      navigate("/login");
      return;
    }

    // If user has both role AND completed onboarding, redirect to appropriate dashboard
    if (!isLoading && user && user.role && user.onboardingCompleted) {
      console.log("🔐 Routing: User completed onboarding with role:", { role: user.role, userId: user.id });

      if (user.role === "teacher") {
        console.log("🔐 Routing: Redirecting teacher to /submissions");
        navigate("/submissions");
      } else {
        console.log("🔐 Routing: Redirecting student to /dashboard");
        navigate("/dashboard");
      }
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSelectRole = async (role: "student" | "teacher" | "admin") => {
    setError(null);
    setSelectedRoleLoading(role);
    try {
      console.log("🔐 Role Selection: Starting role selection for:", role);
      await selectRole(role);

      console.log("🔐 Role Selection: Role selected successfully, routing to onboarding:", role);
      if (role === "student") {
        navigate("/onboarding/student");
      } else if (role === "teacher") {
        navigate("/onboarding/teacher");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to select role. Please try again.";
      console.error("🔐 Role Selection: Failed to select role:", error);
      setError(errorMessage);
      setSelectedRoleLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex flex-col">
      {/* Header with Logo */}
      <header className="border-b border-border px-4 sm:px-6 lg:px-8 py-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-destructive font-medium">Error selecting role</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-serif font-semibold text-primary mb-4">
              Choose Your Role
            </h1>
            <p className="text-lg text-muted-foreground font-sans max-w-2xl mx-auto">
              Tell us how you'll be using PracticeRoom. You can change this later
              in your settings.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Student Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative bg-card border-2 border-border rounded-xl p-8 hover:border-accent transition-colors">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="bg-secondary rounded-lg p-4">
                  <Music className="w-8 h-8 text-primary" />
                </div>

                <div>
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-3">
                    Student
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get AI-generated practice plans, track memorization, and
                    grow your technique with structured exercises.
                  </p>
                </div>

                <ul className="text-sm text-muted-foreground text-left space-y-2 w-full">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>AI-powered practice plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Spaced repetition learning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Connect with teachers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Track progress over time</span>
                  </li>
                </ul>

                <Button
                  onClick={() => handleSelectRole("student")}
                  disabled={selectedRoleLoading !== null}
                  className="w-full mt-4"
                  size="lg"
                >
                  {selectedRoleLoading === "student" ? "Setting up..." : "Continue as Student"}
                </Button>
              </div>
            </div>
          </div>

          {/* Teacher Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            <div className="relative bg-card border-2 border-border rounded-xl p-8 hover:border-accent transition-colors">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="bg-secondary rounded-lg p-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>

                <div>
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-3">
                    Teacher
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create custom exercises, manage students, and share your
                    pedagogy with the PracticeRoom community.
                  </p>
                </div>

                <ul className="text-sm text-muted-foreground text-left space-y-2 w-full">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Student management studio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Create custom exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Marketplace for bookings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Real-time student messaging</span>
                  </li>
                </ul>

                <Button
                  onClick={() => handleSelectRole("teacher")}
                  disabled={selectedRoleLoading !== null}
                  className="w-full mt-4"
                  size="lg"
                >
                  {selectedRoleLoading === "teacher" ? "Setting up..." : "Continue as Teacher"}
                </Button>
              </div>
            </div>
          </div>
        </div>

          {/* Admin note - minimal */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Admin access only. Contact support if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
