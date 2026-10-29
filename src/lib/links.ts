/**
 * Builds mailto: and tel: links from applicant-supplied text. An applicant can
 * send anything to the API directly, so these never paste a value into a link
 * as is: "a@b.co?bcc=someone@else.com" must not turn into a header that adds a
 * hidden recipient to the staff member's new email.
 */

/** mailto: link for an address. Everything except the one separating "@" is percent-encoded. */
export function mailtoHref(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return `mailto:${encodeURIComponent(email)}`;
  return `mailto:${encodeURIComponent(email.slice(0, at))}@${encodeURIComponent(email.slice(at + 1))}`;
}

/** tel: link with only digits and a leading "+", whatever punctuation or text the phone number had. */
export function telHref(phone: string): string {
  const plus = phone.trim().startsWith("+") ? "+" : "";
  return `tel:${plus}${phone.replace(/\D/g, "")}`;
}
