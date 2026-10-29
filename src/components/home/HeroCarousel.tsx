"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type PointerEvent } from "react";

import { PhotoPlaceholder } from "@/components/animals/PhotoPlaceholder";
import { StatusBadge } from "@/components/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { getAgeLabel, getSpeciesLabel } from "@/lib/labels";
import type { Animal } from "@/types/animal";

const SLIDE_MS = 5000;

/** Horizontal distance (px) a touch must travel to count as a swipe. */
const SWIPE_PX = 40;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** False on the server and during hydration, so the first render is the same everywhere. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

// Overlay controls: a translucent white disc, faint at rest and firmer once the
// carousel is hovered or has focus inside (hover styles only apply on devices that hover).
const OVERLAY_BUTTON =
  "pointer-events-auto absolute flex items-center justify-center rounded-full bg-white/55 text-foreground shadow-md transition-colors hover:bg-white group-hover/carousel:bg-white/90 group-focus-within/carousel:bg-white/90";

function Icon({ path, className = "size-5" }: { path: string; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d={path} />
    </svg>
  );
}

const PREV_ICON = "M12.5 3.5 6 10l6.5 6.5 1.5-1.5L9 10l5-5z";
const NEXT_ICON = "M7.5 3.5 6 5l5 5-5 5 1.5 1.5L14 10z";
const PAUSE_ICON = "M5 3h4v14H5zM11 3h4v14h-4z";
const PLAY_ICON = "M6 3.5v13L16.5 10z";

/**
 * Rotates through every animal it is given, one after another, so each gets
 * the same screen time. The first render always shows animals[0] (the page is
 * statically exported); a random start is picked after mount.
 */
