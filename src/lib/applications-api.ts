/** Browser-side calls to the `applications` table. Access is enforced by RLS, not here. */
import {
  fromApplicationRow,
  toApplicationRow,
  type ApplicationRow,
  type ApplicationStatus,
  type StoredApplication,
} from "@/lib/application-mapping";
import type { ApplicationInput } from "@/lib/application-schema";
import { getSupabase } from "@/lib/supabase";

/**
 * Saves a submitted application. Deliberately does not ask for the new row
 * back: visitors are not allowed to read the table, so that request would fail.
 * Throws if the insert is rejected.
 */
export async function submitApplication(input: ApplicationInput, animalName?: string): Promise<void> {
  const { error } = await getSupabase().from("applications").insert(toApplicationRow(input, animalName));
  if (error) throw error;
}

/** Columns the staff list needs. */
const LIST_COLUMNS = "id, created_at, full_name, animal_name, status";

export type ApplicationSummary = Pick<StoredApplication, "id" | "createdAt" | "fullName" | "animalName" | "status">;

/** Newest first. Staff only: anyone else gets an empty list from RLS. */
export async function fetchApplicationSummaries(): Promise<ApplicationSummary[]> {
  const { data, error } = await getSupabase()
    .from("applications")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    fullName: row.full_name as string,
    animalName: row.animal_name as string | null,
    status: row.status as ApplicationStatus,
  }));
}

/** One full application, or null if it doesn't exist (or isn't visible to this user). */
export async function fetchApplication(id: string): Promise<StoredApplication | null> {
  const { data, error } = await getSupabase().from("applications").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromApplicationRow(data as ApplicationRow) : null;
}

/** Staff only. Throws if nothing was updated (e.g. the user is not staff). */
export async function updateApplication(
  id: string,
  changes: { status: ApplicationStatus; staffNotes: string },
): Promise<void> {
  const { data, error } = await getSupabase()
    .from("applications")
    .update({ status: changes.status, staff_notes: changes.staffNotes })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("The application was not updated.");
}
