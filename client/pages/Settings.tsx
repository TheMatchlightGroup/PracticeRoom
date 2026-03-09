import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, Bell, Lock, Palette, Calendar, CheckCircle } from "lucide-react";
import { RecurringSlots, Exceptions } from "@/components/TeachingSchedule";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const { isAuthenticated, logout, user, getAuthToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    // Confirm deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted."
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);
    try {
      console.log("🔐 Settings: Deleting account...");

      const token = await getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete account");
      }

      console.log("🔐 Settings: Account deleted successfully");
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Log out and redirect
      await logout();
      navigate("/");
    } catch (error) {
      console.error("🔐 Settings: Error deleting account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveSchedule = () => {
    setScheduleSaved(true);
    toast({
      title: "Schedule Saved!",
      description: "Your teaching schedule is now visible to your students.",
    });

    // Reset the saved state after 3 seconds
    setTimeout(() => {
      setScheduleSaved(false);
    }, 3000);
  };

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Notifications */}
        <Card className="p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Notifications
            </h2>
          </div>
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive updates about your practice progress
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Practice Reminders
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily reminders to practice
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Lesson Updates
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Notifications about bookings and lessons
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Teaching Schedule (Teachers Only) */}
        {user?.role === "teacher" && (
          <Card className="p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-serif font-semibold text-foreground">
                Your Teaching Schedule
              </h2>
            </div>
            <div className="space-y-8">
              <RecurringSlots key={`recurring-${refreshKey}`} onUpdate={() => setRefreshKey(k => k + 1)} />
              <hr className="border-border" />
              <Exceptions key={`exceptions-${refreshKey}`} onUpdate={() => setRefreshKey(k => k + 1)} />

              {/* Save Schedule Button */}
              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Your schedule is automatically saved as you make changes and will be visible to your students.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveSchedule}
                    size="lg"
                    className={`gap-2 transition-colors ${
                      scheduleSaved
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-primary hover:bg-primary/90"
                    }`}
                  >
                    {scheduleSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Schedule Saved!
                      </>
                    ) : (
                      "Save Schedule"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Privacy & Security */}
        <Card className="p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Privacy & Security
            </h2>
          </div>
          <div className="space-y-4 max-w-2xl">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Connected Devices
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Data Privacy
            </Button>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Palette className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Appearance
            </h2>
          </div>
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Use dark theme for reduced eye strain
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-8 border-red-200 bg-red-50">
          <h2 className="text-2xl font-serif font-semibold text-red-900 mb-6">
            Danger Zone
          </h2>
          <div className="space-y-4 max-w-2xl">
            <div>
              <p className="text-sm text-red-800 mb-4">
                These actions cannot be undone. Please proceed with caution.
              </p>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-100 w-full justify-start mb-3"
              >
                Download My Data
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Logout */}
        <div className="mt-8">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </MainContent>
    </>
  );
}
