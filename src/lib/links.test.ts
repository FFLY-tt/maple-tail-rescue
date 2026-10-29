import { describe, expect, it } from "vitest";

import { mailtoHref, telHref } from "@/lib/links";

describe("mailtoHref", () => {
  it("leaves an ordinary address readable", () => {
    expect(mailtoHref("sam.lee+adopt@example.com")).toBe("mailto:sam.lee%2Badopt@example.com");
    expect(mailtoHref("sam@example.com")).toBe("mailto:sam@example.com");
  });

  it.each([
    "a@b.co?bcc=hidden@evil.example",
    "a@b.co?subject=Hi&body=Click here",
    "a@b.co&cc=x@y.example",
    "a@b.co,other@evil.example",
    "a@b.co;other@evil.example",
    "a@b.co\r\nBcc: x@y.example",
    "<script>@b.co",
    "a b@c.co",
  ])("never lets %j add a header or recipient", (email) => {
    const href = mailtoHref(email);
    expect(href.startsWith("mailto:")).toBe(true);
    const target = href.slice("mailto:".length);
    // Nothing in the address can act as a mailto: delimiter, space or line break any more.
    expect(target).not.toMatch(/[?&=,;\s<>]/);
    // Exactly one raw "@" is left, the one between the local part and the domain.
    expect(target.split("@")).toHaveLength(2);
  });

  it("round-trips: decoding gives back the address that was entered", () => {
    const email = "a@b.co?bcc=hidden@evil.example";
    const target = mailtoHref(email).slice("mailto:".length);
    expect(decodeURIComponent(target)).toBe(email);
  });

  it("handles unicode and a value with no @ at all", () => {
    expect(mailtoHref("zoë@exämple.com")).toBe("mailto:zo%C3%AB@ex%C3%A4mple.com");
    expect(mailtoHref("not-an-email")).toBe("mailto:not-an-email");
    expect(mailtoHref("")).toBe("mailto:");
  });
});

describe("telHref", () => {
  it("keeps only the digits", () => {
    expect(telHref("(416) 555-0123")).toBe("tel:4165550123");
    expect(telHref("416.555.0123")).toBe("tel:4165550123");
  });

  it("keeps a leading +", () => {
    expect(telHref("+1 416 555 0123")).toBe("tel:+14165550123");
    expect(telHref("  +44 20 7946 0958")).toBe("tel:+442079460958");
  });

  it("drops anything that isn't a digit, so nothing can be smuggled into the link", () => {
    expect(telHref("416-555-0123;phone-context=evil.example")).toBe("tel:4165550123");
    expect(telHref("4165550123?x=1&y=2")).toBe("tel:416555012312");
    expect(telHref("javascript:alert(1)")).toBe("tel:1");
    expect(telHref("")).toBe("tel:");
  });
});
