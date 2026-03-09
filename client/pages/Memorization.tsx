import React from "react";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function Memorization() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Memorization
          </h1>
          <p className="text-muted-foreground">
            Spaced repetition learning with SM-2 algorithm
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-secondary rounded-lg p-6">
              <Brain className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
            No cards due today
          </h3>
          <p className="text-muted-foreground">
            Add pieces to your repertoire to generate memorization cards using intelligent spaced repetition scheduling.
          </p>
        </Card>
      </MainContent>
    </>
  );
}
