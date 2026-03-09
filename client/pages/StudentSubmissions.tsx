import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Navigation, MainContent } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentSubmissions() {
  const [category, setCategory] = useState<"piece" | "lesson" | "freeform">("freeform");
  const [pieceId, setPieceId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage("");
    setResultMessage("");

    try {
      if (!file) {
        throw new Error("Please choose an audio file.");
      }

      if (category === "piece" && !pieceId.trim()) {
        throw new Error("Piece ID is required for piece submissions.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        throw new Error("You are not logged in.");
      }

      const audioData = await fileToBase64(file);

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          audioData,
          audioSize: file.size,
          mimeType: file.type || "audio/webm",
          category,
          pieceId: category === "piece" ? pieceId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit audio.");
      }

      setResultMessage("Audio submission uploaded successfully.");
      setFile(null);
      setPieceId("");
      const input = document.getElementById("audio-file-input") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error: any) {
      console.error("Student submission error:", error);
      setErrorMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Submit Recording
          </h1>
          <p className="text-muted-foreground">
            Upload an audio recording for teacher review.
          </p>
        </div>

        <Card className="p-6 max-w-2xl">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Submission Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as "piece" | "lesson" | "freeform")
                }
                className="w-full p-2 rounded border border-border bg-background text-foreground"
              >
                <option value="freeform">Freeform</option>
                <option value="lesson">Lesson</option>
                <option value="piece">Piece</option>
              </select>
            </div>

            {category === "piece" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Piece ID
                </label>
                <input
                  type="text"
                  value={pieceId}
                  onChange={(e) => setPieceId(e.target.value)}
                  placeholder="Enter assigned piece ID"
                  className="w-full p-2 rounded border border-border bg-background text-foreground"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Audio File
              </label>
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full p-2 rounded border border-border bg-background text-foreground"
              />
              {file ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name}
                </p>
              ) : null}
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : null}

            {resultMessage ? (
              <p className="text-sm text-green-600">{resultMessage}</p>
            ) : null}

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Uploading..." : "Submit Recording"}
            </Button>
          </div>
        </Card>
      </MainContent>
    </>
  );
}
