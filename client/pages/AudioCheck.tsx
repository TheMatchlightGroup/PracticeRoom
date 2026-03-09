import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SubmitModal from "@/components/SubmitModal";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { supabase } from "@/lib/supabaseClient";
import { Mic, Play, AlertCircle, CheckCircle, Music, Wifi, WifiOff, Upload } from "lucide-react";

interface Submission {
  id: string;
  created_at: string;
  category: "piece" | "lesson" | "freeform";
  status: "pending" | "approved" | "rejected";
  teacher_notes?: string;
  marked_successful_at?: string;
}

export default function AudioCheck() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isRetryingPermission, setIsRetryingPermission] = useState(false);

  const { state: recorderState, startRecording, stopRecording, playRecording, cancelRecording } = useAudioRecorder();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Show permission dialog when permission is denied
  useEffect(() => {
    if (recorderState.permission === "denied" && recorderState.error) {
      setShowPermissionDialog(true);
    }
  }, [recorderState.permission, recorderState.error]);

  // Handle retrying microphone permission
  const handleRetryPermission = async () => {
    setIsRetryingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      // Permission granted! Close dialog and stop the stream
      stream.getTracks().forEach((track) => track.stop());
      setShowPermissionDialog(false);
    } catch (err) {
      // Still denied, keep dialog open
      console.log("Microphone permission still denied:", err);
    } finally {
      setIsRetryingPermission(false);
    }
  };

  // Load submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!isAuthenticated) return;

      try {
        setLoadingSubmissions(true);
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        if (!token) return;

        const submissionsRes = await fetch("/api/submissions?limit=20", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (submissionsRes.ok) {
          const { data } = await submissionsRes.json();
          setSubmissions(data || []);
        }
      } catch (err) {
        console.error("Failed to load submissions:", err);
        setError("Failed to load submissions");
      } finally {
        setLoadingSubmissions(false);
      }
    };

    loadSubmissions();
  }, [isAuthenticated]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // Format bytes to KB/MB
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (!blob) {
      setError("Recording failed. No audio data captured.");
    }
  };

  // Handle submit to teacher
  const handleSubmitToTeacher = async (submitData: {
    category: "piece" | "lesson" | "freeform";
    pieceId?: string;
  }) => {
    if (!recorderState.recordedBlob) {
      setError("No recording to submit");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        setError("Not authenticated");
        return;
      }

      // Convert blob to base64 for transmission
      console.log("🔄 Converting audio blob to base64...");
      console.log(`   Blob Size: ${recorderState.recordedBlob.size} bytes`);
      console.log(`   Blob Type: ${recorderState.recordedBlob.type}`);

      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part (remove "data:audio/webm;base64," prefix)
          const base64 = result.split(",")[1] || result;
          resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(recorderState.recordedBlob);
      });

      // Submit audio blob and metadata to API
      // Backend will handle storage upload using service role
      const submitPayload = {
        audioData: audioBase64,
        audioSize: recorderState.recordedBlob.size,
        mimeType: recorderState.recordedBlob.type || "audio/webm",
        category: submitData.category,
        pieceId: submitData.pieceId || null,
      };

      console.log("📤 Sending audio to backend for processing...");
      console.log(`   Audio size (encoded): ${audioBase64.length} bytes`);
      console.log(`   Category: ${submitData.category}`);

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitPayload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      // Reload submissions
      const submissionsRes = await fetch("/api/submissions?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (submissionsRes.ok) {
        const { data } = await submissionsRes.json();
        setSubmissions(data || []);
      }

      // Reset form
      cancelRecording();
      setShowSubmitModal(false);

      // Show success
      setError(null);
      setTimeout(() => {
        setError(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const hasRecording = recorderState.recordedBlob !== null;

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Audio Check
          </h1>
          <p className="text-muted-foreground">
            Record a clip and send it to your teacher
          </p>
        </div>

        {/* Recording */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recording</h2>

          {/* Mic connection status */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            {recorderState.streamConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">Mic: Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-400" />
                <span className="text-muted-foreground">Mic: Not connected</span>
              </>
            )}
          </div>

          {/* Error messages */}
          {recorderState.error && (
            <div className="flex gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{recorderState.error}</p>
            </div>
          )}

          {/* Duration and status */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-mono font-bold text-foreground">
              {formatDuration(recorderState.duration)}
            </span>
            <span className="text-sm text-muted-foreground">
              {recorderState.isRecording ? "Recording..." : "Ready"}
            </span>
          </div>

          {/* Recording controls */}
          <div className="flex gap-2 mb-4">
            {!recorderState.isRecording ? (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button onClick={handleStopRecording} variant="destructive" className="gap-2">
                  Stop
                </Button>
                <Button onClick={cancelRecording} variant="outline">
                  Cancel
                </Button>
              </>
            )}

            {hasRecording && (
              <Button onClick={playRecording} variant="outline" className="gap-2">
                <Play className="w-4 h-4" />
                Play
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Record 10–20 seconds. Maximum 30 seconds.
          </p>

          {/* Diagnostics panel */}
          {hasRecording && (
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <p>📊 <strong>File:</strong></p>
              <p>Size: {formatBytes(recorderState.blobSize)}</p>
              <p>Type: {recorderState.recordedBlob?.type || "audio/webm"}</p>
              {recorderState.blobSize === 0 && (
                <p className="text-red-600 font-medium">
                  ⚠️ Recording failed (0 bytes). Try allowing microphone permission or using Chrome/Firefox.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Submit Button */}
        {hasRecording && (
          <Button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="mb-6 w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Send to Teacher
              </>
            )}
          </Button>
        )}

        {/* Error message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {/* Submissions */}
        {loadingSubmissions ? (
          <p className="text-muted-foreground">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <Card className="p-8 text-center">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No submissions yet. Record and send your first clip!
            </p>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Your Submissions
            </h2>

            <div className="space-y-3">
              {submissions.map((submission) => {
                const statusColor =
                  submission.status === "approved"
                    ? "bg-green-50 border-green-200"
                    : submission.status === "rejected"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200";

                const statusIcon =
                  submission.status === "approved" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : submission.status === "rejected" ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Music className="w-5 h-5 text-yellow-600" />
                  );

                return (
                  <div
                    key={submission.id}
                    className={`p-4 border rounded ${statusColor}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcon}
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {submission.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.created_at).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(submission.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-white/50 font-medium capitalize">
                        {submission.status}
                      </span>
                    </div>

                    {submission.teacher_notes && (
                      <div className="mt-3 p-2 bg-white/50 rounded text-sm">
                        <p className="font-medium text-foreground mb-1">
                          Feedback:
                        </p>
                        <p className="text-muted-foreground">
                          {submission.teacher_notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </MainContent>

      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmitToTeacher}
        isLoading={isSubmitting}
      />

      {/* Microphone Permission Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <div className="flex gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-foreground">
                Microphone Permission Required
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              To record audio clips, we need access to your microphone.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6 text-sm text-blue-900">
              <p className="font-medium mb-2">If permission was denied:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Chrome:</strong> Click the lock icon in the address bar, find Microphone, and select "Allow"</li>
                <li><strong>Firefox:</strong> Look for the microphone icon in the address bar and grant permission</li>
                <li><strong>Safari:</strong> Go to Preferences → Security and allow microphone access</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRetryPermission}
                disabled={isRetryingPermission}
                className="w-full"
              >
                {isRetryingPermission ? "Requesting..." : "Try Again"}
              </Button>
              <Button
                onClick={() => setShowPermissionDialog(false)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
