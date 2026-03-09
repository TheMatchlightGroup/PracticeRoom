import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Music, BarChart3, Brain, Users } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Logo size="md" />
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <Button onClick={() => navigate("/login")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-serif font-semibold text-foreground mb-6">
            Welcome to your Practice Room.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 font-sans">
            Generate intelligent practice plans, master memorization with
            spaced repetition, and connect with world-class teachers. Built for
            singers and instrumentalists who demand excellence.
          </p>
          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
            >
              Start Learning Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Explore Features
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="bg-secondary rounded-lg p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              Smart Practice Plans
            </h3>
            <p className="text-sm text-muted-foreground font-sans">
              AI analyzes your repertoire and generates personalized daily
              practice routines.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="bg-secondary rounded-lg p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              Master Memorization
            </h3>
            <p className="text-sm text-muted-foreground font-sans">
              Spaced repetition algorithms keep your repertoire fresh and
              performance-ready.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="bg-secondary rounded-lg p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              Expert Teachers
            </h3>
            <p className="text-sm text-muted-foreground font-sans">
              Connect with conservatory-trained instructors. Book lessons,
              share scores, and get feedback.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="bg-secondary rounded-lg p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              Track Progress
            </h3>
            <p className="text-sm text-muted-foreground font-sans">
              Visualize your growth with detailed analytics and practice
              insights.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <section className="mb-20">
          <h3 className="text-3xl font-serif font-semibold text-foreground text-center mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-semibold">
                1
              </div>
              <h4 className="font-serif font-semibold text-foreground mb-2">
                Add Your Pieces
              </h4>
              <p className="text-sm text-muted-foreground font-sans">
                Upload scores or manually enter your repertoire. Our AI analyzes the musical demands.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-semibold">
                2
              </div>
              <h4 className="font-serif font-semibold text-foreground mb-2">
                Get Custom Plans
              </h4>
              <p className="text-sm text-muted-foreground font-sans">
                Receive 7-day practice structures mapped to proven pedagogical methods.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif font-semibold">
                3
              </div>
              <h4 className="font-serif font-semibold text-foreground mb-2">
                Practice & Master
              </h4>
              <p className="text-sm text-muted-foreground font-sans">
                Follow your plan, track progress, and connect with teachers for guidance.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="bg-secondary border border-border rounded-lg p-12 text-center">
          <h3 className="text-3xl font-serif font-semibold text-foreground mb-4">
            Ready to Transform Your Practice?
          </h3>
          <p className="text-muted-foreground mb-8 font-sans">
            Join musicians worldwide who are mastering their craft with intelligent practice.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/login")}
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-sans">
              © 2024 PracticeRoom. All rights reserved.
            </p>
            <div className="space-x-6 text-sm text-muted-foreground font-sans">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
