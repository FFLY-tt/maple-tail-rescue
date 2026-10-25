export function PhotoPlaceholder({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={`No photo of ${name} yet`}
      className="flex h-full w-full items-center justify-center bg-surface-alt text-5xl"
    >
      <span aria-hidden="true">🐾</span>
    </div>
  );
}
