import React from "react";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Messages
          </h1>
          <p className="text-muted-foreground">
            Real-time communication with teachers and students
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-secondary rounded-lg p-6">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
            No messages yet
          </h3>
          <p className="text-muted-foreground">
            Start a conversation by booking a lesson or contacting a teacher.
          </p>
        </Card>
      </MainContent>
    </>
  );
}
