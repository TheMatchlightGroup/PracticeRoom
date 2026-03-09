import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, isLoading, user, isAuthenticated } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      console.log("🔐 Routing: User authenticated, checking role", { userId: user.id, role: user.role, onboardingCompleted: user.onboardingCompleted });

      // Decision tree: role is source of truth
      if (!user.role) {
        console.log("🔐 Routing: No role selected, redirecting to /role-select");
        navigate("/role-select");
      } else if (!user.onboardingCompleted) {
        console.log("🔐 Routing: Role selected but onboarding not complete, redirecting to /role-select");
        navigate("/role-select");
      } else if (user.role === "teacher") {
        console.log("🔐 Routing: Teacher with onboarding complete, redirecting to /submissions");
        navigate("/submissions");
      } else {
        console.log("🔐 Routing: Student with onboarding complete, redirecting to /dashboard");
        navigate("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignup) {
        await signup(email, password, name);
        navigate("/email-confirmation");
      } else {
        // Login: let auth context handle routing based on auth state + onboarding
        await login(email, password);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
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
        <div className="w-full max-w-md">
          {/* Tagline */}
          <div className="text-center mb-12">
            <p className="text-lg text-muted-foreground font-sans">
              AI-Powered Classical Music Practice Platform
            </p>
          </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-serif font-semibold mb-6 text-foreground">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex gap-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isLoading}
                  required
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
                className="mt-2"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6"
              size="lg"
            >
              {isLoading
                ? "Loading..."
                : isSignup
                  ? "Create Account"
                  : "Sign In"}
            </Button>
          </form>

          {/* Toggle Signup/Login */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              disabled={isLoading}
            >
              {isSignup ? "Sign In" : "Create Account"}
            </Button>
          </div>
        </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
