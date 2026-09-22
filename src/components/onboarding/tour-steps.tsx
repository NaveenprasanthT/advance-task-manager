import type { Step } from "react-joyride";

// A step's `path` is the route it needs to be shown on; consecutive steps on
// the same path don't trigger navigation. Only one transition
// (dashboard -> personal) is needed for the whole tour since the sidebar
// itself is visible on every app page.
export interface TourStep extends Step {
  path: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    path: "/dashboard",
    target: "[data-tour='dashboard-overview']",
    title: "Welcome to TaskFlow",
    content: "This is your dashboard — a quick look at your tasks, routines, and memories at a glance.",
    placement: "bottom",
  },
  {
    path: "/dashboard",
    target: "[data-tour='nav-personal']",
    content: "Your work lives on two separate boards — Personal and Professional. Let's look at one.",
    placement: "right",
  },
  {
    path: "/personal",
    target: "[data-tour='board-lanes']",
    content: "Drag cards across columns as you work — Todo, In Progress, On Hold, Done, and more.",
    placement: "bottom",
  },
  {
    path: "/personal",
    target: "[data-tour='board-filters']",
    content: "Filter by priority, origin, or search, and switch between grid and list view.",
    placement: "bottom",
  },
  {
    path: "/personal",
    target: "[data-tour='autogen-cta']",
    content: "Let AI suggest tasks based on topics you're into — configure it right here.",
    placement: "bottom",
  },
  {
    path: "/personal",
    target: "[data-tour='nav-recurring']",
    content:
      "Turn repeating habits — like a daily gym session — into Recurring Tasks. Mark each day done to build a streak.",
    placement: "right",
  },
  {
    path: "/personal",
    target: "[data-tour='nav-memories']",
    content: "Save long-term notes, reminders, and files — images, PDFs, spreadsheets — in My Memory.",
    placement: "right",
  },
  {
    path: "/personal",
    target: "[data-tour='nav-analytics']",
    content: "See your completion trends and routine adherence over time in Analytics.",
    placement: "right",
  },
  {
    path: "/personal",
    target: "[data-tour='nav-settings']",
    content:
      "Manage your profile and preferences in Settings. You can replay this tour anytime from your account menu at the bottom of the sidebar.",
    placement: "right",
  },
];
