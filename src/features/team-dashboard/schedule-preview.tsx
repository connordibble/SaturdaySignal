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
    <section className="rounded-lg border border-[var(--team-border)] bg-[var(--team-surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
            {schedule.seasonYear} schedule
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            First six-game stretch
          </h2>
        </div>
        <span className="rounded-md bg-[var(--team-surface-soft)] px-2 py-1 text-xs font-semibold uppercase text-[var(--team-accent-strong)]">
          Fixture
        </span>
      </div>
      <div className="mt-4 divide-y divide-[var(--team-border)]">
        {schedule.games.slice(0, 6).map((game) => (
          <div className="grid gap-1 py-3 text-sm" key={game.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-[var(--team-ink-subtle)]">
                {formatSite(game.site)} {game.opponent}
              </span>
              <span className="text-xs font-semibold uppercase text-[var(--team-muted)]">
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
