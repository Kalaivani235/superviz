import type { CompanionEvent } from "./types";

/**
 * Lightweight event log, no third-party analytics dependency. Logs to the
 * console in development only; in production this is a no-op unless/until
 * the app wires in a real analytics mechanism, at which point this is the
 * single place to route events through it.
 */
export function trackCompanionEvent(event: CompanionEvent): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[companion]", event.event, event.metadata);
  }
}
