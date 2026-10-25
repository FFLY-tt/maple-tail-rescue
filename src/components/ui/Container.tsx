import type { ComponentProps } from "react";

type ContainerProps = ComponentProps<"div"> & { narrow?: boolean };

/** Centered page column with consistent side gutters. */
export function Container({ narrow = false, className, ...props }: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 ${narrow ? "max-w-3xl" : "max-w-6xl"}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
