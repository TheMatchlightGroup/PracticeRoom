import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context-supabase";
import { apiGet } from "@/lib/api";
import { Calendar } from "lucide-react";

interface SlotWithDate {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  date: string;
  isAvailable: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TeachingScheduleWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<SlotWithDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchThisWeekSlots();
    }
  }, [user?.id]);

  const fetchThisWeekSlots = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const result = await apiGet(`/interactions/availability/this-week/${user.id}`);
      if (result.success && Array.isArray(result.data)) {
        setSlots(result.data);
      }
    } catch (err) {
      console.error("Error fetching this week's availability:", err);
    } finally {
      setIsLoading(false);
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
    {} as Record<string, SlotWithDate[]>
  );

  // Get dates for this week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekDates: Array<{ date: string; dayName: string }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    weekDates.push({
      date: dateStr,
      dayName: DAYS[d.getDay()],
    });
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-serif font-semibold mb-6 text-foreground">
          Your Teaching Schedule This Week
        </h2>
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-serif font-semibold text-foreground">
            Your Teaching Schedule This Week
          </h2>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/settings")}
          variant="outline"
        >
          Edit Schedule
        </Button>
      </div>

      <div className="space-y-4">
        {weekDates.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No schedule available
          </p>
        ) : (
          weekDates.map(({ date, dayName }) => {
            const daySlots = slotsByDate[date] || [];
            const availableSlots = daySlots.filter((s) => s.isAvailable);

            return (
              <div key={date} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {dayName}, {date}
                    </p>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        {daySlots.length > 0 ? "All slots blocked" : "No slots scheduled"}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableSlots.map((slot) => (
                          <span
                            key={`${slot.date}-${slot.start_time}`}
                            className="text-sm bg-primary/10 text-primary px-3 py-1 rounded"
                          >
                            {slot.start_time} - {slot.end_time}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
