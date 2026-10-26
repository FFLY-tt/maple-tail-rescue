import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";

const BASE =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "border-2 border-primary bg-transparent text-primary hover:bg-primary-soft",
};

/** Button styling for elements that are not <Button>/<ButtonLink> (e.g. external <a> links). */
export function buttonClass(variant: Variant, className?: string) {
  return `${BASE} ${VARIANTS[variant]}${className ? ` ${className}` : ""}`;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
