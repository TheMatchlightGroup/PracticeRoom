import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeachingScheduleWidget } from "@/components/Dashboard/TeachingScheduleWidget";
import { BookLessonModal } from "@/components/BookLesson/BookLessonModal";
import { Users, Calendar, Music, Target } from "lucide-react";

interface StudentListItem {
  id: string;
  name: string;
  email: string;
  primaryInstrument?: string;
}

interface AssignedPiece {
  id: string;
  piece_title: string;
  composer: string | null;
  status: string | null;
  assigned_date: string | null;
  notes: string | null;
}

interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  type: "exercise" | "practice-plan";
  status: "assigned" | "in-progress" | "submitted" | "completed";
  due_date: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [bookLessonOpen, setBookLessonOpen] = useState(false);
  const [teacher, setTeacher] = useState<any>(null);

  const [assignedPieces, setAssignedPieces] = useState<AssignedPiece[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);
  const [studentDataLoading, setStudentDataLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (!user?.role) {
        navigate("/role-select");
      } else if (!user?.onboardingCompleted) {
        navigate("/role-select");
      } else if (user?.role === "teacher") {
        navigate("/submissions");
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  useEffect(() => {
    if (user?.role === "student" && user?.teacher_id) {
      const fetchTeacher = async () => {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", user.teacher_id)
            .single();

          if (!error && data) {
            setTeacher(data);
          }
        } catch (err) {
          console.error("Error fetching teacher:", err);
        }
      };

      fetchTeacher();
    }
  }, [user?.role, user?.teacher_id]);

  useEffect(() => {
    if (user?.role === "teacher" && user?.id) {
      const fetchStudents = async () => {
        try {
          setStudentsLoading(true);

          const { data, error } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("teacher_id", user.id);

          if (error) {
            console.error("Error fetching students:", error);
            return;
          }

          const studentIds = (data || []).map((s: any) => s.id);

          if (studentIds.length > 0) {
            const { data: profiles } = await supabase
              .from("student_profiles")
              .select("user_id, primary_instrument")
              .in("user_id", studentIds);

            const instrumentMap = new Map(
              (profiles || []).map((p: any) => [p.user_id, p.primary_instrument])
            );

            setStudents(
              (data || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                email: s.email,
                primaryInstrument: instrumentMap.get(s.id),
              }))
            );
          } else {
            setStudents([]);
          }
        } catch (err) {
          console.error("Error in fetchStudents:", err);
        } finally {
          setStudentsLoading(false);
        }
      };

      fetchStudents();
    }
  }, [user?.role, user?.id]);

  const fetchStudentDashboardData = async () => {
    if (!(user?.role === "student" && user?.id)) return;

    try {
      setStudentDataLoading(true);

      const [piecesResult, assignmentsResult] = await Promise.all([
        supabase
          .from("assigned_pieces")
          .select("id, piece_title, composer, status, assigned_date, notes")
          .eq("student_id", user.id)
          .order("assigned_date", { ascending: false }),
        supabase
          .from("student_assignments")
          .select("id, title, description, type, status, due_date")
          .eq("student_id", user.id)
          .order("due_date", { ascending: true, nullsFirst: false }),
      ]);

      if (piecesResult.error) {
        console.error("Error fetching assigned pieces:", piecesResult.error);
      } else {
        setAssignedPieces((piecesResult.data as AssignedPiece[]) || []);
      }

      if (assignmentsResult.error) {
        console.error("Error fetching student assignments:", assignmentsResult.error);
      } else {
        setStudentAssignments((assignmentsResult.data as StudentAssignment[]) || []);
      }
    } catch (err) {
      console.error("Error fetching student dashboard data:", err);
    } finally {
      setStudentDataLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDashboardData();
  }, [user?.role, user?.id]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Subscription Confirmed!",
        description: "Your payment was successful. Welcome to VocalStudy Premium!",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, toast]);

  const handleStudentAssignmentStatusChange = async (
    assignmentId: string,
    newStatus: "assigned" | "in-progress" | "submitted" | "completed"
  ) => {
    try {
      const { error } = await supabase
        .from("student_assignments")
        .update({ status: newStatus })
        .eq("id", assignmentId)
        .eq("student_id", user?.id);

      if (error) {
        console.error("Error updating assignment status:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update assignment status",
          variant: "destructive",
        });
        return;
      }

      setStudentAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId
            ? { ...assignment, status: newStatus }
            : assignment
        )
      );

      toast({
        title: "Success",
        description: "Assignment status updated",
      });
    } catch (err) {
      console.error("Error updating assignment status:", err);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const dueSoonAssignments = studentAssignments.filter(
    (a) => a.status !== "completed" && a.status !== "submitted"
  );

  const activePiecesCount = assignedPieces.filter(
    (p) => p.status !== "completed"
  ).length;

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}. Here's your practice overview.
          </p>
        </div>

        {user.role === "student" ? (
          <>
            {teacher ? (
              <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-orange-100/50 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 mb-1">Your Teacher</p>
                    <h2 className="text-2xl font-serif font-semibold text-foreground">
                      {teacher.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {teacher.email}
                    </p>
                  </div>
                  <Button
                    onClick={() => setBookLessonOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Book a Lesson
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 mb-8 bg-slate-50 border-slate-200">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    You haven't been connected with a teacher yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/teacher-search")}
                  >
                    Find a Teacher
                  </Button>
                </div>
              </Card>
            )}

            {user?.id && user?.teacher_id && (
              <BookLessonModal
                isOpen={bookLessonOpen}
                onOpenChange={setBookLessonOpen}
                teacherId={user.teacher_id}
                studentId={user.id}
                teacherName={teacher?.name}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Active Pieces
                    </p>
                    <p className="text-3xl font-serif font-semibold text-primary">
                      {activePiecesCount}
                    </p>
                  </div>
                  <Music className="w-8 h-8 text-secondary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Open Assignments
                    </p>
                    <p className="text-3xl font-serif font-semibold text-primary">
                      {dueSoonAssignments.length}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-secondary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Teacher Connected
                    </p>
                    <p className="text-3xl font-serif font-semibold text-primary">
                      {teacher ? "Yes" : "No"}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-secondary" />
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-semibold text-foreground">
                    Assigned Pieces
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => navigate("/repertoire")}>
                    View Repertoire
                  </Button>
                </div>

                {studentDataLoading ? (
                  <p className="text-muted-foreground">Loading assigned pieces...</p>
                ) : assignedPieces.length === 0 ? (
                  <p className="text-muted-foreground">
                    No pieces assigned yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assignedPieces.map((piece) => (
                      <div
                        key={piece.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-foreground">
                            {piece.piece_title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {piece.composer || "Unknown composer"}
                          </p>
                          {piece.assigned_date ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Assigned: {new Date(piece.assigned_date).toLocaleDateString()}
                            </p>
                          ) : null}
                        </div>
                        <Button variant="outline" size="sm">
                          Practice
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-serif font-semibold mb-6 text-foreground">
                  Assignments
                </h2>

                {studentDataLoading ? (
                  <p className="text-muted-foreground">Loading assignments...</p>
                ) : studentAssignments.length === 0 ? (
                  <p className="text-muted-foreground">
                    No assignments yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {studentAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-foreground">
                              {assignment.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignment.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Type: {assignment.type}
                            </p>
                            {assignment.due_date ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-col gap-2 items-end">
                            <span className="text-xs px-2 py-1 rounded bg-secondary/20 text-foreground capitalize">
                              {assignment.status.replace("-", " ")}
                            </span>

                            <select
                              value={assignment.status}
                              onChange={(e) =>
                                handleStudentAssignmentStatusChange(
                                  assignment.id,
                                  e.target.value as "assigned" | "in-progress" | "submitted" | "completed"
                                )
                              }
                              className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
                            >
                              <option value="assigned">Assigned</option>
                              <option value="in-progress">In Progress</option>
                              <option value="submitted">Submitted</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : (
          <>
            <TeachingScheduleWidget />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Active Students
                    </p>
                    <p className="text-3xl font-serif font-semibold text-primary">
                      {students.length}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-secondary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      This Week
                    </p>
                    <p className="text-3xl font-serif font-semibold text-primary">
                      8
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">lessons</p>
                  </div>
                  <Calendar className="w-8 h-8 text-secondary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Exercises
                    </p>
                    <p className="text-3xl font-serif font-semibold text-primary">
                      12
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">created</p>
                  </div>
                  <Music className="w-8 h-8 text-secondary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Messages
                    </p>
                    <p className="text-3xl font-serif font-semibold text-primary">
                      3
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">unread</p>
                  </div>
                  <Target className="w-8 h-8 text-secondary" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-serif font-semibold mb-6 text-foreground">
                Your Students
              </h2>
              {studentsLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No students yet. Find and connect with students using the "Find Students" page.
                </p>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/5 transition cursor-pointer"
                    >
                      <div
                        className="flex items-center gap-4 flex-1"
                        onClick={() => navigate(`/student/${student.id}`)}
                      >
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-primary">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground hover:text-primary">
                            {student.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.primaryInstrument || "No instrument specified"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/student/${student.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </MainContent>
    </>
  );
}
