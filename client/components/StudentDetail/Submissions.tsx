import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context-supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Save, MessageSquare, CheckCircle } from "lucide-react";

interface Submission {
  id: string;
  assignment_id: string;
  audio_url: string;
  submitted_date: string;
  teacher_feedback?: string;
  marked_successful: boolean;
  assignment_title?: string;
}

interface SubmissionsProps {
  studentId: string;
}

export default function StudentDetailSubmissions({ studentId }: SubmissionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackEditId, setFeedbackEditId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  // Fetch submissions
  useEffect(() => {
    if (!user?.id) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        
        // First get submissions for this student
        const { data: submissionData, error } = await supabase
          .from("audio_submissions")
          .select("*")
          .eq("student_id", studentId)
          .order("submitted_date", { ascending: false });

        if (error) {
          console.error("Error fetching submissions:", error);
          return;
        }

        // If we have submissions, enrich them with assignment titles
        if (submissionData && submissionData.length > 0) {
          const assignmentIds = submissionData.map((s: any) => s.assignment_id);
          
          const { data: assignmentData } = await supabase
            .from("student_assignments")
            .select("id, title")
            .in("id", assignmentIds);

          const assignmentMap = new Map(
            (assignmentData || []).map((a: any) => [a.id, a.title])
          );

          const enrichedSubmissions = submissionData.map((s: any) => ({
            ...s,
            assignment_title: assignmentMap.get(s.assignment_id) || "Unknown",
          }));

          setSubmissions(enrichedSubmissions);
        } else {
          setSubmissions([]);
        }
      } catch (err) {
        console.error("Error in fetchSubmissions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user?.id, studentId]);

  const handleMarkSuccessful = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from("audio_submissions")
        .update({ marked_successful: true })
        .eq("id", submissionId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to mark as successful",
          variant: "destructive",
        });
        return;
      }

      setSubmissions(
        submissions.map((s) =>
          s.id === submissionId ? { ...s, marked_successful: true } : s
        )
      );
      toast({ title: "Success", description: "Marked as successful!" });
    } catch (err) {
      console.error("Error marking successful:", err);
    }
  };

  const handleSaveFeedback = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from("audio_submissions")
        .update({ teacher_feedback: feedbackText })
        .eq("id", submissionId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save feedback",
          variant: "destructive",
        });
        return;
      }

      setSubmissions(
        submissions.map((s) =>
          s.id === submissionId
            ? { ...s, teacher_feedback: feedbackText }
            : s
        )
      );
      setFeedbackEditId(null);
      setFeedbackText("");
      toast({ title: "Success", description: "Feedback saved!" });
    } catch (err) {
      console.error("Error saving feedback:", err);
    }
  };

  const startEditFeedback = (submission: Submission) => {
    setFeedbackEditId(submission.id);
    setFeedbackText(submission.teacher_feedback || "");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Audio Submissions
        </h3>

        {loading ? (
          <p className="text-muted-foreground">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="text-muted-foreground">
            No submissions yet. Students can submit audio clips once assignments are created.
          </p>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className={`border rounded-lg p-6 transition ${
                  submission.marked_successful
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-border hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {submission.marked_successful && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">
                          {submission.assignment_title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(submission.submitted_date).toLocaleDateString()}{" "}
                          {new Date(submission.submitted_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!submission.marked_successful && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkSuccessful(submission.id)}
                      className="gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Successful
                    </Button>
                  )}
                </div>

                {/* Audio Player */}
                <div className="bg-background rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-secondary flex-shrink-0" />
                    <audio
                      controls
                      src={submission.audio_url}
                      className="flex-1"
                      controlsList="nodownload"
                    />
                  </div>
                </div>

                {/* Feedback Section */}
                <div>
                  {feedbackEditId === submission.id ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-foreground">
                        Feedback
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Write feedback for this submission..."
                        className="w-full p-3 rounded border border-border bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveFeedback(submission.id)}
                          size="sm"
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save Feedback
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setFeedbackEditId(null)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {submission.teacher_feedback ? (
                        <div className="bg-secondary/5 p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Your Feedback
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditFeedback(submission)}
                            >
                              Edit
                            </Button>
                          </div>
                          <p className="text-foreground whitespace-pre-wrap">
                            {submission.teacher_feedback}
                          </p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditFeedback(submission)}
                          className="gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Add Feedback
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
