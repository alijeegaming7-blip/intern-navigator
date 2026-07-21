export const RESTART_TOUR_EVENT = "eef:restart-tour";

export function restartOnboardingTour() {
  window.dispatchEvent(new CustomEvent(RESTART_TOUR_EVENT));
}
