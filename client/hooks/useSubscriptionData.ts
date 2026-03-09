import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Capability {
  pitchAnalyticsEnabled: boolean;
  performanceSimulationEnabled: boolean;
  teacherModuleEnabled: boolean;
  maxPieces: number;
  audioAnalysesPerMonth: number;
  aiCallsPerMonth: number;
  maxStudents: number | null;
}

export interface Usage {
  audioAnalyses: number;
  aiCalls: number;
}

export interface SubscriptionData {
  subscription: {
    id: string;
    userId: string;
    planKey: string;
    billingCycle: "monthly" | "annual";
    status: "trialing" | "active" | "canceled" | "past_due";
    trialEnd: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
  } | null;
  capabilities: Capability;
  usage: Usage;
}

/**
 * Hook to fetch current user's subscription and capabilities
 * Automatically retries on 401 (in case session changed)
 */
export function useSubscriptionData() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      const res = await window.fetch("/api/subscription/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
        setError(null);
      } else if (res.status === 401) {
        // Session expired, will be handled by auth context
        setData(null);
        setError(null);
      } else {
        throw new Error(`Failed to fetch subscription: ${res.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  /**
   * Helper: Check if a capability is available
   */
  const hasCapability = (key: keyof Capability): boolean => {
    if (!data) return false;
    const value = data.capabilities[key];
    // For boolean capabilities
    if (typeof value === "boolean") return value;
    // For numeric capabilities, true if > 0
    if (typeof value === "number") return value > 0;
    // For null (unlimited), true
    return true;
  };

  /**
   * Helper: Get remaining usage for a limit
   */
  const getRemainingUsage = (
    limitKey: "audioAnalysesPerMonth" | "aiCallsPerMonth",
    usageKey: "audioAnalyses" | "aiCalls"
  ): number => {
    if (!data) return 0;
    const limit = data.capabilities[limitKey] as number;
    const used = data.usage[usageKey];
    return Math.max(0, limit - used);
  };

  /**
   * Helper: Check if usage exceeded
   */
  const isLimitExceeded = (
    limitKey: "audioAnalysesPerMonth" | "aiCallsPerMonth",
    usageKey: "audioAnalyses" | "aiCalls"
  ): boolean => {
    if (!data) return false;
    const limit = data.capabilities[limitKey] as number;
    const used = data.usage[usageKey];
    return used >= limit;
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchSubscriptionData,
    hasCapability,
    getRemainingUsage,
    isLimitExceeded,
  };
}
