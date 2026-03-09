import React from "react";
import { Card } from "@/components/ui/card";
import { Music, Target, Zap } from "lucide-react";

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  primaryInstrument?: string;
  vocalRange?: string;
  experience_level?: string;
  goals?: string;
}

interface OverviewProps {
  student: StudentInfo;
}

export default function StudentDetailOverview({ student }: OverviewProps) {
  const stats = [
    {
      icon: Music,
      label: "Primary Instrument",
      value: student.primaryInstrument || "Not specified",
    },
    {
      icon: Zap,
      label: "Experience Level",
      value: student.experience_level || "Not specified",
    },
    {
      icon: Target,
      label: "Vocal Range",
      value: student.vocalRange || "Not specified",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6">
              <div className="flex items-center gap-4">
                <Icon className="w-8 h-8 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold text-foreground">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Student Goals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Student Goals
        </h3>
        <p className="text-foreground whitespace-pre-wrap">
          {student.goals || "No goals specified yet."}
        </p>
      </Card>

      {/* Student Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Contact Information
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-foreground">{student.email}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
