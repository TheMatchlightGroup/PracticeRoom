import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Send, X } from "lucide-react";

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    category: "piece" | "lesson" | "freeform";
    pieceId?: string;
  }) => Promise<void>;
  pieces?: Array<{ id: string; title: string }>;
  isLoading?: boolean;
}

export default function SubmitModal({
  isOpen,
  onClose,
  onSubmit,
  pieces = [],
  isLoading = false,
}: SubmitModalProps) {
  const [category, setCategory] = useState<"piece" | "lesson" | "freeform">(
    "freeform"
  );
  const [pieceId, setPieceId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (category === "piece" && !pieceId) {
      setError("Please select a piece");
      return;
    }

    try {
      await onSubmit({
        category,
        pieceId: category === "piece" ? pieceId : undefined,
      });
      // Reset form
      setCategory("freeform");
      setPieceId("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Submit to Teacher
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as any);
                setPieceId("");
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-input rounded bg-background text-foreground"
            >
              <option value="freeform">Freeform</option>
              <option value="piece">Piece</option>
              <option value="lesson">Lesson</option>
            </select>
          </div>

          {/* Piece selector (conditional) */}
          {category === "piece" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Piece
              </label>
              {pieces.length > 0 ? (
                <select
                  value={pieceId}
                  onChange={(e) => setPieceId(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-input rounded bg-background text-foreground"
                >
                  <option value="">Choose a piece...</option>
                  {pieces.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground p-2 bg-secondary rounded">
                  No pieces available. Create a piece first.
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info message */}
          <p className="text-xs text-muted-foreground bg-secondary p-3 rounded">
            Your teacher will be able to review this recording and provide
            feedback.
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
