"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button, buttonClass } from "@/components/ui/Button";
import { FacebookIcon, LinkIcon, ShareIcon } from "@/components/ui/icons";
import { SITE } from "@/content/site";

type ShareAnimalProps = {
  name: string;
  /** Path of the page being shared, e.g. "/animals/mochi". */
  path: string;
  /** One-line message that goes with the link. */
  text: string;
};

const subscribeNever = () => () => {};

/** Web Share API support. False on the server and during hydration, so the first render matches the static HTML. */
function useCanShare() {
  return useSyncExternalStore(
    subscribeNever,
    () => typeof navigator.share === "function",
    () => false,
  );
}

/** The address bar URL once on the client; the configured site address in the static HTML. */
function usePageUrl(path: string) {
  return useSyncExternalStore(
    subscribeNever,
    () => window.location.href,
    () => `${SITE.url}${path}`,
  );
}

const SMALL_BUTTON = "gap-2 px-4";

export function ShareAnimal({ name, path, text }: ShareAnimalProps) {
  const canShare = useCanShare();
  const url = usePageUrl(path);
  const [message, setMessage] = useState("");
  const clearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(clearTimer.current), []);

  function say(next: string) {
    setMessage(next);
    clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setMessage(""), 3000);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      say("Link copied");
    } catch {
      say("Couldn’t copy. Please copy the address from your browser instead.");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: `${name} | ${SITE.name}`, text, url });
    } catch (error) {
      // Closing the share sheet is not an error; anything else falls back to copying.
      if (!(error instanceof DOMException && error.name === "AbortError")) void copyLink();
    }
  }

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canShare ? (
        <Button variant="secondary" className={SMALL_BUTTON} onClick={share}>
          <ShareIcon className="size-5" />
          Share {name}
        </Button>
      ) : (
        <>
          <Button variant="secondary" className={SMALL_BUTTON} onClick={copyLink}>
            <LinkIcon className="size-5" />
            Copy link
          </Button>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", SMALL_BUTTON)}
          >
            <FacebookIcon className="size-5" />
            Share on Facebook
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      )}
      <p role="status" className="text-sm font-semibold text-secondary">
        {message}
      </p>
    </div>
  );
}
