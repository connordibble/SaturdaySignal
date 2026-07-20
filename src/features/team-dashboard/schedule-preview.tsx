import { formatCaptureDate, formatSite, getTeamSchedule } from "@/server/schedule/schedule";

type SchedulePreviewProps = {
  teamSlug: string;
};

export function SchedulePreview({ teamSlug }: SchedulePreviewProps) {
  const schedule = getTeamSchedule(teamSlug);

  if (!schedule) {
    return null;
  }

  return (
    <section
      className="rounded-lg border border-[var(--team-border)] bg-[var(--team-surface)] p-4 shadow-sm sm:p-5"
      data-testid="schedule-strip"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
            {schedule.seasonYear} schedule
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-[var(--team-ink)]">
            First six-game stretch
          </h2>
        </div>
        <span className="w-fit rounded-md bg-[var(--team-surface-soft)] px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
          Fixture scan
        </span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {schedule.games.slice(0, 6).map((game) => (
          <div
            className="grid gap-2 rounded-md border border-[var(--team-border)] bg-[var(--team-surface-soft)] px-3 py-3 text-sm"
            key={game.id}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 font-semibold text-[var(--team-ink-subtle)]">
                {formatSite(game.site)} {game.opponent}
              </span>
              <span className="shrink-0 text-xs font-semibold uppercase text-[var(--team-muted)]">
                {game.kickoff}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--team-muted)]">
              <span>{game.dateLabel}</span>
              <span>{game.tv ?? "TV TBD"}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--team-muted)]">
        Source freshness: official schedule fixture captured{" "}
        {formatCaptureDate(schedule.capturedAt)}.
      </p>
    </section>
  );
}
