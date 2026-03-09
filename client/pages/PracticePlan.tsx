import React from "react";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function PracticePlan() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Practice Plan
          </h1>
          <p className="text-muted-foreground">
            AI-generated weekly practice schedule
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-secondary rounded-lg p-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
            Add a piece to get started
          </h3>
          <p className="text-muted-foreground">
            Once you add a piece to your repertoire, we'll generate a personalized practice plan based on its musical demands and your experience level.
          </p>
        </Card>
      </MainContent>
    </>
  );
}
