import { useState } from "react";

export interface UpgradeModalState {
  isOpen: boolean;
  featureName: string;
  currentPlan?: string;
  suggestedPlan?: string;
  message?: string;
}

/**
 * Hook to manage upgrade modal state
 * Usage:
 *   const { modal, showUpgradeModal, closeUpgradeModal } = useUpgradeModal();
 *   
 *   if (locked) {
 *     showUpgradeModal({
 *       featureName: "Pitch Analysis",
 *       suggestedPlan: "Student Intermediate"
 *     });
 *     return;
 *   }
 */
export function useUpgradeModal() {
  const [modal, setModal] = useState<UpgradeModalState>({
    isOpen: false,
    featureName: "",
  });

  const showUpgradeModal = (options: Omit<UpgradeModalState, "isOpen">) => {
    setModal({
      ...options,
      isOpen: true,
    });
  };

  const closeUpgradeModal = () => {
    setModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  return {
    modal,
    showUpgradeModal,
    closeUpgradeModal,
  };
}
