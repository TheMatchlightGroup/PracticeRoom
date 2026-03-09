import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReviewModal from "@/components/ReviewModal";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, AlertCircle, Clock, Music, ChevronRight } from "lucide-react";

interface AudioSubmission {
  id: string;
  created_at: string;
  category: "piece" | "lesson" | "freeform";
  status: "pending" | "approved" | "rejected";
  student_id: string;
  student_name: string;
  audio_blob_url: string;
  teacher_notes?: string;
  marked_successful_at?: string;
}

export default function TeacherDashboard() {
  const { isAuthenticated, userRole, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [submissions, setSubmissions] = useState<AudioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedSubmission, setSelectedSubmission] = useState<AudioSubmission | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Check authentication and role - wait for auth to finish loading
  useEffect(() => {
    // Don't check until auth loading is complete
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login");
    } else if (userRole !== "teacher") {
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated, userRole, navigate]);

  // Load submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!isAuthenticated || userRole !== "teacher") return;

      try {
        setLoading(true);
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        if (!token) return;

        const res = await fetch("/api/submissions/teacher?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load submissions");
        }

        const { data } = await res.json();
        setSubmissions(data || []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load submissions";
        setError(message);
        console.error("Error loading submissions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [isAuthenticated, userRole]);

  // Filter submissions by status
  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter === "all") return true;
    return sub.status === statusFilter;
  });

  // Handle review submission
  const handleReviewSubmit = async (submissionId: string, status: string, notes?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          teacher_notes: notes || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update submission");
      }

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId
            ? { ...sub, status: status as any, teacher_notes: notes }
            : sub
        )
      );

      setIsReviewOpen(false);
      setSelectedSubmission(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update submission";
      setError(message);
      console.error("Error updating submission:", err);
    }
  };

  // Return null while auth is loading to prevent flashing redirects
  if (authLoading) {
    return null;
  }

  if (!isAuthenticated || userRole !== "teacher") {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "pending":
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 border-green-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      case "pending":
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review and provide feedback on student audio submissions
          </p>
        </div>

        {/* Error message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {/* Status filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            All ({submissions.length})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            size="sm"
          >
            Pending ({submissions.filter((s) => s.status === "pending").length})
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            onClick={() => setStatusFilter("approved")}
            size="sm"
          >
            Approved ({submissions.filter((s) => s.status === "approved").length})
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            onClick={() => setStatusFilter("rejected")}
            size="sm"
          >
            Rejected ({submissions.filter((s) => s.status === "rejected").length})
          </Button>
        </div>

        {/* Submissions list */}
        {loading ? (
          <p className="text-muted-foreground">Loading submissions...</p>
        ) : filteredSubmissions.length === 0 ? (
          <Card className="p-8 text-center">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {statusFilter === "all"
                ? "No submissions yet. Students will submit audio here."
                : `No ${statusFilter} submissions.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`p-4 border rounded ${getStatusColor(submission.status)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(submission.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="font-medium text-foreground">
                          {submission.student_name}
                        </p>
                        <span className="text-xs px-2 py-1 rounded bg-white/50 font-medium capitalize">
                          {submission.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white/50 font-medium capitalize">
                          {submission.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(submission.created_at).toLocaleDateString()} at{" "}
                        {new Date(submission.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {submission.teacher_notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{submission.teacher_notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setIsReviewOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    Review <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </MainContent>

      {/* Review Modal */}
      {selectedSubmission && (
        <ReviewModal
          isOpen={isReviewOpen}
          submission={selectedSubmission}
          onClose={() => {
            setIsReviewOpen(false);
            setSelectedSubmission(null);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}
    </>
  );
}
