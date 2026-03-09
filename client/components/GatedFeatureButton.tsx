import React from "react";
import { Button } from "@/components/ui/button";
import { useSubscriptionData } from "@/hooks/useSubscriptionData";
import UpgradeModal, { UpgradeModalProps } from "@/components/UpgradeModal";
import { useUpgradeModal } from "@/hooks/useUpgradeModal";
import { Lock } from "lucide-react";

export interface GatedFeatureButtonProps {
  /**
   * The capability required to use this feature
   */
  requiredCapability?: keyof ReturnType<typeof useSubscriptionData>["data"]["capabilities"];

  /**
   * The usage limit to check against
   * e.g., "audioAnalysesPerMonth" will check data.capabilities.audioAnalysesPerMonth
   */
  usageLimit?: "audioAnalysesPerMonth" | "aiCallsPerMonth";
  usageKey?: "audioAnalyses" | "aiCalls";

  /**
   * Friendly name of the feature (shown in upgrade modal)
   */
  featureName: string;

  /**
   * Button label
   */
  children: React.ReactNode;

  /**
   * Called when button is clicked and user has access
   */
  onClick: () => void;

  /**
   * Optional CSS class
   */
  className?: string;

  /**
   * Optional variant (see Button component)
   */
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";

  /**
   * Optional size
   */
  size?: "default" | "sm" | "lg" | "icon";

  /**
   * Show custom message instead of default
   */
  upgradeMessage?: string;
}

/**
 * Button that gates access to a feature based on subscription plan
 * Shows upgrade modal if feature is not available
 *
 * Usage:
 * <GatedFeatureButton
 *   requiredCapability="pitchAnalyticsEnabled"
 *   featureName="Pitch Analysis"
 *   onClick={() => startAnalysis()}
 * >
 *   Analyze Pitch
 * </GatedFeatureButton>
 */
export default function GatedFeatureButton({
  requiredCapability,
  usageLimit,
  usageKey,
  featureName,
  children,
  onClick,
  className,
  variant = "default",
  size = "default",
  upgradeMessage,
}: GatedFeatureButtonProps) {
  const { data, hasCapability, isLimitExceeded } = useSubscriptionData();
  const { modal, showUpgradeModal, closeUpgradeModal } = useUpgradeModal();

  // Check if feature is available
  const isAvailable =
    !requiredCapability ||
    !data ||
    data.subscription === null || // Free tier fallback to false
    hasCapability(requiredCapability);

  // Check if usage limit is not exceeded
  const hasUsageRemaining =
    !usageLimit ||
    !usageKey ||
    !data ||
    !isLimitExceeded(usageLimit, usageKey);

  const isEnabled = isAvailable && hasUsageRemaining;

  const handleClick = () => {
    if (!isEnabled) {
      showUpgradeModal({
        featureName,
        currentPlan: data?.subscription?.planKey,
        message:
          upgradeMessage ||
          (requiredCapability
            ? `${featureName} is not available on your current plan`
            : `You've reached your monthly limit for ${featureName}`),
      });
      return;
    }

    onClick();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={!isEnabled}
        variant={variant}
        size={size}
        className={className}
        title={
          !isEnabled
            ? `Unlock ${featureName} by upgrading your plan`
            : undefined
        }
      >
        {!isEnabled && <Lock className="w-4 h-4 mr-2" />}
        {children}
      </Button>

      <UpgradeModal
        isOpen={modal.isOpen}
        onClose={closeUpgradeModal}
        featureName={modal.featureName}
        currentPlan={modal.currentPlan}
        suggestedPlan={modal.suggestedPlan}
        message={modal.message}
      />
    </>
  );
}
