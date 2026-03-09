import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import StudentDetailOverview from "@/components/StudentDetail/Overview";
import StudentDetailMessages from "@/components/StudentDetail/Messages";
import StudentDetailSchedule from "@/components/StudentDetail/Schedule";
import StudentDetailPieces from "@/components/StudentDetail/Pieces";
import StudentDetailAssignments from "@/components/StudentDetail/Assignments";
import StudentDetailSubmissions from "@/components/StudentDetail/Submissions";

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  primaryInstrument?: string;
  vocalRange?: string;
  experience_level?: string;
  goals?: string;
}

type TabType = "overview" | "messages" | "schedule" | "pieces" | "assignments" | "submissions";

export default function StudentDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch student info
  useEffect(() => {
    if (!studentId || !user?.id || user.role !== "teacher") {
      return;
    }

    const fetchStudent = async () => {
      try {
        setLoading(true);
        
        // Fetch user info
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, email, teacher_id")
          .eq("id", studentId)
          .single();

        if (userError || !userData) {
          toast({
            title: "Error",
            description: "Could not find student",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        // Verify this teacher is actually teaching this student
        if (userData.teacher_id !== user.id) {
          navigate("/dashboard");
          return;
        }

        // Fetch student profile
        const { data: profileData } = await supabase
          .from("student_profiles")
          .select("primary_instrument, vocal_range, experience_level, goals")
          .eq("user_id", studentId)
          .single();

        setStudent({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          primaryInstrument: profileData?.primary_instrument,
          vocalRange: profileData?.vocal_range,
          experience_level: profileData?.experience_level,
          goals: profileData?.goals,
        });
      } catch (error) {
        console.error("Error fetching student:", error);
        toast({
          title: "Error",
          description: "Failed to load student details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, user?.id, user?.role, navigate, toast]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "messages", label: "Messages" },
    { id: "schedule", label: "Schedule" },
    { id: "pieces", label: "Pieces" },
    { id: "assignments", label: "Assignments" },
    { id: "submissions", label: "Submissions" },
  ];

  return (
    <>
      <Navigation />
      <MainContent>
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-semibold text-primary">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground">
                {student.name}
              </h1>
              <p className="text-muted-foreground">
                {student.primaryInstrument || "No instrument specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <StudentDetailOverview student={student} />
          )}
          {activeTab === "messages" && (
            <StudentDetailMessages studentId={student.id} studentName={student.name} />
          )}
          {activeTab === "schedule" && (
            <StudentDetailSchedule studentId={student.id} />
          )}
          {activeTab === "pieces" && (
            <StudentDetailPieces studentId={student.id} />
          )}
          {activeTab === "assignments" && (
            <StudentDetailAssignments studentId={student.id} />
          )}
          {activeTab === "submissions" && (
            <StudentDetailSubmissions studentId={student.id} />
          )}
        </div>
      </MainContent>
    </>
  );
}
