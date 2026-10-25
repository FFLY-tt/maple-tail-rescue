type StepIndicatorProps = {
  titles: readonly string[];
  current: number;
};

export function StepIndicator({ titles, current }: StepIndicatorProps) {
  return (
    <nav aria-label="Application progress">
      <ol className="flex gap-2">
        {titles.map((title, index) => {
          const state = index < current ? "done" : index === current ? "current" : "todo";
          return (
            <li
              key={title}
              aria-current={state === "current" ? "step" : undefined}
              className="flex-1"
            >
              <div
                className={`h-2 rounded-full ${state === "todo" ? "bg-border" : "bg-primary"}`}
              />
              <span className="sr-only">
                Step {index + 1}: {title}
                {state === "done" ? " (completed)" : state === "current" ? " (current)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-semibold text-muted" aria-hidden="true">
        Step {current + 1} of {titles.length}
      </p>
    </nav>
  );
}
