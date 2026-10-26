import { Tag } from "@/components/ui/Tag";
import { ADOPTION_STEPS } from "@/content/adoption-process";

type AdoptionStepsProps = {
  /** "grid": side-by-side cards (home). "list": stacked rows (process page, success screen). */
  layout: "grid" | "list";
  /** How many steps from the start are marked as done. */
  completedSteps?: number;
  /** Heading level for step titles; pick the one below the section heading. */
  titleTag?: "h3" | "h4";
};

function StepMarker({ number, done }: { number: number; done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-primary-foreground ${
        done ? "bg-secondary" : "bg-primary"
      }`}
    >
      {done ? (
        <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        number
      )}
    </span>
  );
}

export function AdoptionSteps({ layout, completedSteps = 0, titleTag: Title = "h3" }: AdoptionStepsProps) {
  const isGrid = layout === "grid";

  return (
    <ol className={isGrid ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-4" : "space-y-4"}>
      {ADOPTION_STEPS.map((step, index) => {
        const done = index < completedSteps;
        return (
          <li
            key={step.title}
            className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${
              isGrid ? "flex flex-col gap-4" : "flex gap-4"
            }`}
          >
            <StepMarker number={index + 1} done={done} />
            <div className="min-w-0 text-left">
              <Title className="font-display text-xl font-bold">
                {step.title}
              </Title>
              <p className="mt-2 flex flex-wrap items-center gap-2">
                <Tag>{step.time}</Tag>
                {done && <span className="text-sm font-semibold text-secondary">Done</span>}
              </p>
              <p className="mt-2 text-muted">{step.reason}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
