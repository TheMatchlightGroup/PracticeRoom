import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context-supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Music, CheckCircle, AlertCircle } from "lucide-react";

interface AssignedPiece {
  id: string;
  piece_name: string;
  composer: string;
  status: "assigned" | "in_progress" | "completed";
  assigned_date: string;
  notes?: string;
}

interface PiecesProps {
  studentId: string;
}

export default function StudentDetailPieces({ studentId }: PiecesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pieces, setPieces] = useState<AssignedPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPiece, setShowAddPiece] = useState(false);
  
  const [newPiece, setNewPiece] = useState({
    pieceName: "",
    composer: "",
    notes: "",
  });

  // Fetch assigned pieces
  useEffect(() => {
    if (!user?.id) return;

    const fetchPieces = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("assigned_pieces")
          .select("*")
          .eq("teacher_id", user.id)
          .eq("student_id", studentId)
          .order("assigned_date", { ascending: false });

        if (error) {
          console.error("Error fetching pieces:", error);
          return;
        }

        setPieces(data || []);
      } catch (err) {
        console.error("Error in fetchPieces:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPieces();
  }, [user?.id, studentId]);

  const handleAddPiece = async () => {
    if (!newPiece.pieceName.trim() || !newPiece.composer.trim() || !user?.id) {
      toast({
        title: "Error",
        description: "Please fill in piece name and composer",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("assigned_pieces")
        .insert([
          {
            teacher_id: user.id,
            student_id: studentId,
            piece_name: newPiece.pieceName,
            composer: newPiece.composer,
            status: "assigned",
            notes: newPiece.notes || null,
            assigned_date: new Date().toISOString(),
          },
        ]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to assign piece",
          variant: "destructive",
        });
        return;
      }

      // Refresh pieces
      const { data } = await supabase
        .from("assigned_pieces")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("student_id", studentId)
        .order("assigned_date", { ascending: false });

      setPieces(data || []);
      setShowAddPiece(false);
      setNewPiece({ pieceName: "", composer: "", notes: "" });
      toast({ title: "Success", description: "Piece assigned!" });
    } catch (err) {
      console.error("Error adding piece:", err);
      toast({
        title: "Error",
        description: "Failed to assign piece",
        variant: "destructive",
      });
    }
  };

  const handleDeletePiece = async (pieceId: string) => {
    try {
      const { error } = await supabase
        .from("assigned_pieces")
        .delete()
        .eq("id", pieceId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete piece",
          variant: "destructive",
        });
        return;
      }

      setPieces(pieces.filter((p) => p.id !== pieceId));
      toast({ title: "Success", description: "Piece removed!" });
    } catch (err) {
      console.error("Error deleting piece:", err);
    }
  };

  const handleStatusChange = async (
    pieceId: string,
    newStatus: "assigned" | "in_progress" | "completed"
  ) => {
    try {
      const { error } = await supabase
        .from("assigned_pieces")
        .update({ status: newStatus })
        .eq("id", pieceId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
        return;
      }

      setPieces(
        pieces.map((p) =>
          p.id === pieceId ? { ...p, status: newStatus } : p
        )
      );
      toast({ title: "Success", description: "Status updated!" });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Music className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Assigned Pieces
          </h3>
          <Button
            onClick={() => setShowAddPiece(!showAddPiece)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign Piece
          </Button>
        </div>

        {showAddPiece && (
          <div className="bg-secondary/10 p-4 rounded-lg mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Piece Name
              </label>
              <input
                type="text"
                value={newPiece.pieceName}
                onChange={(e) =>
                  setNewPiece({ ...newPiece, pieceName: e.target.value })
                }
                placeholder="e.g., O Mio Babbino Caro"
                className="w-full p-2 rounded border border-border bg-background text-foreground placeholder-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Composer
              </label>
              <input
                type="text"
                value={newPiece.composer}
                onChange={(e) =>
                  setNewPiece({ ...newPiece, composer: e.target.value })
                }
                placeholder="e.g., Puccini"
                className="w-full p-2 rounded border border-border bg-background text-foreground placeholder-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={newPiece.notes}
                onChange={(e) =>
                  setNewPiece({ ...newPiece, notes: e.target.value })
                }
                placeholder="Any special notes or instructions..."
                className="w-full p-2 rounded border border-border bg-background text-foreground placeholder-muted-foreground resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddPiece} size="sm">
                Assign Piece
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddPiece(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading pieces...</p>
        ) : pieces.length === 0 ? (
          <p className="text-muted-foreground">
            No pieces assigned yet. Start by assigning a piece!
          </p>
        ) : (
          <div className="space-y-3">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className="p-4 border border-border rounded-lg hover:bg-secondary/5 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(piece.status)}
                      <div>
                        <p className="font-semibold text-foreground">
                          {piece.piece_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {piece.composer}
                        </p>
                      </div>
                    </div>

                    {piece.notes && (
                      <p className="text-sm text-muted-foreground mt-2 ml-7">
                        {piece.notes}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-2 ml-7">
                      Assigned {new Date(piece.assigned_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <select
                      value={piece.status}
                      onChange={(e) =>
                        handleStatusChange(
                          piece.id,
                          e.target.value as "assigned" | "in_progress" | "completed"
                        )
                      }
                      className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
                    >
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePiece(piece.id)}
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
