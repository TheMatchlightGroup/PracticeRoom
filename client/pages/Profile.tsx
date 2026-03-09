import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Navigation, MainContent } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";

export default function Profile() {
  const { isAuthenticated, user, studentProfile, teacherProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Teacher edit state
  const [teacherBio, setTeacherBio] = useState(teacherProfile?.bio || "");
  const [teacherRate, setTeacherRate] = useState(teacherProfile?.hourlyRate?.toString() || "");

  // Student edit state
  const [studentRangeLow, setStudentRangeLow] = useState(studentProfile?.vocalRangeLow || "");
  const [studentRangeHigh, setStudentRangeHigh] = useState(studentProfile?.vocalRangeHigh || "");

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (user.role === "teacher" && teacherProfile) {
        // Save teacher profile
        const { error } = await supabase
          .from("teacher_profiles")
          .update({
            bio: teacherBio,
            hourly_rate: teacherRate ? parseFloat(teacherRate) : null,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else if (user.role === "student" && studentProfile) {
        // Save student profile
        const { error } = await supabase
          .from("student_profiles")
          .update({
            vocal_range_low: studentRangeLow,
            vocal_range_high: studentRangeHigh,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      }

      setIsEditing(false);
      // Optionally refresh the page or show a success message
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <>
      <Navigation />
      <MainContent>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-semibold text-foreground mb-2">
            Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your personal and professional information
          </p>
        </div>

        {/* Basic Info */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-serif font-semibold mb-6 text-foreground">
            Basic Information
          </h2>
          <div className="space-y-4 max-w-2xl">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                value={user?.name || ""}
                className="mt-2"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                className="mt-2"
                disabled
              />
            </div>
            <div className="pt-4 flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Role-Specific Info */}
        {user?.role === "student" && studentProfile && (
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-serif font-semibold mb-6 text-foreground">
              Student Profile
            </h2>
            <div className="space-y-4 max-w-2xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Vocal Range (Low)
                  </Label>
                  {isEditing ? (
                    <Input
                      value={studentRangeLow}
                      onChange={(e) => setStudentRangeLow(e.target.value)}
                      className="mt-2"
                      placeholder="C3"
                    />
                  ) : (
                    <p className="mt-2 font-medium text-foreground">
                      {studentProfile.vocalRangeLow}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Vocal Range (High)
                  </Label>
                  {isEditing ? (
                    <Input
                      value={studentRangeHigh}
                      onChange={(e) => setStudentRangeHigh(e.target.value)}
                      className="mt-2"
                      placeholder="C6"
                    />
                  ) : (
                    <p className="mt-2 font-medium text-foreground">
                      {studentProfile.vocalRangeHigh}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Experience Level
                </Label>
                <p className="mt-2 font-medium text-foreground">
                  {studentProfile.experienceLevel}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Goals
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {studentProfile.goals.map((goal) => (
                    <span
                      key={goal}
                      className="px-3 py-1 bg-secondary text-sm font-medium text-primary rounded"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {user?.role === "teacher" && teacherProfile && (
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-serif font-semibold mb-6 text-foreground">
              Teacher Profile
            </h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Bio
                </Label>
                {isEditing ? (
                  <Textarea
                    value={teacherBio}
                    onChange={(e) => setTeacherBio(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                ) : (
                  <p className="mt-2 text-foreground">{teacherProfile.bio}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Methods Used
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {teacherProfile.methodsUsed.map((method) => (
                    <span
                      key={method}
                      className="px-3 py-1 bg-secondary text-sm font-medium text-primary rounded"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Years of Experience
                </Label>
                <p className="mt-2 font-medium text-foreground">
                  {teacherProfile.yearsExperience} years
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Hourly Rate
                </Label>
                {isEditing ? (
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={teacherRate}
                      onChange={(e) => setTeacherRate(e.target.value)}
                      placeholder="50"
                      min="0"
                      step="5"
                      className="pl-8"
                    />
                  </div>
                ) : (
                  <p className="mt-2 font-medium text-foreground">
                    ${teacherProfile.hourlyRate || "Not set"}/hr
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </MainContent>
    </>
  );
}
