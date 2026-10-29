import type { ComponentProps, ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import type { Option } from "@/lib/application-options";

type FieldProps = {
  registration: UseFormRegisterReturn;
  label: string;
  hint?: string;
  error?: string;
};

const CONTROL =
  "w-full rounded-lg border bg-surface px-3 text-base";

function controlClass(error?: string) {
  return `${CONTROL} ${error ? "border-danger" : "border-border-strong"}`;
}

function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

function Hint({ id, children }: { id: string; children?: ReactNode }) {
  return children ? (
    <p id={`${id}-hint`} className="text-sm text-muted">
      {children}
    </p>
  ) : null;
}

function ErrorText({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={`${id}-error`} className="text-sm font-semibold text-danger">
      {children}
    </p>
  ) : null;
}

function Shell({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <Hint id={id}>{hint}</Hint>
      {children}
      <ErrorText id={id}>{error}</ErrorText>
    </div>
  );
}

type TextFieldProps = FieldProps &
  Pick<ComponentProps<"input">, "type" | "autoComplete" | "inputMode">;

export function TextField({ registration, label, hint, error, ...inputProps }: TextFieldProps) {
  const id = registration.name;
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        {...registration}
        {...inputProps}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClass(error)} min-h-11`}
      />
    </Shell>
  );
}

export function TextareaField({ registration, label, hint, error, rows = 4 }: FieldProps & { rows?: number }) {
  const id = registration.name;
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        {...registration}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClass(error)} py-2`}
      />
    </Shell>
  );
}

export function SelectField({
  registration,
  label,
  hint,
  error,
  options,
}: FieldProps & { options: readonly Option[] }) {
  const id = registration.name;
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        defaultValue=""
        {...registration}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClass(error)} min-h-11`}
      >
        <option value="" disabled>
          Choose one…
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

export function RadioField({
  registration,
  label,
  hint,
  error,
  options,
}: FieldProps & { options: readonly Option[] }) {
  const id = registration.name;
  return (
    <fieldset
      aria-describedby={describedBy(id, hint, error)}
      className="flex flex-col gap-1.5"
    >
      <legend className="font-semibold">{label}</legend>
      <Hint id={id}>{hint}</Hint>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {options.map((option) => (
          <label key={option.value} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              value={option.value}
              {...registration}
              className="size-5 accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
      <ErrorText id={id}>{error}</ErrorText>
    </fieldset>
  );
}

export function CheckboxField({ registration, label, error }: Omit<FieldProps, "hint">) {
  const id = registration.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          {...registration}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, undefined, error)}
          className="mt-0.5 size-6 shrink-0 accent-primary"
        />
        <span>{label}</span>
      </label>
      <ErrorText id={id}>{error}</ErrorText>
    </div>
  );
}
