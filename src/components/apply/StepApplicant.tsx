import { CheckboxField, TextField } from "@/components/apply/fields";
import type { StepProps } from "@/components/apply/types";

export function StepApplicant({ form }: StepProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-5">
      <TextField
        registration={register("fullName")}
        label="Full name"
        autoComplete="name"
        error={errors.fullName?.message}
      />
      <TextField
        registration={register("email")}
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
      />
      <TextField
        registration={register("phone")}
        label="Phone number"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        hint="We’ll call to chat about your application."
        error={errors.phone?.message}
      />
      <TextField
        registration={register("city")}
        label="City"
        autoComplete="address-level2"
        hint="We adopt to the Greater Toronto Area."
        error={errors.city?.message}
      />
      <CheckboxField
        registration={register("isAdult")}
        label="I am 18 years of age or older."
        error={errors.isAdult?.message}
      />
    </div>
  );
}
