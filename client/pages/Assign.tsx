import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type StudentOption = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export default function Assign() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [studentId, setStudentId] = useState("");
  const [pieceName, setPieceName] = useState("");
  const [composer, setComposer] = useState("");
  const [notes, setNotes] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setStudentsLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const response = await fetch("/api/interactions/students", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load students.");
        }

        setStudents(data || []);
      } catch (error: any) {
        console.error("Load students error:", error);
        setErrorMessage(error.message || "Failed to load students.");
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, []);

  const handleAssign = async () => {
    setLoading(true);
    setResultMessage("");
    setErrorMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        throw new Error("You are not logged in.");
      }

      if (!studentId || !pieceName || !composer || !assignmentTitle || !assignmentDescription) {
        throw new Error("Please fill out all required fields.");
      }

      const pieceResponse = await fetch("/api/interactions/pieces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          pieceName,
          composer,
          notes,
        }),
      });

      const pieceData = await pieceResponse.json();

      if (!pieceResponse.ok) {
        throw new Error(pieceData?.error || "Failed to assign piece.");
      }

      const assignmentResponse = await fetch("/api/interactions/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          title: assignmentTitle,
          description: assignmentDescription,
          dueDate: dueDate || null,
        }),
      });

      const assignmentData = await assignmentResponse.json();

      if (!assignmentResponse.ok) {
        throw new Error(assignmentData?.error || "Failed to create assignment.");
      }

      setResultMessage("Assignment created successfully.");

      setStudentId("");
      setPieceName("");
      setComposer("");
      setNotes("");
      setAssignmentTitle("");
      setAssignmentDescription("");
      setDueDate("");
    } catch (error: any) {
      console.error("Assign flow error:", error);
      setErrorMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 700 }}>
      <h1>Assign Music</h1>
      <p>Create a piece assignment and practice task for a student.</p>

      <div style={{ marginTop: 24 }}>
        <label>Student *</label>
        {studentsLoading ? (
          <p style={{ marginTop: 8 }}>Loading students...</p>
        ) : (
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: 8, padding: 10 }}
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name?.trim()
                  ? `${student.name} (${student.email || student.id})`
                  : student.email || student.id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Piece Name *</label>
        <input
          value={pieceName}
          onChange={(e) => setPieceName(e.target.value)}
          placeholder="Enter piece name"
          style={{ display: "block", width: "100%", marginTop: 8, padding: 10 }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Composer *</label>
        <input
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder="Enter composer"
          style={{ display: "block", width: "100%", marginTop: 8, padding: 10 }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes for the piece"
          style={{ display: "block", width: "100%", marginTop: 8, padding: 10, minHeight: 80 }}
        />
      </div>

      <hr style={{ margin: "30px 0" }} />

      <div style={{ marginTop: 20 }}>
        <label>Assignment Title *</label>
        <input
          value={assignmentTitle}
          onChange={(e) => setAssignmentTitle(e.target.value)}
          placeholder="Enter assignment title"
          style={{ display: "block", width: "100%", marginTop: 8, padding: 10 }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Assignment Description *</label>
        <textarea
          value={assignmentDescription}
          onChange={(e) => setAssignmentDescription(e.target.value)}
          placeholder="Describe what the student should work on"
          style={{ display: "block", width: "100%", marginTop: 8, padding: 10, minHeight: 100 }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 8, padding: 10 }}
        />
      </div>

      {errorMessage ? (
        <p style={{ color: "red", marginTop: 20 }}>{errorMessage}</p>
      ) : null}

      {resultMessage ? (
        <p style={{ color: "green", marginTop: 20 }}>{resultMessage}</p>
      ) : null}

      <button
        onClick={handleAssign}
        disabled={loading || studentsLoading}
        style={{ marginTop: 24, padding: "12px 20px", cursor: "pointer" }}
      >
        {loading ? "Assigning..." : "Create Assignment"}
      </button>
    </div>
  );
}
