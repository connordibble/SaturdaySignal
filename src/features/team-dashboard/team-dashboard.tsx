import {
  CalendarDays,
  Gauge,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import type { TeamConfig } from "@/config/team";
import { SchedulePreview } from "./schedule-preview";
import { TeamChat } from "./team-chat";

type TeamDashboardProps = {
  team: TeamConfig;
};

export function TeamDashboard({ team }: TeamDashboardProps) {
  return (
    <main className="min-h-screen bg-[#f6f5f1] text-[#171916]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#d8d4c6] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-[#17221d] text-[#f6f5f1]">
              <RadioTower aria-hidden="true" size={23} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-[#111411]">
                Saturday Signal
              </h1>
              <p className="text-sm font-medium text-[#657068]">
                {team.referenceLabel}
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#c9c2b0] bg-[#fffdf7] px-3 py-2 text-xs font-semibold uppercase tracking-normal text-[#4f5a52]">
            <ShieldCheck aria-hidden="true" size={15} />
            Independent fan project
          </div>
        </header>

        <section className="grid flex-1 gap-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
          <div className="flex min-h-[620px] flex-col rounded-lg border border-[#d8d4c6] bg-[#fffdf7]">
            <div className="border-b border-[#e0dccf] px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#425047]">
                <MessageSquareText aria-hidden="true" size={18} />
                Game-week assistant
              </div>
            </div>

            <TeamChat teamSlug={team.slug} suggestedPrompts={team.suggestedPrompts} />
          </div>

          <aside className="grid content-start gap-5">
            <section className="rounded-lg border border-[#d8d4c6] bg-[#fffdf7] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-[#7f3f25]">
                    Next game
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                    Texas {formatSite(team.nextGame.site)} {team.nextGame.opponent}
                  </h2>
                </div>
                <CalendarDays aria-hidden="true" className="text-[#557763]" size={25} />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-[#f3f0e7] p-3">
                  <dt className="font-semibold text-[#657068]">Date</dt>
                  <dd className="mt-1 text-[#171916]">{team.nextGame.date}</dd>
                </div>
                <div className="rounded-md bg-[#f3f0e7] p-3">
                  <dt className="font-semibold text-[#657068]">Venue</dt>
                  <dd className="mt-1 text-[#171916]">{team.nextGame.venue}</dd>
                </div>
                <div className="rounded-md bg-[#f3f0e7] p-3">
                  <dt className="font-semibold text-[#657068]">Kickoff</dt>
                  <dd className="mt-1 text-[#171916]">{team.nextGame.kickoff}</dd>
                </div>
                <div className="rounded-md bg-[#f3f0e7] p-3">
                  <dt className="font-semibold text-[#657068]">TV</dt>
                  <dd className="mt-1 text-[#171916]">{team.nextGame.tv ?? "TBD"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-[#4f5a52]">
                {team.nextGame.note}
              </p>
            </section>

            <SchedulePreview />

            <section className="rounded-lg border border-[#d8d4c6] bg-[#fffdf7] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#425047]">
                <Gauge aria-hidden="true" size={18} />
                Source readiness
              </div>
              <div className="mt-4 space-y-3">
                {team.sourceStates.map((source) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md bg-[#f3f0e7] px-3 py-2"
                    key={source.label}
                  >
                    <span className="text-sm font-medium text-[#29322d]">
                      {source.label}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-normal text-[#68746c]">
                      {source.state}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d8d4c6] bg-[#fffdf7] p-5">
              <p className="text-sm leading-6 text-[#4f5a52]">
                {team.sourcePolicy.disclaimer} MVP1 avoids official marks and
                uses source-backed football context.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function formatSite(site: TeamConfig["nextGame"]["site"]) {
  if (site === "away") {
    return "at";
  }

  return "vs";
}
