import type { UseFormReturn } from "react-hook-form";

import type { ApplicationInput } from "@/lib/application-schema";

export type ApplicationForm = UseFormReturn<ApplicationInput>;

export type StepProps = { form: ApplicationForm };

/** The animals a person can apply for (adopted ones are filtered out upstream). */
export type ApplyAnimal = { slug: string; name: string; label: string };
