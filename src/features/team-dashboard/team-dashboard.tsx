import {
  CalendarDays,
  Gauge,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { TeamConfig } from "@/config/team";
import { SchedulePreview } from "./schedule-preview";
import { TeamChat } from "./team-chat";

type TeamDashboardProps = {
  team: TeamConfig;
};

export function TeamDashboard({ team }: TeamDashboardProps) {
  return (
    <main
      className="min-h-screen bg-[var(--team-page)] text-[var(--team-ink)]"
      style={createTeamThemeStyle(team)}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 h-1.5 rounded-full bg-[var(--team-accent)]" />
        <header className="flex flex-col gap-4 border-b border-[var(--team-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-[var(--team-accent)] text-[var(--team-contrast)] shadow-sm">
              <RadioTower aria-hidden="true" size={23} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-[var(--team-ink)]">
                Saturday Signal
              </h1>
              <p className="text-sm font-medium text-[var(--team-muted)]">
                {team.referenceLabel}
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[var(--team-border-strong)] bg-[var(--team-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
            <ShieldCheck aria-hidden="true" size={15} />
            Independent fan project
          </div>
        </header>

        <section className="grid flex-1 gap-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
          <div className="flex min-h-[620px] flex-col rounded-lg border border-[var(--team-border-strong)] bg-[var(--team-surface)] shadow-[0_18px_60px_rgba(59,42,33,0.12)]">
            <div className="border-b border-[var(--team-border)] bg-[var(--team-surface-soft)] px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--team-ink-subtle)]">
                <MessageSquareText aria-hidden="true" size={18} />
                Game-week assistant
              </div>
            </div>

            <TeamChat teamSlug={team.slug} suggestedPrompts={team.suggestedPrompts} />
          </div>

          <aside className="grid content-start gap-5">
            <section className="rounded-lg border border-[var(--team-border-strong)] bg-[var(--team-surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
                    Next game
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                    Texas {formatSite(team.nextGame.site)} {team.nextGame.opponent}
                  </h2>
                </div>
                <CalendarDays aria-hidden="true" className="text-[var(--team-accent)]" size={25} />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-[var(--team-surface-soft)] p-3">
                  <dt className="font-semibold text-[var(--team-muted)]">Date</dt>
                  <dd className="mt-1 text-[var(--team-ink)]">{team.nextGame.date}</dd>
                </div>
                <div className="rounded-md bg-[var(--team-surface-soft)] p-3">
                  <dt className="font-semibold text-[var(--team-muted)]">Venue</dt>
                  <dd className="mt-1 text-[var(--team-ink)]">{team.nextGame.venue}</dd>
                </div>
                <div className="rounded-md bg-[var(--team-surface-soft)] p-3">
                  <dt className="font-semibold text-[var(--team-muted)]">Kickoff</dt>
                  <dd className="mt-1 text-[var(--team-ink)]">{team.nextGame.kickoff}</dd>
                </div>
                <div className="rounded-md bg-[var(--team-surface-soft)] p-3">
                  <dt className="font-semibold text-[var(--team-muted)]">TV</dt>
                  <dd className="mt-1 text-[var(--team-ink)]">{team.nextGame.tv ?? "TBD"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-[var(--team-muted)]">
                {team.nextGame.note}
              </p>
            </section>

            <SchedulePreview />

            <section className="rounded-lg border border-[var(--team-border)] bg-[var(--team-surface)] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--team-ink-subtle)]">
                <Gauge aria-hidden="true" size={18} />
                Source readiness
              </div>
              <div className="mt-4 space-y-3">
                {team.sourceStates.map((source) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md bg-[var(--team-surface-soft)] px-3 py-2"
                    key={source.label}
                  >
                    <span className="text-sm font-medium text-[var(--team-ink-subtle)]">
                      {source.label}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
                      {source.state}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--team-border)] bg-[var(--team-surface)] p-5 shadow-sm">
              <p className="text-sm leading-6 text-[var(--team-muted)]">
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

function createTeamThemeStyle(team: TeamConfig) {
  return {
    "--team-page": team.theme.page,
    "--team-surface": team.theme.surface,
    "--team-surface-soft": team.theme.surfaceSoft,
    "--team-surface-strong": team.theme.surfaceStrong,
    "--team-ink": team.theme.ink,
    "--team-ink-subtle": team.theme.inkSubtle,
    "--team-accent": team.theme.accent,
    "--team-accent-strong": team.theme.accentStrong,
    "--team-accent-soft": team.theme.accentSoft,
    "--team-muted": team.theme.muted,
    "--team-border": team.theme.border,
    "--team-border-strong": team.theme.borderStrong,
    "--team-contrast": team.theme.contrast,
    "--team-steel": team.theme.steel,
  } as CSSProperties;
}

function formatSite(site: TeamConfig["nextGame"]["site"]) {
  if (site === "away") {
    return "at";
  }

  return "vs";
}
