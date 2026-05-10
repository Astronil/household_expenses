import { Loader2 } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        aria-hidden
      >
        <div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/25 blur-3xl" />
        <div
          className="absolute bottom-1/4 right-1/4 h-56 w-56 animate-pulse rounded-full bg-chart-2/20 blur-3xl"
          style={{ animationDelay: "800ms" }}
        />
      </div>
      <div
        className="relative z-10 w-full max-w-sm space-y-6 rounded-2xl border border-border/50 bg-card/85 px-8 py-10 text-center shadow-[0_24px_64px_-24px_hsl(var(--foreground)/0.22)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/70"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Household Expenses</h1>
          <p className="text-sm text-muted-foreground">Preparing your dashboard…</p>
        </div>
        <div className="flex justify-center gap-1.5 pt-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