export function HeroCarousel({ animals }: { animals: readonly Animal[] }) {
  const count = animals.length;
  const reducedMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  // Only the current slide, the next one and the one fading out get an <img>; the
  // rest render an empty frame. `ready` turns on loading the next slide after mount;
  // `leaving` is the slide just left, kept until the next change so it can fade out.
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState<number | null>(null);
  // Slides only fade once the visitor or the timer has changed them, so the
  // jump to a random start slide after mount is not animated.
  const [animate, setAnimate] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  // Only set by manual navigation; cleared by auto-advance so it stays silent.
  const [announcement, setAnnouncement] = useState("");
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const autoAdvance = count > 1 && !reducedMotion && !userPaused && !hovered && !keyboardFocused;

  // Equal time for everyone: start anywhere, not always on the first animal.
  // Every slide is stacked in the same grid cell, so this causes no layout shift.
  // The picked slide's photo is fetched first and the switch happens once it has
  // loaded, so the visitor never sees an empty frame.
  useEffect(() => {
    let cancelled = false;
    const start = count > 1 ? Math.floor(Math.random() * count) : 0;
    const photo = animals[start]?.photos[0];
    const switchTo = () => {
      if (cancelled) return;
      setIndex(start);
      setReady(true);
    };
    if (start === 0 || !photo) {
      // Slide 0 is already on screen; nothing to fetch. Deferred only to keep the effect body free of synchronous state updates.
      void Promise.resolve().then(switchTo);
    } else {
      const image = new window.Image();
      image.src = photo;
      image.decode().then(switchTo, switchTo);
    }
    return () => {
      cancelled = true;
    };
  }, [animals, count]);

  // A fresh timeout per slide (and per resume) gives each slide a full interval.
  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setTimeout(() => {
      setAnimate(true);
      setAnnouncement("");
      setLeaving(index);
      setIndex((index + 1) % count);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [autoAdvance, index, count]);

  if (count === 0) return null;

  function showSlide(target: number) {
    const next = (target + count) % count;
    const animal = animals[next];
    setAnimate(true);
    setLeaving(index);
    setIndex(next);
    setAnnouncement(
      `${animal.name}, ${getSpeciesLabel(animal.species).toLowerCase()}, ${getAgeLabel(animal).toLowerCase()}. Slide ${next + 1} of ${count}.`,
    );
  }

  // Mouse only: touch "hover" is sticky and would leave the carousel paused.
  const onPointerEnter = (event: PointerEvent) => event.pointerType === "mouse" && setHovered(true);
  const onPointerLeave = (event: PointerEvent) => event.pointerType === "mouse" && setHovered(false);

  // Pause for keyboard focus only. A mouse click also focuses a button, and
  // that must not leave the carousel paused after the pointer moves away.
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.matches(":focus-visible")) setKeyboardFocused(true);
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocused(false);
  };

  // Touch/pen swipe. Mouse users have the arrow buttons, and a press that
  // starts on a button or link is a tap, not a swipe.
  const onSwipeStart = (event: PointerEvent) => {
    const onControl = (event.target as Element).closest("button, a");
    swipeStart.current =
      event.pointerType === "mouse" || onControl ? null : { x: event.clientX, y: event.clientY };
  };
  const onSwipeEnd = (event: PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      showSlide(index + (dx < 0 ? 1 : -1));
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Animals looking for homes"
      className="group/carousel mx-auto w-full max-w-sm md:max-w-md"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {/* touch-pan-y: vertical scrolling stays native, horizontal drags reach the swipe handlers. */}
      <div
        className="relative touch-pan-y"
        onPointerDown={onSwipeStart}
        onPointerUp={onSwipeEnd}
        onPointerCancel={() => (swipeStart.current = null)}
      >
        {/* Controls sit over the photo, which is the top 4:5 of every slide. They
            come first in the DOM so they are first in the tab order. */}
        {count > 1 && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[4/5]">
            <button
              type="button"
              aria-label="Previous animal"
              onClick={() => showSlide(index - 1)}
              className={`${OVERLAY_BUTTON} left-2 top-1/2 size-10 -translate-y-1/2`}
            >
              <Icon path={PREV_ICON} />
            </button>
            <button
              type="button"
              aria-label="Next animal"
              onClick={() => showSlide(index + 1)}
              className={`${OVERLAY_BUTTON} right-2 top-1/2 size-10 -translate-y-1/2`}
            >
              <Icon path={NEXT_ICON} />
            </button>

            {/* Dark translucent pill keeps the white dots readable on any photo. */}
            <div
              role="group"
              aria-label="Choose an animal"
              className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center rounded-full bg-black/35 px-1.5 py-1 backdrop-blur-sm"
            >
              {animals.map((animal, i) => (
                <button
                  key={animal.id}
                  type="button"
                  aria-label={`Show ${animal.name}, ${i + 1} of ${count}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => showSlide(i)}
                  className="flex size-6 items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden="true"
                    className={`block size-2.5 rounded-full transition-colors ${
                      i === index ? "bg-white" : "bg-white/50"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Nothing rotates under reduced motion, so there is nothing to pause. */}
            {!reducedMotion && (
              <button
                type="button"
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => setUserPaused((paused) => !paused)}
                className={`${OVERLAY_BUTTON} bottom-3 right-3 size-8`}
              >
                <Icon path={userPaused ? PLAY_ICON : PAUSE_ICON} className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* All slides share one grid cell, so the carousel keeps the height of the tallest. */}
        <div className="grid">
          {animals.map((animal, i) => {
            const active = i === index;
            const photo = animal.photos[0];
            const loadPhoto = active || i === leaving || (ready && i === (index + 1) % count);
            return (
              <div
                key={animal.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                inert={!active}
                className={`col-start-1 row-start-1 ${
                  animate ? "transition-opacity duration-500 motion-reduce:transition-none" : ""
                } ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface shadow-md">
                  {!photo ? (
                    <PhotoPlaceholder name={animal.name} />
                  ) : loadPhoto ? (
                    <Image
                      src={photo}
                      alt={`Photo of ${animal.name}`}
                      width={800}
                      height={1000}
                      preload={i === 0}
                      draggable={false}
                      className="h-full w-full select-none object-cover"
                    />
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-display text-2xl font-bold leading-tight">{animal.name}</p>
                      <StatusBadge status={animal.status} />
                    </div>
                    <p className="mt-1 text-muted">
                      {getSpeciesLabel(animal.species)} · {getAgeLabel(animal)}
                    </p>
                  </div>
                  <ButtonLink href={`/animals/${animal.slug}`} variant="secondary">
                    Meet {animal.name}
                  </ButtonLink>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Always polite, but only ever filled in by manual navigation. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
