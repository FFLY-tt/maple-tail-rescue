import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  fromApplicationRow,
  toApplicationRow,
  type ApplicationRow,
} from "@/lib/application-mapping";
import { GENERAL_APPLICATION, type ApplicationInput } from "@/lib/application-schema";

const base: ApplicationInput = {
  fullName: "Sam Lee",
  email: "sam@example.com",
  phone: "416-555-0123",
  ownership: "own",
  landlordPermission: null,
  adults: "2",
  children: "1",
  householdAgrees: "yes",
  hasPets: "no",
  currentPets: "",
  experience: "Grew up with dogs",
  animalSlug: GENERAL_APPLICATION,
  whyInterested: "We have the time and space",
};

describe("toApplicationRow", () => {
  it("converts camelCase fields to snake_case columns", () => {
    expect(toApplicationRow(base)).toEqual({
      full_name: "Sam Lee",
      email: "sam@example.com",
      phone: "416-555-0123",
      ownership: "own",
      landlord_permission: null,
      adults: "2",
      children: "1",
      household_agrees: "yes",
      has_pets: "no",
      current_pets: null,
      experience: "Grew up with dogs",
      animal_slug: null,
      animal_name: null,
      why_interested: "We have the time and space",
    });
  });

  it("keeps the landlord answer when renting", () => {
    const row = toApplicationRow({ ...base, ownership: "rent", landlordPermission: "no" });
    expect(row.landlord_permission).toBe("no");
  });

  it("stores NULL for a landlord answer left over from before switching to owning", () => {
    const row = toApplicationRow({ ...base, ownership: "own", landlordPermission: "yes" });
    expect(row.landlord_permission).toBeNull();
  });

  it("keeps the pet description when there are pets, and drops a stale one when there aren't", () => {
    expect(toApplicationRow({ ...base, hasPets: "yes", currentPets: "A cat" }).current_pets).toBe("A cat");
    expect(toApplicationRow({ ...base, hasPets: "no", currentPets: "stale" }).current_pets).toBeNull();
  });

  it("stores the animal's slug and name for a specific animal", () => {
    const row = toApplicationRow({ ...base, animalSlug: "mochi" }, "Mochi");
    expect(row.animal_slug).toBe("mochi");
    expect(row.animal_name).toBe("Mochi");
  });

  it("stores NULL for both animal columns for 'No specific animal yet'", () => {
    const row = toApplicationRow(base, "Ignored");
    expect(row.animal_slug).toBeNull();
    expect(row.animal_name).toBeNull();
  });

  it("stores NULL for both when the animal's name is unknown (never a slug without a name)", () => {
    const row = toApplicationRow({ ...base, animalSlug: "mochi" });
    expect(row.animal_slug).toBeNull();
    expect(row.animal_name).toBeNull();
  });

  it("never includes columns the database sets itself", () => {
    const keys = Object.keys(toApplicationRow(base));
    for (const column of ["id", "created_at", "updated_at", "status", "staff_notes"]) {
      expect(keys).not.toContain(column);
    }
  });
});

describe("fromApplicationRow", () => {
  const row: ApplicationRow = {
    id: "0b9f0c36-7a3c-4a14-9a53-8a3f6c1f1e11",
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-02T09:30:00Z",
    full_name: "Sam Lee",
    email: "sam@example.com",
    phone: "416-555-0123",
    ownership: "rent",
    landlord_permission: "yes",
    adults: "2",
    children: "0",
    household_agrees: "yes",
    has_pets: "yes",
    current_pets: "A beagle",
    experience: "Lots",
    animal_slug: "mochi",
    animal_name: "Mochi",
    why_interested: "We love cats",
    status: "in_review",
    staff_notes: "Called on Monday",
  };

  it("converts snake_case columns to camelCase", () => {
    expect(fromApplicationRow(row)).toEqual({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      fullName: "Sam Lee",
      email: "sam@example.com",
      phone: "416-555-0123",
      ownership: "rent",
      landlordPermission: "yes",
      adults: "2",
      children: "0",
      householdAgrees: "yes",
      hasPets: "yes",
      currentPets: "A beagle",
      experience: "Lots",
      animalSlug: "mochi",
      animalName: "Mochi",
      whyInterested: "We love cats",
      status: "in_review",
      staffNotes: "Called on Monday",
    });
  });

  it("preserves NULLs", () => {
    const stored = fromApplicationRow({ ...row, landlord_permission: null, current_pets: null, animal_slug: null, animal_name: null });
    expect(stored.landlordPermission).toBeNull();
    expect(stored.currentPets).toBeNull();
    expect(stored.animalName).toBeNull();
  });
});

describe("application statuses", () => {
  it("have a label for every status", () => {
    for (const status of APPLICATION_STATUSES) expect(APPLICATION_STATUS_LABELS[status]).toBeTruthy();
  });
});

// Guards against the app and the database drifting apart. They are written by hand in two places.
describe("database contract (supabase/migrations/001_applications.sql)", () => {
  const sql = readFileSync("supabase/migrations/001_applications.sql", "utf8");

  it("allows exactly the statuses the app knows", () => {
    const list = sql.match(/status in \(([^)]*)\)/)?.[1] ?? "";
    const inSql = [...list.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(inSql).toEqual([...APPLICATION_STATUSES]);
  });

  it("lets visitors insert exactly the columns the form sends", () => {
    const grant = sql.match(/grant insert \(([\s\S]*?)\) on table/)?.[1] ?? "";
    const granted = grant.split(",").map((c) => c.trim()).filter(Boolean).sort();
    expect(Object.keys(toApplicationRow(base)).sort()).toEqual(granted);
  });

  it("limits staff updates to status and staff_notes", () => {
    expect(sql).toMatch(/grant update \(status, staff_notes\) on table public\.applications to authenticated/);
  });
});
