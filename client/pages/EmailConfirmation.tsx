import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Logo } from "@/components/Logo";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailConfirmation() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If user is authenticated (email confirmed), redirect based on onboarding state
    if (!isLoading && user) {
      if (user.onboardingCompleted) {
        // Already completed onboarding, go to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // Not completed onboarding yet, go to role select
        navigate("/role-select", { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Logo */}
      <header className="border-b border-border px-4 sm:px-6 lg:px-8 py-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-secondary rounded-full p-6">
              <Mail className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-4">
            Confirm Your Email
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-2">
            We've sent a confirmation link to your email address.
          </p>
          <p className="text-muted-foreground mb-8">
            Click the link in the email to confirm your account and continue.
          </p>

          {/* Checklist */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">1.</span>
              <span className="text-sm text-muted-foreground">
                Check your email inbox
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">2.</span>
              <span className="text-sm text-muted-foreground">
                Click the confirmation link
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">3.</span>
              <span className="text-sm text-muted-foreground">
                You'll be redirected back to set up your account
              </span>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground mb-8">
            Didn't receive the email? Check your spam folder or try signing up
            again.
          </p>

          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => navigate("/login")}
            className="w-full gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
