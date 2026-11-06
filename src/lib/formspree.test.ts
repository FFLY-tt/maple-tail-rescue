import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApplicationInput } from "@/lib/application-schema";
import { NO_SPECIFIC_ANIMAL, buildSubmission, submitApplication } from "@/lib/formspree";

const base: ApplicationInput = {
  fullName: "Sam Lee",
  email: "sam@example.com",
  phone: "416-555-0123",
  ownership: "own",
  adults: "2",
  children: "3-plus",
  householdAgrees: "yes",
  hasPets: "no",
  experience: "Grew up with dogs.",
  animalSlug: "biscuit",
  whyInterested: "We have the time and space.",
};

describe("buildSubmission", () => {
  it("uses readable field names and answers, with the animal in the subject", () => {
    expect(buildSubmission(base, "Biscuit")).toEqual({
      _subject: "Adoption application: Biscuit",
      _replyto: "sam@example.com",
      _gotcha: "",
      Animal: "Biscuit",
      "Full name": "Sam Lee",
      Email: "sam@example.com",
      Phone: "416-555-0123",
      "Own or rent": "I own my home",
      Adults: "2 adults",
      Children: "3 or more children",
      "Everyone at home agrees": "Yes, everyone is on board",
      "Has pets now": "No",
      "Experience with pets": "Grew up with dogs.",
      "Why they want to adopt": "We have the time and space.",
    });
  });

  it("says 'No specific animal' for a general application", () => {
    const sent = buildSubmission({ ...base, animalSlug: "general" }, "Biscuit");
    expect(sent._subject).toBe(`Adoption application: ${NO_SPECIFIC_ANIMAL}`);
    expect(sent.Animal).toBe(NO_SPECIFIC_ANIMAL);
  });

  it("includes the conditional answers only when they apply", () => {
    const applies = buildSubmission({
      ...base,
      ownership: "rent",
      landlordPermission: "yes",
      hasPets: "yes",
      currentPets: "One cat",
    });
    expect(applies["Landlord allows pets"]).toBe("Yes, pets are allowed");
    expect(applies["Current pets"]).toBe("One cat");

    // Stale answers left over from before the visitor changed their mind are not sent.
    const stale = buildSubmission({ ...base, landlordPermission: "no", currentPets: "One cat" });
    expect(stale).not.toHaveProperty("Landlord allows pets");
    expect(stale).not.toHaveProperty("Current pets");
  });
});

describe("submitApplication", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("posts JSON to the endpoint and asks for a JSON answer", async () => {
    vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ENDPOINT", "https://formspree.io/f/test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await submitApplication(base, "Biscuit");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://formspree.io/f/test");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Accept: "application/json" });
    expect(JSON.parse(init.body)).toEqual(buildSubmission(base, "Biscuit"));
  });

  it("throws when Formspree refuses, so the form can offer a retry", async () => {
    vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ENDPOINT", "https://formspree.io/f/test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422 }));
    await expect(submitApplication(base)).rejects.toThrow(/422/);
  });

  it("throws without an endpoint, without sending anything", async () => {
    vi.stubEnv("NEXT_PUBLIC_FORMSPREE_ENDPOINT", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(submitApplication(base)).rejects.toThrow(/NEXT_PUBLIC_FORMSPREE_ENDPOINT/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
