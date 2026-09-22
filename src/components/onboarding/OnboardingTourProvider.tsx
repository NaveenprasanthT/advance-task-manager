"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Joyride, ACTIONS, EVENTS, STATUS, type EventData } from "react-joyride";
import { OnboardingTourContext } from "./OnboardingTourContext";
import { TOUR_STEPS } from "./tour-steps";

export function OnboardingTourProvider({
  initialHasSeenTour,
  children,
}: {
  initialHasSeenTour: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState(!initialHasSeenTour);
  const [stepIndex, setStepIndex] = useState(0);
  // Holds a step index whose target lives on a different page, until that
  // page has actually finished navigating (see the pathname effect below).
  const pendingIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (pendingIndexRef.current !== null) {
      setStepIndex(pendingIndexRef.current);
      pendingIndexRef.current = null;
    }
  }, [pathname]);

  function completeTour() {
    setRun(false);
    fetch("/api/me/tour", { method: "POST" }).catch(() => {});
  }

  function goTo(nextIndex: number) {
    if (nextIndex >= TOUR_STEPS.length) {
      completeTour();
      return;
    }
    const clamped = Math.max(nextIndex, 0);
    const nextStep = TOUR_STEPS[clamped];
    if (nextStep.path !== pathname) {
      pendingIndexRef.current = clamped;
      router.push(nextStep.path);
    } else {
      setStepIndex(clamped);
    }
  }

  function handleEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      completeTour();
      return;
    }
    // A conditional target (e.g. the AI-suggestions CTA, hidden once
    // configured) simply gets skipped rather than freezing the tour.
    if (data.type === EVENTS.TARGET_NOT_FOUND) {
      goTo(data.index + 1);
      return;
    }
    if (data.type === EVENTS.STEP_AFTER) {
      goTo(data.index + (data.action === ACTIONS.PREV ? -1 : 1));
    }
  }

  function openTour() {
    setRun(true);
    goTo(0);
  }

  return (
    <OnboardingTourContext.Provider value={{ openTour }}>
      {children}
      <Joyride
        steps={TOUR_STEPS}
        run={run}
        stepIndex={stepIndex}
        continuous
        onEvent={handleEvent}
        options={{
          primaryColor: "var(--primary)",
          textColor: "var(--popover-foreground)",
          backgroundColor: "var(--popover)",
          arrowColor: "var(--popover)",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
          skipBeacon: true,
          showProgress: true,
          buttons: ["back", "skip", "primary"],
        }}
        styles={{
          tooltip: { borderRadius: 12 },
        }}
      />
    </OnboardingTourContext.Provider>
  );
}
