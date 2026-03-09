import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  currentPlan?: string;
  suggestedPlan?: string;
  message?: string;
}

/**
 * Modal shown when user tries to access a feature not available on their plan
 */
export default function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  currentPlan,
  suggestedPlan,
  message,
}: UpgradeModalProps) {
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const handleUpgrade = () => {
    navigate("/subscription");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Upgrade Required
            </h3>
            <p className="text-sm text-muted-foreground">
              This feature is not available on your current plan
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6">
          <p className="text-sm text-amber-900">
            {message || (
              <>
                <strong>{featureName}</strong> is available on{" "}
                {suggestedPlan ? `${suggestedPlan} and higher plans` : "premium plans"}
                {currentPlan && ` (you're currently on ${currentPlan})`}.
              </>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1"
          >
            View Plans
          </Button>
        </div>
      </Card>
    </div>
  );
}
