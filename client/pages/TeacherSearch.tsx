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
import { Star, Loader2 } from "lucide-react";

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  bio?: string;
  methodsUsed?: string[];
  instrumentsTaught?: string[];
  yearsExperience?: number;
  hourlyRate?: number;
  requestStatus?: "pending" | null;
}

export default function TeacherSearch() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [maxRateFilter, setMaxRateFilter] = useState("all");
  const [minExperienceFilter, setMinExperienceFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
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
        if (methodFilter !== "all") params.append("method", methodFilter);
        if (maxRateFilter !== "all") params.append("maxRate", maxRateFilter);
        if (minExperienceFilter !== "all") params.append("minExperience", minExperienceFilter);

        const url = `/api/discovery/teachers?${params.toString()}`;
        console.log("Fetching teachers from:", url);

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
          throw new Error(`Failed to fetch teachers: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Teachers data received:", data);
        setTeachers(data.data || []);
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setError(
          `Failed to load teachers: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTeachers();
    }
  }, [user, instrumentFilter, methodFilter, maxRateFilter, minExperienceFilter]);

  // Handle request creation
  const handleRequestTeacher = async (teacherId: string) => {
    try {
      setActionLoading(teacherId);

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
          student_id: user?.id,
          teacher_id: teacherId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send request");
      }

      // Update local state
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === teacherId ? { ...t, requestStatus: "pending" } : t
        )
      );
    } catch (err) {
      console.error("Error requesting teacher:", err);
      setError(`Failed to send request: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter teachers locally
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.methodsUsed || []).some((m) =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesSearch;
  });

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Find a Teacher
          </h1>
          <p className="text-muted-foreground">
            Browse available teachers and request to join their lessons
          </p>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Name, bio, or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Instrument
              </label>
              <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
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
                Method
              </label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Vaccai">Vaccai</SelectItem>
                  <SelectItem value="Lamperti">Lamperti</SelectItem>
                  <SelectItem value="Garcia">Garcia</SelectItem>
                  <SelectItem value="Bel Canto">Bel Canto</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Max Rate
              </label>
              <Select value={maxRateFilter} onValueChange={setMaxRateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="50">Under $50</SelectItem>
                  <SelectItem value="100">Under $100</SelectItem>
                  <SelectItem value="150">Under $150</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Experience
              </label>
              <Select value={minExperienceFilter} onValueChange={setMinExperienceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Level</SelectItem>
                  <SelectItem value="5">5+ years</SelectItem>
                  <SelectItem value="10">10+ years</SelectItem>
                  <SelectItem value="15">15+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Teachers Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher) => (
                <Card
                  key={teacher.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Avatar */}
                  <div className="h-24 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-2xl font-serif font-semibold text-primary">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-1">
                      {teacher.name}
                    </h3>

                    {/* Bio */}
                    {teacher.bio && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {teacher.bio}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm">
                      {teacher.instrumentsTaught && teacher.instrumentsTaught.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Instruments</span>
                          <span className="font-medium text-foreground">
                            {teacher.instrumentsTaught.join(", ")}
                          </span>
                        </div>
                      )}
                      {teacher.yearsExperience && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Experience</span>
                          <span className="font-medium text-foreground">
                            {teacher.yearsExperience} years
                          </span>
                        </div>
                      )}
                      {teacher.hourlyRate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rate</span>
                          <span className="font-medium text-foreground">
                            ${teacher.hourlyRate}/hr
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Methods */}
                    {teacher.methodsUsed && teacher.methodsUsed.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs text-muted-foreground mb-2">Methods</p>
                        <div className="flex flex-wrap gap-2">
                          {teacher.methodsUsed.map((method) => (
                            <span
                              key={method}
                              className="px-2 py-1 bg-secondary text-xs font-medium text-primary rounded"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    <Button
                      className="w-full"
                      disabled={teacher.requestStatus === "pending" || actionLoading === teacher.id}
                      onClick={() => handleRequestTeacher(teacher.id)}
                    >
                      {actionLoading === teacher.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : teacher.requestStatus === "pending" ? (
                        "Request Pending"
                      ) : (
                        "Request to Join"
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {filteredTeachers.length === 0 && !loading && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No teachers found matching your criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setInstrumentFilter("all");
                    setMethodFilter("all");
                    setMaxRateFilter("all");
                    setMinExperienceFilter("all");
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
