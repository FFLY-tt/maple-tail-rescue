/**
 * Checks the database rules from the point of view of a visitor: the publishable
 * (anon) key and no sign-in. Run with `npm run test:rls` (reads .env.local).
 *
 * Expected: a valid application can be sent, and nothing else works: no reading,
 * updating or deleting, no sneaking in a status, and no data the form would reject.
 *
 * Applicants can't delete, so the test row it creates stays in the table. Remove
 * it in the SQL Editor:  delete from public.applications where email = 'rls-test@example.com';
 */
import { createClient } from "@supabase/supabase-js";

import { toApplicationRow } from "../src/lib/application-mapping";
import type { ApplicationInput } from "../src/lib/application-schema";

const TEST_EMAIL = "rls-test@example.com";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Create .env.local (see .env.example).");
  process.exit(1);
}

// This project must only ever use the publishable key. Refuse a secret key outright.
function looksLikeSecretKey(value: string) {
  if (value.startsWith("sb_secret_")) return true;
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1] ?? "", "base64url").toString());
    return payload.role === "service_role";
  } catch {
    return false;
  }
}
if (looksLikeSecretKey(key)) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY holds a secret/service_role key. Use the publishable (anon) key only.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const valid: ApplicationInput = {
  fullName: "RLS Test",
  email: TEST_EMAIL,
  phone: "416-555-0123",
  ownership: "own",
  landlordPermission: null,
  adults: "2",
  children: "0",
  householdAgrees: "yes",
  hasPets: "no",
  currentPets: "",
  experience: "Automated test",
  animalSlug: "general",
  whyInterested: "Automated test of the database rules",
};
const validRow = toApplicationRow(valid);

let failures = 0;
function report(pass: boolean, label: string, detail: string) {
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

/** Passes when the request errored or touched no rows. */
function denied(result: { error: { message: string } | null; data: unknown[] | null }) {
  const rows = result.data?.length ?? 0;
  return {
    pass: result.error !== null || rows === 0,
    detail: result.error ? result.error.message : `${rows} rows`,
  };
}

async function main() {
  // 1. A valid application is accepted. No .select(): visitors can't read the row back.
  {
    const { error } = await supabase.from("applications").insert(validRow);
    report(error === null, "insert a valid application", error?.message ?? "");
  }

  // 2. Reading is not allowed.
  {
    const result = await supabase.from("applications").select("id");
    const { pass, detail } = denied(result);
    report(pass, "select applications returns nothing", detail);
  }

  // 3. Updating is not allowed.
  {
    const result = await supabase.from("applications").update({ status: "approved" }).eq("email", TEST_EMAIL).select("id");
    const { pass, detail } = denied(result);
    report(pass, "update an application fails", detail);
  }

  // 4. Deleting is not allowed.
  {
    const result = await supabase.from("applications").delete().eq("email", TEST_EMAIL).select("id");
    const { pass, detail } = denied(result);
    report(pass, "delete an application fails", detail);
  }

  // 5. Applicants can't choose their own status or write staff notes.
  for (const [label, extra] of [
    ["insert with status 'approved' is rejected", { status: "approved" }],
    ["insert with staff notes is rejected", { staff_notes: "sneaky" }],
  ] as const) {
    const { error } = await supabase.from("applications").insert({ ...validRow, ...extra });
    report(error !== null, label, error?.message ?? "it was accepted");
  }

  // 6. Constraints reject what the form would reject.
  const bad: [string, Partial<typeof validRow>][] = [
    ["name without letters ('645') is rejected", { full_name: "645" }],
    ["bad email is rejected", { email: "not-an-email" }],
    ["email with ? or & is rejected", { email: "a@example.com?bcc=x@y.example" }],
    ["short phone number is rejected", { phone: "123" }],
    ["renting without a landlord answer is rejected", { ownership: "rent", landlord_permission: null }],
    ["has pets without a description is rejected", { has_pets: "yes", current_pets: null }],
    ["too-short reason is rejected", { why_interested: "short" }],
    ["animal name without a slug is rejected", { animal_slug: null, animal_name: "Mochi" }],
  ];
  for (const [label, override] of bad) {
    const { error } = await supabase.from("applications").insert({ ...validRow, ...override });
    report(error !== null, label, error?.message ?? "it was accepted");
  }

  // 7. The staff list is private.
  {
    const result = await supabase.from("staff").select("user_id");
    const { pass, detail } = denied(result);
    report(pass, "select staff returns nothing", detail);
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  console.log(`Cleanup: delete from public.applications where email = '${TEST_EMAIL}';  (SQL Editor)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Could not run the checks:", error);
  process.exit(1);
});
