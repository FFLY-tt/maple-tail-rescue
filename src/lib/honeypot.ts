/**
 * Bot trap for the application form: a field no person sees or fills in.
 *
 * Wrongly dropping a real applicant is far worse than letting a bot through
 * (a bot's email can be deleted; a lost application is gone and the
 * applicant is told it worked). So a filled trap alone is NOT enough to drop a
 * submission. Password managers and autofill can fill hidden fields. We drop
 * only when the trap is filled AND the form was submitted faster than a person
 * can get through four steps.
 */

/**
 * Formspree's own bot-trap name: it silently discards a submission where this is filled.
 * Autofill doesn't recognise it. A filled trap is never forwarded (see formspree.ts), so a
 * real applicant whose browser filled it still gets through.
 */
export const HONEYPOT_FIELD = "_gotcha";

/** Nobody completes four steps of the form in under this long. */
export const MIN_HUMAN_MS = 3000;

export type HoneypotVerdict =
  /** Trap empty: a normal submission. */
  | "clean"
  /** Trap filled, but the form took long enough for a person: probably autofill. Send it for real. */
  | "filled-but-human"
  /** Trap filled and submitted too fast: a bot. Don't send it. */
  | "bot";

export function judgeHoneypot(honeypotValue: string, elapsedMs: number): HoneypotVerdict {
  if (honeypotValue.trim() === "") return "clean";
  return elapsedMs < MIN_HUMAN_MS ? "bot" : "filled-but-human";
}
