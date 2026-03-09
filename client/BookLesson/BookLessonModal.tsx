import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { CheckCircle, AlertCircle } from "lucide-react";

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  date: string;
  isAvailable: boolean;
}

interface BookLessonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  studentId: string;
  teacherName?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function BookLessonModal({
  isOpen,
  onOpenChange,
  teacherId,
  studentId,
  teacherName = "Your Teacher",
}: BookLessonModalProps) {
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeacherAvailability();
    }
  }, [isOpen, teacherId]);

  const fetchTeacherAvailability = async () => {
    setIsLoading(true);
    try {
      const result = await apiGet(
        `/interactions/availability/this-week/${teacherId}`
      );
      if (result.success && Array.isArray(result.data)) {
        setSlots(result.data);
      }
    } catch (err) {
      console.error("Error fetching availability:", err);
      toast({
        title: "Error",
        description: "Failed to load teacher availability",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookLesson = async () => {
    if (!selectedSlot) {
      toast({
        title: "Error",
        description: "Please select a time slot",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      const result = await apiPost("/interactions/bookings", {
        studentId,
        lessonDate: selectedSlot.date,
        startTime: selectedSlot.start_time,
        endTime: selectedSlot.end_time,
        notes: notes || null,
      });

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your lesson has been booked!",
        });
        setSelectedSlot(null);
        setNotes("");
        onOpenChange(false);
        // Refresh parent component if needed
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to book lesson",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error booking lesson:", err);
      toast({
        title: "Error",
        description: "Failed to book lesson",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    },
    {} as Record<string, AvailabilitySlot[]>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Book a Lesson</DialogTitle>
          <DialogDescription>
            Select an available time slot with {teacherName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Availability Slots */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {teacherName}'s Availability This Week
            </h3>

            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">
                Loading availability...
              </p>
            ) : slots.filter((s) => s.isAvailable).length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  No available slots this week. Please try again next week.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(slotsByDate)
                  .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                  .map(([date, dateSlots]) => (
                    <div key={date}>
                      <p className="font-medium text-foreground mb-2 text-sm">
                        {new Date(date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {dateSlots.map((slot) => (
                          <button
                            key={`${slot.date}-${slot.start_time}`}
                            onClick={() =>
                              slot.isAvailable && setSelectedSlot(slot)
                            }
                            disabled={!slot.isAvailable}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                              slot.isAvailable
                                ? selectedSlot?.date === slot.date &&
                                  selectedSlot?.start_time === slot.start_time
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50 cursor-pointer"
                                : "border-border bg-muted opacity-50 cursor-not-allowed"
                            }`}
                          >
                            {slot.isAvailable ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">
                              {slot.start_time} - {slot.end_time}
                            </span>
                            {!slot.isAvailable && (
                              <span className="text-xs text-muted-foreground">
                                Blocked
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Selected Slot Summary */}
          {selectedSlot && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Selected: </span>
                {new Date(selectedSlot.date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "short", day: "numeric" }
                )}{" "}
                from {selectedSlot.start_time} to {selectedSlot.end_time}
              </p>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Notes (Optional)
            </Label>
            <Input
              placeholder="Add any notes for your teacher..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBooking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookLesson}
              disabled={!selectedSlot || isBooking}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isBooking ? "Booking..." : "Book Lesson"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
