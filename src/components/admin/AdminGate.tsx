"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getSupabase } from "@/lib/supabase";

type Access =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "not-staff"; email: string }
  | { kind: "staff"; email: string }
  | { kind: "error" };

async function signOut() {
  await getSupabase().auth.signOut();
}

/**
 * Client-side guard for the staff pages. This only decides what to SHOW: the
 * data itself is protected by Row Level Security, so skipping this guard (or
 * editing it away in the browser) still yields no rows and no updates.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [access, setAccess] = useState<Access>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function check(session: Session | null) {
      if (!session) return setAccess({ kind: "signed-out" });
      const email = session.user.email ?? "";
      try {
        // The staff table only ever returns the signed-in user's own row (RLS).
        const { data, error } = await getSupabase()
          .from("staff")
          .select("user_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) return setAccess({ kind: "error" });
        setAccess(data ? { kind: "staff", email } : { kind: "not-staff", email });
      } catch {
        if (!cancelled) setAccess({ kind: "error" });
      }
    }

    async function start() {
      let supabase;
      try {
        supabase = getSupabase();
      } catch {
        return setAccess({ kind: "error" });
      }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) void check(data.session);

      return supabase.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") return;
        // Don't call Supabase from inside this callback; defer to avoid a deadlock.
        setTimeout(() => void check(session), 0);
      });
    }

    const subscription = start();
    return () => {
      cancelled = true;
      void subscription.then((result) => result?.data.subscription.unsubscribe());
    };
  }, []);

  useEffect(() => {
    if (access.kind === "signed-out") router.replace("/admin/login");
  }, [access.kind, router]);

  if (access.kind === "loading" || access.kind === "signed-out") {
    return (
      <Container className="py-16">
        <p role="status" className="text-muted">
          Checking your access…
        </p>
      </Container>
    );
  }

  if (access.kind === "error") {
    return (
      <Container narrow className="py-16">
        <p role="alert" className="font-semibold text-danger">
          We couldn&rsquo;t check your access. Please check your connection and reload the page.
        </p>
      </Container>
    );
  }

  if (access.kind === "not-staff") {
    return (
      <Container narrow className="py-16">
        <h1 className="font-display text-3xl font-bold">You don&rsquo;t have access</h1>
        <p className="mt-3 text-lg">
          You&rsquo;re signed in as <strong className="break-all">{access.email}</strong>, but this
          account isn&rsquo;t on the staff list.
        </p>
        <Button className="mt-6" variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </Container>
    );
  }

  return (
    <>
      <div className="border-b border-border bg-surface-alt">
        <Container className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
          <p className="text-sm text-muted">
            Staff area &middot; signed in as <span className="break-all font-semibold">{access.email}</span>
          </p>
          <Button variant="secondary" className="min-h-9 px-4 py-1 text-sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </Container>
      </div>
      {children}
    </>
  );
}
