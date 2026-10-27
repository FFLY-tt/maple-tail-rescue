"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApplicationStatusBadge } from "@/components/admin/ApplicationStatusBadge";
import { Container } from "@/components/ui/Container";
import { fetchApplicationSummaries, type ApplicationSummary } from "@/lib/applications-api";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/application-mapping";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

type Load = { kind: "loading" } | { kind: "error" } | { kind: "done"; rows: ApplicationSummary[] };

export function ApplicationList() {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;
    fetchApplicationSummaries()
      .then((rows) => !cancelled && setLoad({ kind: "done", rows }))
      .catch(() => !cancelled && setLoad({ kind: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = load.kind === "done" ? load.rows : [];
  const visible = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <Container className="pt-8 pb-16">
      <h1 className="font-display text-3xl font-bold">Applications</h1>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="status-filter" className="text-sm font-semibold">
            Status
          </label>
          <select
            id="status-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as ApplicationStatus | "all")}
            className="min-h-11 rounded-lg border border-border-strong bg-surface px-3 text-base"
          >
            <option value="all">All statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        {load.kind === "done" && (
          <p role="status" className="pb-2.5 text-muted">
            Showing {visible.length} of {rows.length}
          </p>
        )}
      </div>

      {load.kind === "loading" && (
        <p role="status" className="mt-8 text-muted">
          Loading applications…
        </p>
      )}
      {load.kind === "error" && (
        <p role="alert" className="mt-8 font-semibold text-danger">
          We couldn&rsquo;t load the applications. Please reload the page.
        </p>
      )}
      {load.kind === "done" && visible.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center text-muted">
          {rows.length === 0 ? "No applications yet." : "No applications with that status."}
        </p>
      )}

      {visible.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[36rem] text-left">
            <caption className="sr-only">Adoption applications, newest first</caption>
            <thead className="border-b border-border text-sm text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Animal</th>
                <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-semibold">
                    <Link
                      href={`/admin/application?id=${row.id}`}
                      className="inline-flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4 hover:text-primary-hover"
                    >
                      {row.fullName}
                    </Link>
                  </th>
                  <td className="px-4 py-3">{row.animalName ?? <span className="text-muted">No specific animal</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ApplicationStatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
