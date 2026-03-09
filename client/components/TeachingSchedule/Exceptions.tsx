import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context-supabase";
import { apiPost, apiDelete, apiGet } from "@/lib/api";

interface Exception {
  id: string;
  type: "blocked_date_range" | "slot_override";
  date?: string;
  date_from?: string;
  date_to?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  created_at: string;
}

interface ExceptionsProps {
  onUpdate?: () => void;
}

export function Exceptions({ onUpdate }: ExceptionsProps) {
  const { user } = useAuth();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"date_range" | "slot_override">(
    "date_range"
  );

  // Form states
  const [dateRangeForm, setDateRangeForm] = useState({
    dateFrom: "",
    dateTo: "",
    reason: "",
  });

  const [slotOverrideForm, setSlotOverrideForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchExceptions();
    }
  }, [user?.id]);

  const fetchExceptions = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const result = await apiGet(`/interactions/availability/exceptions/${user.id}`);
      if (result.success && Array.isArray(result.data)) {
        setExceptions(result.data);
      }
    } catch (err) {
      console.error("Error fetching exceptions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRangeForm.dateFrom || !dateRangeForm.dateTo) {
      alert("Please fill in all required fields");
      return;
    }

    if (new Date(dateRangeForm.dateFrom) > new Date(dateRangeForm.dateTo)) {
      alert("Start date must be before end date");
      return;
    }

    try {
      const result = await apiPost("/interactions/availability/exceptions", {
        type: "blocked_date_range",
        dateFrom: dateRangeForm.dateFrom,
        dateTo: dateRangeForm.dateTo,
        reason: dateRangeForm.reason || null,
      });

      if (result.success && result.data) {
        setExceptions([...exceptions, result.data]);
        setDateRangeForm({ dateFrom: "", dateTo: "", reason: "" });
        onUpdate?.();
      } else {
        alert("Failed to add exception: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding exception:", err);
      alert("Error adding exception");
    }
  };

  const handleAddSlotOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotOverrideForm.date || !slotOverrideForm.startTime || !slotOverrideForm.endTime) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const result = await apiPost("/interactions/availability/exceptions", {
        type: "slot_override",
        date: slotOverrideForm.date,
        startTime: slotOverrideForm.startTime,
        endTime: slotOverrideForm.endTime,
        reason: slotOverrideForm.reason || null,
      });

      if (result.success && result.data) {
        setExceptions([...exceptions, result.data]);
        setSlotOverrideForm({ date: "", startTime: "", endTime: "", reason: "" });
        onUpdate?.();
      } else {
        alert("Failed to add override: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding override:", err);
      alert("Error adding override");
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    try {
      const result = await apiDelete(`/interactions/availability/exceptions/${exceptionId}`);

      if (result.success) {
        setExceptions(exceptions.filter((e) => e.id !== exceptionId));
        onUpdate?.();
      } else {
        alert("Failed to delete exception: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error deleting exception:", err);
      alert("Error deleting exception");
    }
  };

  const dateRangeExceptions = exceptions.filter((e) => e.type === "blocked_date_range");
  const slotOverrideExceptions = exceptions.filter((e) => e.type === "slot_override");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Time Off & Exceptions
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Block entire date ranges (vacation, conferences) or override specific
          time slots for this week.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "date_range" | "slot_override")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="date_range">Block Date Ranges</TabsTrigger>
          <TabsTrigger value="slot_override">Override Slots</TabsTrigger>
        </TabsList>

        {/* Date Range Tab */}
        <TabsContent value="date_range" className="space-y-6 mt-6">
          {/* Existing Blocks */}
          {dateRangeExceptions.length > 0 && (
            <Card className="p-6">
              <h4 className="font-medium text-foreground mb-4">Active Blocks</h4>
              <div className="space-y-3">
                {dateRangeExceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className="flex items-start justify-between bg-slate-50 p-4 rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {exc.date_from} to {exc.date_to}
                      </p>
                      {exc.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {exc.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteException(exc.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Add Date Range Form */}
          <Card className="p-6 border-dashed">
            <h4 className="font-medium text-foreground mb-4">Block New Date Range</h4>
            <form onSubmit={handleAddDateRange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={dateRangeForm.dateFrom}
                    onChange={(e) =>
                      setDateRangeForm({
                        ...dateRangeForm,
                        dateFrom: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={dateRangeForm.dateTo}
                    onChange={(e) =>
                      setDateRangeForm({
                        ...dateRangeForm,
                        dateTo: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Reason (optional)
                </Label>
                <Input
                  placeholder="e.g., SXSW, Vacation, Conference"
                  value={dateRangeForm.reason}
                  onChange={(e) =>
                    setDateRangeForm({
                      ...dateRangeForm,
                      reason: e.target.value,
                    })
                  }
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Block Dates
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Slot Override Tab */}
        <TabsContent value="slot_override" className="space-y-6 mt-6">
          {/* Existing Overrides */}
          {slotOverrideExceptions.length > 0 && (
            <Card className="p-6">
              <h4 className="font-medium text-foreground mb-4">
                Active Overrides
              </h4>
              <div className="space-y-3">
                {slotOverrideExceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className="flex items-start justify-between bg-slate-50 p-4 rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {exc.date} • {exc.start_time} - {exc.end_time}
                      </p>
                      {exc.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {exc.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteException(exc.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Add Slot Override Form */}
          <Card className="p-6 border-dashed">
            <h4 className="font-medium text-foreground mb-4">
              Override a Specific Slot
            </h4>
            <form onSubmit={handleAddSlotOverride} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Date</Label>
                  <Input
                    type="date"
                    value={slotOverrideForm.date}
                    onChange={(e) =>
                      setSlotOverrideForm({
                        ...slotOverrideForm,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Start Time
                  </Label>
                  <Input
                    type="time"
                    value={slotOverrideForm.startTime}
                    onChange={(e) =>
                      setSlotOverrideForm({
                        ...slotOverrideForm,
                        startTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    End Time
                  </Label>
                  <Input
                    type="time"
                    value={slotOverrideForm.endTime}
                    onChange={(e) =>
                      setSlotOverrideForm({
                        ...slotOverrideForm,
                        endTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Reason (optional)
                </Label>
                <Input
                  placeholder="e.g., Dentist appointment, School meeting"
                  value={slotOverrideForm.reason}
                  onChange={(e) =>
                    setSlotOverrideForm({
                      ...slotOverrideForm,
                      reason: e.target.value,
                    })
                  }
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Override Slot
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
