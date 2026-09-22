"use client";

import { createContext, useContext } from "react";

export interface OnboardingTourContextValue {
  openTour: () => void;
}

export const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null);

export function useOnboardingTour(): OnboardingTourContextValue {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx) throw new Error("useOnboardingTour must be used within OnboardingTourProvider");
  return ctx;
}
