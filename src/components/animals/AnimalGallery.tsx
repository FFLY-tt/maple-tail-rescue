"use client";

import Image from "next/image";
import { useState } from "react";

import { PhotoPlaceholder } from "@/components/animals/PhotoPlaceholder";

type AnimalGalleryProps = {
  name: string;
  photos: readonly string[];
};

export function AnimalGallery({ name, photos }: AnimalGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border">
        <PhotoPlaceholder name={name} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface-alt">
        <Image
          key={photos[selected]}
          src={photos[selected]}
          alt={`Photo ${selected + 1} of ${photos.length} of ${name}`}
          width={960}
          height={1200}
          // The first photo is the page's largest image: load it eagerly.
          preload={selected === 0}
          className="h-full w-full object-cover"
        />
      </div>

      {photos.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label={`Photos of ${name}`}>
          {photos.map((photo, index) => (
            <li key={photo}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                aria-pressed={index === selected}
                className={`block size-16 overflow-hidden rounded-lg border-2 sm:size-20 ${
                  index === selected ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  src={photo}
                  alt=""
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
