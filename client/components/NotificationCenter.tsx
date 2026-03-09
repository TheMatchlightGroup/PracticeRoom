import React, { useState } from "react";
import { Bell, X, CheckCircle, AlertCircle, Eye, Check, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context-supabase";
import { Notification } from "@shared/audio-types";
import { toast } from "sonner";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onDelete,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { getAuthToken } = useAuth();

  const handleViewStudent = (notification: Notification) => {
    navigate("/requests");
    setIsOpen(false);
  };

  const handleAcceptStudent = async (notification: Notification) => {
    try {
      setActionLoading(notification.id);
      const token = await getAuthToken();

      const response = await fetch(`/api/discovery/requests/${notification.related_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "accepted",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept student");
      }

      toast.success("Student accepted!");
      onDelete(notification.id);
    } catch (error) {
      toast.error("Failed to accept student");
      console.error("Error accepting student:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyStudent = async (notification: Notification) => {
    try {
      setActionLoading(notification.id);
      const token = await getAuthToken();

      const response = await fetch(`/api/discovery/requests/${notification.related_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "archived",
          archive_reason: "declined",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to deny student");
      }

      toast.success("Student request declined");
      onDelete(notification.id);
    } catch (error) {
      toast.error("Failed to decline student request");
      console.error("Error declining student:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "submission_approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "submission_rejected":
      case "teacher_feedback":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="relative inline-block">
      {/* Bell icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-auto -right-80 top-full mt-2 w-96 bg-background border border-border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-secondary/50 transition-colors ${
                      !notification.read_at ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {notification.type === "student_request_received" && (
                          <>
                            <button
                              onClick={() => handleViewStudent(notification)}
                              disabled={actionLoading === notification.id}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50"
                              title="View student"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAcceptStudent(notification)}
                              disabled={actionLoading === notification.id}
                              className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                              title="Accept student"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDenyStudent(notification)}
                              disabled={actionLoading === notification.id}
                              className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                              title="Deny student"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {notification.type === "teacher_invite_received" && (
                          <>
                            <button
                              onClick={() => handleViewStudent(notification)}
                              disabled={actionLoading === notification.id}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50"
                              title="View teacher"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAcceptStudent(notification)}
                              disabled={actionLoading === notification.id}
                              className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                              title="Accept teacher"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDenyStudent(notification)}
                              disabled={actionLoading === notification.id}
                              className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                              title="Deny teacher"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {notification.type === "request_accepted" && (
                          <button
                            onClick={() => {
                              navigate("/requests");
                              setIsOpen(false);
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="View connection"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(notification.id)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
