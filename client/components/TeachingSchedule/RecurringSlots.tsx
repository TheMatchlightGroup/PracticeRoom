import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context-supabase";
import { apiPost, apiDelete, apiGet } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // Monday=1, Sunday=0

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface RecurringSlotsProps {
  onUpdate?: () => void;
}

export function RecurringSlots({ onUpdate }: RecurringSlotsProps) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<TimeSlot>>({
    day_of_week: 1,
    start_time: "10:00",
    end_time: "11:00",
  });

  useEffect(() => {
    if (user?.id) {
      fetchSlots();
    }
  }, [user?.id]);

  const fetchSlots = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const result = await apiGet(`/interactions/availability/${user.id}`);
      if (result.success && Array.isArray(result.data)) {
        setSlots(result.data);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.day_of_week || !newSlot.start_time || !newSlot.end_time) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const result = await apiPost("/interactions/availability", {
        dayOfWeek: newSlot.day_of_week,
        startTime: newSlot.start_time,
        endTime: newSlot.end_time,
      });

      if (result.success && result.data) {
        setSlots([...slots, result.data]);
        setNewSlot({
          day_of_week: 1,
          start_time: "10:00",
          end_time: "11:00",
        });
        onUpdate?.();
      } else {
        alert("Failed to add slot: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding slot:", err);
      alert("Error adding slot");
    }
  };

  const handleDeleteSlot = async (slotId: string | undefined) => {
    if (!slotId) return;

    try {
      const result = await apiDelete(`/interactions/availability/${slotId}`);

      if (result.success) {
        setSlots(slots.filter((s) => s.id !== slotId));
        onUpdate?.();
      } else {
        alert("Failed to delete slot: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error deleting slot:", err);
      alert("Error deleting slot");
    }
  };

  const slotsByDay = DAYS.reduce(
    (acc, day, idx) => {
      acc[day] = slots.filter((s) => s.day_of_week === DAY_VALUES[idx]);
      return acc;
    },
    {} as Record<string, TimeSlot[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Recurring Weekly Slots
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set your repeating teaching hours. These slots apply every week.
        </p>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DAYS.map((day, idx) => (
          <Card key={day} className="p-4">
            <h4 className="font-medium text-foreground mb-3">{day}</h4>
            {slotsByDay[day].length > 0 ? (
              <div className="space-y-2">
                {slotsByDay[day].map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between bg-slate-50 p-2 rounded"
                  >
                    <span className="text-sm text-foreground">
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No slots scheduled</p>
            )}
          </Card>
        ))}
      </div>

      {/* Add Slot Form */}
      <Card className="p-6 border-dashed">
        <h4 className="font-medium text-foreground mb-4">Add New Slot</h4>
        <form onSubmit={handleAddSlot} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Day</Label>
              <Select
                value={String(newSlot.day_of_week)}
                onValueChange={(v) =>
                  setNewSlot({ ...newSlot, day_of_week: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, idx) => (
                    <SelectItem key={day} value={String(DAY_VALUES[idx])}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Start Time</Label>
              <Input
                type="time"
                value={newSlot.start_time}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, start_time: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">End Time</Label>
              <Input
                type="time"
                value={newSlot.end_time}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </form>
      </Card>
    </div>
  );
}
