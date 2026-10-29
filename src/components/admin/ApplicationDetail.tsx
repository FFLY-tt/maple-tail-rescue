"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { ApplicationStatusBadge } from "@/components/admin/ApplicationStatusBadge";
import { formatDateTime } from "@/components/admin/ApplicationList";
import {
  ADULT_OPTIONS,
  CHILD_OPTIONS,
  HAS_PETS_OPTIONS,
  HOUSEHOLD_AGREES_OPTIONS,
  LANDLORD_OPTIONS,
  OWNERSHIP_OPTIONS,
  optionLabel,
} from "@/components/apply/options";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { fetchApplication, updateApplication } from "@/lib/applications-api";
import { mailtoHref, telHref } from "@/lib/links";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type StoredApplication,
} from "@/lib/application-mapping";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Load =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "missing" }
  | { kind: "done"; application: StoredApplication };

type Row = readonly [string, ReactNode];

const LINK = "text-primary underline underline-offset-4 hover:text-primary-hover";

function Section({ title, rows }: { title: string; rows: readonly Row[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <dl className="mt-3 space-y-3">
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt className="text-sm font-semibold text-muted">{term}</dt>
            <dd className="whitespace-pre-wrap break-words">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ApplicationDetail() {
  const id = useSearchParams().get("id") ?? "";
  const valid = UUID.test(id);
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    fetchApplication(id)
      .then((application) => !cancelled && setLoad(application ? { kind: "done", application } : { kind: "missing" }))
      .catch(() => !cancelled && setLoad({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, [id, valid]);

  return (
    <Container narrow className="pt-8 pb-16">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
      >
        <span aria-hidden="true">&larr;&nbsp;</span>All applications
      </Link>

      {!valid || load.kind === "missing" ? (
        <p className="mt-4 text-lg">We couldn&rsquo;t find that application.</p>
      ) : load.kind === "loading" ? (
        <p role="status" className="mt-4 text-muted">
          Loading application…
        </p>
      ) : load.kind === "error" ? (
        <p role="alert" className="mt-4 font-semibold text-danger">
          We couldn&rsquo;t load this application. Please reload the page.
        </p>
      ) : (
        <Details application={load.application} />
      )}
    </Container>
  );
}

function Details({ application }: { application: StoredApplication }) {
  // `a` is the last saved version; status and notes below are the unsaved edits.
  const [a, setSaved] = useState(application);
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.staffNotes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = status !== a.status || notes !== a.staffNotes;

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (saving || !dirty) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateApplication(a.id, { status, staffNotes: notes });
      setSaved({ ...a, status, staffNotes: notes });
      setMessage({ ok: true, text: "Saved." });
    } catch {
      setMessage({ ok: false, text: "We couldn’t save your changes. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const homeRows: Row[] = [["Own or rent", optionLabel(OWNERSHIP_OPTIONS, a.ownership)]];
  if (a.ownership === "rent") {
    homeRows.push(["Landlord allows pets", optionLabel(LANDLORD_OPTIONS, a.landlordPermission ?? undefined)]);
  }
  homeRows.push(
    ["Adults", optionLabel(ADULT_OPTIONS, a.adults)],
    ["Children", optionLabel(CHILD_OPTIONS, a.children)],
    ["Everyone agrees to adopting", optionLabel(HOUSEHOLD_AGREES_OPTIONS, a.householdAgrees)],
  );

  const petRows: Row[] = [["Has pets", optionLabel(HAS_PETS_OPTIONS, a.hasPets)]];
  if (a.hasPets === "yes") petRows.push(["Current pets", a.currentPets ?? ""]);
  petRows.push(["Experience", a.experience]);

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">{a.fullName}</h1>
        <ApplicationStatusBadge status={a.status} />
      </div>
      <p className="text-muted">
        Received {formatDateTime(a.createdAt)}
        {a.updatedAt !== a.createdAt && <> &middot; last changed {formatDateTime(a.updatedAt)}</>}
      </p>

      <form onSubmit={onSave} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-bold">Review</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="font-semibold">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
            className="min-h-11 w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 text-base"
          >
            {APPLICATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {APPLICATION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="staff-notes" className="font-semibold">
            Staff notes
          </label>
          <p id="staff-notes-hint" className="text-sm text-muted">
            Only staff can see these. Up to 5000 characters.
          </p>
          <textarea
            id="staff-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={5000}
            rows={5}
            aria-describedby="staff-notes-hint"
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-base"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <p
            role={message?.ok === false ? "alert" : "status"}
            className={`font-semibold ${message?.ok === false ? "text-danger" : "text-secondary"}`}
          >
            {message?.text}
          </p>
        </div>
      </form>

      <Section
        title="Contact"
        rows={[
          ["Email", <a key="email" href={mailtoHref(a.email)} className={LINK}>{a.email}</a>],
          ["Phone", <a key="phone" href={telHref(a.phone)} className={LINK}>{a.phone}</a>],
        ]}
      />
      <Section title="Home and household" rows={homeRows} />
      <Section title="Pets and experience" rows={petRows} />
      <Section
        title="Animal"
        rows={[
          ["Applying for", a.animalName ?? "No specific animal yet"],
          ["Why they’re interested", a.whyInterested],
        ]}
      />
    </div>
  );
}
