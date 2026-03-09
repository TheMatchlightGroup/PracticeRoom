import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context-supabase";
import { useToast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  date?: string;
  isAvailable?: boolean;
}

interface Booking {
  id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ScheduleProps {
  studentId: string;
  teacherId?: string;
}

export default function StudentDetailSchedule({ studentId, teacherId }: ScheduleProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [thisWeekAvailability, setThisWeekAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBookLesson, setShowBookLesson] = useState(false);

  const [newSlot, setNewSlot] = useState({ day: 0, startTime: "10:00", endTime: "11:00" });
  const [newBooking, setNewBooking] = useState({ date: "", startTime: "10:00", endTime: "11:00", notes: "" });

  // Fetch availability and bookings
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch this week's availability (with exceptions applied)
        const availResult = await apiGet(`/interactions/availability/this-week/${user.id}`);
        const availData = availResult.success && Array.isArray(availResult.data) ? availResult.data : [];

        // Fetch bookings for this student
        const bookingResult = await apiGet(`/interactions/bookings/${studentId}`);
        const bookingData = bookingResult.success && Array.isArray(bookingResult.data) ? bookingResult.data : [];

        setThisWeekAvailability(availData);
        setBookings(bookingData);
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, studentId]);


  const handleBookLesson = async () => {
    if (!user?.id || !newBooking.date) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Check if the selected time is available
    const selectedSlot = thisWeekAvailability.find(
      (slot) =>
        slot.date === newBooking.date &&
        slot.start_time === newBooking.startTime &&
        slot.end_time === newBooking.endTime
    );

    if (!selectedSlot || !selectedSlot.isAvailable) {
      toast({
        title: "Error",
        description: "This time slot is not available. Please select an available slot.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await apiPost("/interactions/bookings", {
        studentId,
        lessonDate: newBooking.date,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        notes: newBooking.notes || null,
      });

      if (!result.success) {
        toast({
          title: "Error",
          description: "Failed to book lesson: " + (result.error || "Unknown error"),
          variant: "destructive",
        });
        return;
      }

      // Refresh bookings
      const bookingResult = await apiGet(`/interactions/bookings/${studentId}`);
      const bookingData = bookingResult.success && Array.isArray(bookingResult.data) ? bookingResult.data : [];

      setBookings(bookingData);
      setShowBookLesson(false);
      setNewBooking({ date: "", startTime: "10:00", endTime: "11:00", notes: "" });
      toast({ title: "Success", description: "Lesson booked!" });
    } catch (err) {
      console.error("Error booking lesson:", err);
      toast({
        title: "Error",
        description: "Failed to book lesson",
        variant: "destructive",
      });
    }
  };

  // Group this week's slots by date
  const slotsByDate = thisWeekAvailability.reduce(
    (acc, slot) => {
      if (!acc[slot.date || ""]) {
        acc[slot.date || ""] = [];
      }
      acc[slot.date || ""].push(slot);
      return acc;
    },
    {} as Record<string, AvailabilitySlot[]>
  );

  return (
    <div className="space-y-6">
      {/* Teacher's Availability This Week */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Teacher's Availability This Week
        </h3>

        {loading ? (
          <p className="text-muted-foreground">Loading availability...</p>
        ) : thisWeekAvailability.length === 0 ? (
          <p className="text-muted-foreground">No availability slots set by the teacher.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(slotsByDate)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, slots]) => (
                <div key={date} className="border border-border rounded-lg p-4">
                  <p className="font-medium text-foreground mb-3">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <div
                        key={`${slot.date}-${slot.start_time}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                          slot.isAvailable
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-red-50 border border-red-200 text-red-700"
                        }`}
                      >
                        {slot.isAvailable ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>
                          {slot.start_time} - {slot.end_time}
                          {!slot.isAvailable && " (Blocked)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Book a Lesson */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Book a Lesson
          </h3>
          <Button
            onClick={() => setShowBookLesson(!showBookLesson)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Lesson
          </Button>
        </div>

        {showBookLesson && (
          <div className="bg-secondary/10 p-4 rounded-lg mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select a time slot from teacher's availability:
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded p-3 bg-background">
                {thisWeekAvailability.filter((s) => s.isAvailable).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available slots this week.</p>
                ) : (
                  thisWeekAvailability
                    .filter((s) => s.isAvailable)
                    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                    .map((slot) => (
                      <button
                        key={`${slot.date}-${slot.start_time}`}
                        onClick={() =>
                          setNewBooking({
                            date: slot.date || "",
                            startTime: slot.start_time,
                            endTime: slot.end_time,
                            notes: "",
                          })
                        }
                        className={`w-full text-left p-3 rounded border-2 transition ${
                          newBooking.date === slot.date &&
                          newBooking.startTime === slot.start_time &&
                          newBooking.endTime === slot.end_time
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium text-foreground text-sm">
                          {new Date((slot.date || "") + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { weekday: "short", month: "short", day: "numeric" }
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {slot.start_time} - {slot.end_time}
                        </p>
                      </button>
                    ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={newBooking.notes}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, notes: e.target.value })
                }
                placeholder="Any notes for the lesson..."
                className="w-full p-2 rounded border border-border bg-background text-foreground resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleBookLesson} size="sm">
                Book Lesson
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBookLesson(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Booked Lessons */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Booked Lessons
        </h3>

        {bookings.length === 0 ? (
          <p className="text-muted-foreground">No lessons booked yet.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 border border-border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-secondary mt-1" />
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(booking.lesson_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.start_time} - {booking.end_time}
                      </p>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {booking.notes}
                        </p>
                      )}
                    </div>
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
