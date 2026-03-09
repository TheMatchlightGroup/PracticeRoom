import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Play, Pause } from "lucide-react";

interface Submission {
  id: string;
  student_name: string;
  category: string;
  created_at: string;
  status: string;
  audio_blob_url: string;
  teacher_notes?: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  submission: Submission;
  onClose: () => void;
  onSubmit: (submissionId: string, status: string, notes?: string) => Promise<void>;
}

export default function ReviewModal({
  isOpen,
  submission,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    (submission.status as any) || "pending"
  );
  const [notes, setNotes] = useState(submission.teacher_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(submission.id, status, notes);
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Review Submission
            </h2>
            <p className="text-muted-foreground text-sm">
              {submission.student_name} • {submission.category.charAt(0).toUpperCase() + submission.category.slice(1)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submission Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-xs text-muted-foreground">
            Submitted on{" "}
            {new Date(submission.created_at).toLocaleDateString()} at{" "}
            {new Date(submission.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Audio Player */}
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3">Recording</h3>
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-blue-100 rounded-full transition flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-blue-600" />
              ) : (
                <Play className="w-6 h-6 text-blue-600" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {isPlaying ? "Playing..." : "Ready to play"}
              </p>
              <audio
                ref={audioRef}
                src={submission.audio_blob_url}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3">Status</h3>
          <div className="grid grid-cols-3 gap-3">
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`p-3 rounded-lg border-2 transition font-medium capitalize ${
                  status === s
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white text-foreground hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label htmlFor="notes" className="block font-medium text-foreground mb-2">
            Feedback Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add feedback for the student (optional)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Review"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
