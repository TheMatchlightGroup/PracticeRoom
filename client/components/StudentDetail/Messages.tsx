import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context-supabase";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_welcome: boolean;
}

interface MessagesProps {
  studentId: string;
  studentName: string;
}

export default function StudentDetailMessages({ studentId, studentName }: MessagesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasWelcomeMessage, setHasWelcomeMessage] = useState(false);

  // Fetch messages
  useEffect(() => {
    if (!studentId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("teacher_student_messages")
          .select("*")
          .or(`and(teacher_id.eq.${user?.id},student_id.eq.${studentId}),and(teacher_id.eq.${studentId},student_id.eq.${user?.id})`)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }

        setMessages(data || []);
        setHasWelcomeMessage(data?.some((m) => m.is_welcome) || false);
      } catch (err) {
        console.error("Error in fetchMessages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [studentId, user?.id]);

  const handleSendMessage = async (isWelcome: boolean = false) => {
    if (!newMessage.trim() || !user?.id) {
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase
        .from("teacher_student_messages")
        .insert([
          {
            teacher_id: user.id,
            student_id: studentId,
            content: newMessage,
            is_welcome: isWelcome,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return;
      }

      setNewMessage("");
      if (isWelcome) {
        setHasWelcomeMessage(true);
      }

      // Refresh messages
      const { data } = await supabase
        .from("teacher_student_messages")
        .select("*")
        .or(`and(teacher_id.eq.${user.id},student_id.eq.${studentId}),and(teacher_id.eq.${studentId},student_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      toast({
        title: "Success",
        description: isWelcome ? "Welcome message sent!" : "Message sent!",
      });
    } catch (err) {
      console.error("Error sending message:", err);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message Section */}
      {!hasWelcomeMessage && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                Send a Welcome Message
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start the collaboration by sending {studentName} an introduction and any initial questions.
              </p>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Hello ${studentName}! I'm excited to work with you. Here are a few questions...`}
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSendMessage(true)}
                  disabled={!newMessage.trim() || sending}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Welcome Message
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Messages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Messages
        </h3>
        
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No messages yet. Send a welcome message to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${
                  msg.sender_id === user?.id
                    ? "bg-primary/10 ml-8"
                    : "bg-secondary/10 mr-8"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">
                    {msg.sender_id === user?.id ? "You" : studentName}
                    {msg.is_welcome && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Welcome Message
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleDateString()}{" "}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="text-foreground whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Send Regular Message */}
      {hasWelcomeMessage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Send a Message
          </h3>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message for ${studentName}...`}
            className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary mb-3"
            rows={4}
          />
          <Button
            onClick={() => handleSendMessage(false)}
            disabled={!newMessage.trim() || sending}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Send Message
          </Button>
        </Card>
      )}
    </div>
  );
}
