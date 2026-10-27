"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { getSupabase } from "@/lib/supabase";

const CONTROL = "min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-base";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Already signed in? Skip the form. (/admin checks staff access itself.)
  useEffect(() => {
    let cancelled = false;
    try {
      getSupabase()
        .auth.getSession()
        .then(({ data }) => {
          if (!cancelled && data.session) router.replace("/admin");
        })
        .catch(() => {});
    } catch {
      // Not configured: the sign-in attempt below reports it.
    }
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = new FormData(event.currentTarget);
    setError("");
    setSending(true);
    try {
      const { error: signInError } = await getSupabase().auth.signInWithPassword({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });
      if (signInError) {
        setError(
          signInError.status === 400
            ? "That email and password don’t match. Please try again."
            : "We couldn’t sign you in. Please check your connection and try again.",
        );
        return;
      }
      router.replace("/admin");
    } catch {
      setError("We couldn’t sign you in. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="font-semibold">
          Email
        </label>
        <input id="login-email" name="email" type="email" autoComplete="username" required className={CONTROL} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="font-semibold">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={CONTROL}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={sending}>
        {sending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
