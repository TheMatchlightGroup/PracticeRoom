import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context-supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Target, CheckCircle, AlertCircle } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: "exercise" | "practice-plan";
  status: "assigned" | "in_progress" | "submitted" | "completed";
  due_date: string | null;
  created_at?: string | null;
}

interface AssignmentsProps {
  studentId: string;
}

export default function StudentDetailAssignments({ studentId }: AssignmentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAssignment, setShowAddAssignment] = useState(false);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const fetchAssignments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("student_assignments")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("student_id", studentId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching assignments:", error);
        toast({
          title: "Error",
          description: "Failed to load assignments",
          variant: "destructive",
        });
        return;
      }

      setAssignments((data as Assignment[]) || []);
    } catch (err) {
      console.error("Error in fetchAssignments:", err);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchAssignments();
  }, [user?.id, studentId]);

  const handleAddAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.description.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("student_assignments")
        .insert([
          {
            teacher_id: user.id,
            student_id: studentId,
            title: newAssignment.title.trim(),
            description: newAssignment.description.trim(),
            type: "exercise",
            status: "assigned",
            due_date: newAssignment.dueDate || null,
          },
        ]);

      if (error) {
        console.error("Error creating assignment:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create assignment",
          variant: "destructive",
        });
        return;
      }

      await fetchAssignments();
      setShowAddAssignment(false);
      setNewAssignment({ title: "", description: "", dueDate: "" });

      toast({
        title: "Success",
        description: "Assignment created!",
      });
    } catch (err) {
      console.error("Error adding assignment:", err);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("student_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) {
        console.error("Error deleting assignment:", error);
        toast({
          title: "Error",
          description: "Failed to delete assignment",
          variant: "destructive",
        });
        return;
      }

      setAssignments(assignments.filter((a) => a.id !== assignmentId));
      toast({
        title: "Success",
        description: "Assignment deleted!",
      });
    } catch (err) {
      console.error("Error deleting assignment:", err);
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    assignmentId: string,
    newStatus: "assigned" | "in_progress" | "submitted" | "completed"
  ) => {
    try {
      const { error } = await supabase
        .from("student_assignments")
        .update({ status: newStatus })
        .eq("id", assignmentId);

      if (error) {
        console.error("Error updating assignment status:", error);
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
        return;
      }

      setAssignments(
        assignments.map((a) =>
          a.id === assignmentId ? { ...a, status: newStatus } : a
        )
      );

      toast({
        title: "Success",
        description: "Status updated!",
      });
    } catch (err) {
      console.error("Error updating status:", err);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "submitted":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Target className="w-4 h-4 text-secondary" />;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    return !!dueDate && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Assignments
          </h3>
          <Button
            onClick={() => setShowAddAssignment(!showAddAssignment)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </Button>
        </div>

        {showAddAssignment && (
          <div className="bg-secondary/10 p-4 rounded-lg mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={newAssignment.title}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, title: e.target.value })
                }
                placeholder="e.g., Practice scales in all keys"
                className="w-full p-2 rounded border border-border bg-background text-foreground placeholder-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={newAssignment.description}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, description: e.target.value })
                }
                placeholder="Detailed instructions for the assignment..."
                className="w-full p-2 rounded border border-border bg-background text-foreground placeholder-muted-foreground resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={newAssignment.dueDate}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, dueDate: e.target.value })
                }
                className="w-full p-2 rounded border border-border bg-background text-foreground"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAssignment} size="sm">
                Create Assignment
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddAssignment(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="text-muted-foreground">
            No assignments yet. Create one to get started!
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`p-4 border rounded-lg transition ${
                  isOverdue(assignment.due_date) &&
                  assignment.status !== "completed"
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(assignment.status)}
                      <div>
                        <p className="font-semibold text-foreground">
                          {assignment.title}
                        </p>
                        {isOverdue(assignment.due_date) &&
                          assignment.status !== "completed" && (
                            <p className="text-xs text-red-600">
                              Overdue: {new Date(assignment.due_date!).toLocaleDateString()}
                            </p>
                          )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground mb-2 ml-7">
                      {assignment.description}
                    </p>

                    {assignment.due_date && (
                      <p className="text-xs text-muted-foreground ml-7">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <select
                      value={assignment.status}
                      onChange={(e) =>
                        handleStatusChange(
                          assignment.id,
                          e.target.value as "assigned" | "in_progress" | "submitted" | "completed"
                        )
                      }
                      className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
                    >
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="completed">Completed</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
