import scheduleFixture from "../../../data/fixtures/texas-football/schedule.json";

const siteLabels = {
  home: "vs",
  away: "at",
  neutral: "neutral",
} as const;

export function SchedulePreview() {
  return (
    <section className="rounded-lg border border-[#d8d4c6] bg-[#fffdf7] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[#7f3f25]">
            2026 schedule
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal">
            First six-game stretch
          </h2>
        </div>
        <span className="rounded-md bg-[#eef5ef] px-2 py-1 text-xs font-semibold uppercase text-[#557763]">
          Fixture
        </span>
      </div>
      <div className="mt-4 divide-y divide-[#e0dccf]">
        {scheduleFixture.games.slice(0, 6).map((game) => (
          <div className="grid gap-1 py-3 text-sm" key={game.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-[#29322d]">
                {siteLabels[game.site as keyof typeof siteLabels]} {game.opponent}
              </span>
              <span className="text-xs font-semibold uppercase text-[#657068]">
                {game.kickoff}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#657068]">
              <span>{game.dateLabel}</span>
              <span>{game.tv ?? "TV TBD"}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#657068]">
        Source freshness: official schedule fixture captured July 1, 2026.
      </p>
    </section>
  );
}
