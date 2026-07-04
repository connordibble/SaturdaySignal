import {
  CalendarDays,
  Gauge,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import type { CSSProperties } from "react";
import { getSourceReadiness, type TeamConfig } from "@/config/team";
import { formatSite, getNextGame } from "@/server/schedule/schedule";
import { SchedulePreview } from "./schedule-preview";
import { TeamChat } from "./team-chat";

type TeamDashboardProps = {
  team: TeamConfig;
};

export function TeamDashboard({ team }: TeamDashboardProps) {
  const nextGame = getNextGame(team.slug);
  const sourceStates = getSourceReadiness(team);
  const readySourceCount = sourceStates.filter((source) => source.state === "Ready").length;

  return (
    <main
      className="min-h-screen bg-[var(--team-page)] text-[var(--team-ink)]"
      style={createTeamThemeStyle(team)}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-[var(--team-border)] pb-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--team-accent)] text-[var(--team-contrast)] shadow-sm sm:size-11">
              <RadioTower aria-hidden="true" size={23} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight tracking-normal text-[var(--team-ink)] sm:text-2xl">
                Saturday Signal
              </h1>
              <p className="text-xs font-medium leading-5 text-[var(--team-muted)] sm:text-sm">
                {team.referenceLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--team-border-strong)] bg-[var(--team-surface)] px-3 text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
              <ShieldCheck aria-hidden="true" size={15} />
              Independent<span className="hidden sm:inline"> fan project</span>
            </span>
            <span className="inline-flex min-h-10 items-center rounded-md border border-[var(--team-border)] bg-[var(--team-surface-soft)] px-3 text-xs font-semibold uppercase tracking-normal text-[var(--team-steel)]">
              {readySourceCount}/{sourceStates.length} ready
              <span className="hidden sm:inline">&nbsp;source lanes</span>
            </span>
          </div>
        </header>

        <section className="grid flex-1 items-start gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid min-w-0 gap-4">
            <div
              className="flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-[var(--team-border-strong)] bg-[var(--team-surface)] shadow-[0_18px_64px_var(--team-shadow)]"
              data-testid="team-chat-panel"
            >
              <div className="flex items-center justify-between gap-4 border-b border-[var(--team-border)] bg-[var(--team-surface-soft)] px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--team-ink-subtle)]">
                  <MessageSquareText aria-hidden="true" size={18} />
                  <span>Game-week assistant</span>
                </div>
                <span className="hidden rounded-md bg-[var(--team-surface)] px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)] sm:inline-flex">
                  citations on
                </span>
              </div>

              <TeamChat
                compactTagline={`${team.shortName} signal, sourced.`}
                teamSlug={team.slug}
                suggestedPrompts={team.suggestedPrompts}
                tagline={team.tagline}
              />
            </div>

            <SchedulePreview teamSlug={team.slug} />
          </div>

          <aside className="grid content-start gap-4 lg:sticky lg:top-4" data-testid="signal-rail">
            {nextGame ? (
              <section className="overflow-hidden rounded-lg border border-[var(--team-border-strong)] bg-[var(--team-surface)] shadow-sm">
                <div className="bg-[var(--team-steel)] px-4 py-4 text-[var(--team-contrast)]">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-normal opacity-80">
                      Next game
                    </p>
                    <CalendarDays aria-hidden="true" size={22} />
                  </div>
                  <h2 className="mt-2 text-xl font-semibold leading-tight tracking-normal">
                    {team.shortName} {formatSite(nextGame.site)} {nextGame.opponent}
                  </h2>
                </div>
                <dl className="grid grid-cols-2 border-b border-[var(--team-border)] text-sm">
                  <div className="border-r border-b border-[var(--team-border)] p-3">
                    <dt className="font-semibold text-[var(--team-muted)]">Date</dt>
                    <dd className="mt-1 text-[var(--team-ink)]">{nextGame.dateLabel}</dd>
                  </div>
                  <div className="border-b border-[var(--team-border)] p-3">
                    <dt className="font-semibold text-[var(--team-muted)]">Venue</dt>
                    <dd className="mt-1 text-[var(--team-ink)]">{nextGame.venue}</dd>
                  </div>
                  <div className="border-r border-[var(--team-border)] p-3">
                    <dt className="font-semibold text-[var(--team-muted)]">Kickoff</dt>
                    <dd className="mt-1 text-[var(--team-ink)]">{nextGame.kickoff}</dd>
                  </div>
                  <div className="p-3">
                    <dt className="font-semibold text-[var(--team-muted)]">TV</dt>
                    <dd className="mt-1 text-[var(--team-ink)]">{nextGame.tv ?? "TBD"}</dd>
                  </div>
                </dl>
                <p className="px-4 py-3 text-xs leading-5 text-[var(--team-muted)]">
                  {team.nextGameNote}
                </p>
              </section>
            ) : null}

            <section
              className="rounded-lg border border-[var(--team-border)] bg-[var(--team-surface)] p-4 shadow-sm"
              data-testid="source-readiness-panel"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--team-ink-subtle)]">
                  <Gauge aria-hidden="true" size={18} />
                  Source ledger
                </div>
                <span className="text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
                  {readySourceCount} ready
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {sourceStates.map((source) => (
                  <div
                    className="rounded-md border border-[var(--team-border)] bg-[var(--team-surface-soft)] px-2.5 py-2"
                    key={source.label}
                  >
                    <span className="block text-xs font-medium leading-4 text-[var(--team-ink-subtle)]">
                      {source.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
                      {source.state}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-[var(--team-border)] pt-3 text-xs leading-5 text-[var(--team-muted)]">
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
    "--team-shadow": `color-mix(in oklch, ${team.theme.steel} 16%, transparent)`,
  } as CSSProperties;
}
