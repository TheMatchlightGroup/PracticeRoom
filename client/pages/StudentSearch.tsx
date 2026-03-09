import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context-supabase";
import { supabase } from "@/lib/supabaseClient";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  primaryInstrument?: string;
  vocalRangeLow?: string;
  vocalRangeHigh?: string;
  experienceLevel?: string;
  goals?: string[];
  requestStatus?: "pending" | null;
}

export default function StudentSearch() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error("Not authenticated");
        }

        const params = new URLSearchParams();
        if (instrumentFilter !== "all") params.append("instrument", instrumentFilter);
        if (experienceLevelFilter !== "all")
          params.append("experienceLevel", experienceLevelFilter);

        const url = `/api/discovery/students?${params.toString()}`;
        console.log("Fetching students from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Response error:", {
            status: response.status,
            statusText: response.statusText,
            body: errorData,
          });
          throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Students data received:", data);
        setStudents(data.data || []);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(
          `Failed to load students: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudents();
    }
  }, [user, instrumentFilter, experienceLevelFilter]);

  // Handle invitation creation
  const handleInviteStudent = async (studentId: string) => {
    try {
      setActionLoading(studentId);

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/discovery/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: studentId,
          teacher_id: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send invitation");
      }

      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, requestStatus: "pending" } : s
        )
      );
    } catch (err) {
      console.error("Error inviting student:", err);
      setError(`Failed to send invitation: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter students locally
  const filteredStudents = students.filter((student) => {
    const studentName = student.name || student.email || "";
    const matchesSearch = studentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Find Students
          </h1>
          <p className="text-muted-foreground">
            Browse students looking for teachers and invite them to learn with you
          </p>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Instrument
              </label>
              <Select
                value={instrumentFilter}
                onValueChange={setInstrumentFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instruments</SelectItem>
                  <SelectItem value="Voice">Voice</SelectItem>
                  <SelectItem value="Piano">Piano</SelectItem>
                  <SelectItem value="Violin">Violin</SelectItem>
                  <SelectItem value="Cello">Cello</SelectItem>
                  <SelectItem value="Flute">Flute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Experience Level
              </label>
              <Select
                value={experienceLevelFilter}
                onValueChange={setExperienceLevelFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Students Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Avatar */}
                  <div className="h-24 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-2xl font-serif font-semibold text-primary">
                      {(student.name || student.email || "?").charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-1">
                      {student.name || student.email || "Unnamed Student"}
                    </h3>

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm">
                      {student.primaryInstrument && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Instrument</span>
                          <span className="font-medium text-foreground">
                            {student.primaryInstrument}
                          </span>
                        </div>
                      )}
                      {student.experienceLevel && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Level</span>
                          <span className="font-medium text-foreground">
                            {student.experienceLevel}
                          </span>
                        </div>
                      )}
                      {student.vocalRangeLow && student.vocalRangeHigh && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Vocal Range</span>
                          <span className="font-medium text-foreground">
                            {student.vocalRangeLow} - {student.vocalRangeHigh}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Goals */}
                    {student.goals && student.goals.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs text-muted-foreground mb-2">Goals</p>
                        <div className="flex flex-wrap gap-2">
                          {student.goals.map((goal) => (
                            <span
                              key={goal}
                              className="px-2 py-1 bg-secondary text-xs font-medium text-primary rounded"
                            >
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    <Button
                      className="w-full"
                      disabled={
                        student.requestStatus === "pending" ||
                        actionLoading === student.id
                      }
                      onClick={() => handleInviteStudent(student.id)}
                    >
                      {actionLoading === student.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Inviting...
                        </>
                      ) : student.requestStatus === "pending" ? (
                        "Invitation Sent"
                      ) : (
                        "Send Invitation"
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {filteredStudents.length === 0 && !loading && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No students found matching your criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setInstrumentFilter("all");
                    setExperienceLevelFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            )}
          </>
        )}
      </MainContent>
    </>
  );
}
