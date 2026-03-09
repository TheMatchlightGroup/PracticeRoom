import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context-supabase";
import { supabase } from "@/lib/supabaseClient";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface Request {
  id: string;
  teacherId?: string;
  teacherName?: string;
  teacherEmail?: string;
  teacherProfilePhoto?: string;
  teacherProfile?: any;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  studentProfilePhoto?: string;
  studentProfile?: any;
  requestType: "student_requested" | "teacher_invited";
  createdAt: string;
}

export default function RequestsCenter() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<Request[]>([]);
  const [outgoing, setOutgoing] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth token
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) throw new Error("Not authenticated");

        const response = await fetch("/api/discovery/requests", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch requests");
        }

        const data = await response.json();
        setIncoming(data.incoming || []);
        setOutgoing(data.outgoing || []);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError(`Failed to load requests: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRequests();
    }
  }, [user]);

  // Handle accept request
  const handleAccept = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      setError(null);

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/discovery/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to accept request");
      }

      // Remove from incoming list
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
      setSuccessMessage("Request accepted! You're now connected.");

      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error accepting request:", err);
      setError(`Failed to accept request: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle decline request
  const handleDecline = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      setError(null);

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/discovery/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "archived", archive_reason: "declined" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to decline request");
      }

      // Remove from incoming list
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
      setSuccessMessage("Request declined.");

      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error declining request:", err);
      setError(`Failed to decline request: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Connection Requests
          </h1>
          <p className="text-muted-foreground">
            Manage your incoming and outgoing connection requests
          </p>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </Card>
        )}

        {successMessage && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Incoming Requests */}
            <div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-4">
                Incoming Requests
              </h2>
              {incoming.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No incoming requests</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {incoming.map((request) => (
                    <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
                      {/* Avatar & Basic Info */}
                      <div className="flex gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-serif font-semibold text-white">
                            {user?.role === "teacher"
                              ? request.studentName?.charAt(0).toUpperCase()
                              : request.teacherName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif font-semibold text-foreground">
                            {user?.role === "teacher"
                              ? request.studentName
                              : request.teacherName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user?.role === "teacher" ? "Student" : "Teacher"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Profile Details */}
                      {user?.role === "teacher" && request.studentProfile && (
                        <div className="mb-4 p-3 bg-secondary/50 rounded text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Instrument:</span>{" "}
                            <span className="font-medium">
                              {request.studentProfile.primaryInstrument}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Level:</span>{" "}
                            <span className="font-medium">
                              {request.studentProfile.experienceLevel}
                            </span>
                          </div>
                          {request.studentProfile.goals?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Goals:</span>{" "}
                              <span className="font-medium">
                                {request.studentProfile.goals.join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {user?.role === "student" && request.teacherProfile && (
                        <div className="mb-4 p-3 bg-secondary/50 rounded text-sm space-y-1">
                          {request.teacherProfile.bio && (
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Bio:</p>
                              <p className="font-medium line-clamp-2">
                                {request.teacherProfile.bio}
                              </p>
                            </div>
                          )}
                          {request.teacherProfile.instrumentsTaught?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Instruments:</span>{" "}
                              <span className="font-medium">
                                {request.teacherProfile.instrumentsTaught.join(", ")}
                              </span>
                            </div>
                          )}
                          {request.teacherProfile.yearExperience && (
                            <div>
                              <span className="text-muted-foreground">Experience:</span>{" "}
                              <span className="font-medium">
                                {request.teacherProfile.yearsExperience} years
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          className="flex-1"
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => handleDecline(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Declining...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-4">
                Pending Requests
              </h2>
              {outgoing.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No pending requests</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {outgoing.map((request) => (
                    <Card key={request.id} className="p-6 hover:shadow-md transition-shadow opacity-75">
                      {/* Avatar & Basic Info */}
                      <div className="flex gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-serif font-semibold text-white">
                            {user?.role === "teacher"
                              ? request.studentName?.charAt(0).toUpperCase()
                              : request.teacherName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif font-semibold text-foreground">
                            {user?.role === "teacher"
                              ? request.studentName
                              : request.teacherName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user?.role === "teacher"
                              ? "Student"
                              : "Teacher"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-700 font-medium">
                            Awaiting response...
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && incoming.length === 0 && outgoing.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No requests yet. Start by{" "}
              {user?.role === "student"
                ? "browsing teachers"
                : "browsing students"}
              !
            </p>
            <Button
              onClick={() =>
                (window.location.href =
                  user?.role === "student"
                    ? "/marketplace"
                    : "/student-search")
              }
            >
              Browse {user?.role === "student" ? "Teachers" : "Students"}
            </Button>
          </Card>
        )}
      </MainContent>
    </>
  );
}
