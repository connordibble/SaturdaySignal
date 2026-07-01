import {
  Activity,
  CalendarDays,
  Gauge,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

const nextGame = {
  opponent: "Ohio State",
  date: "Aug. 30, 2025",
  venue: "Columbus, OH",
  note: "Early measuring stick for line play, explosives, and how clean the offense looks on schedule.",
};

const sourceStates = [
  { label: "Schedule fixture", state: "Ready" },
  { label: "CFBD adapter", state: "Planned" },
  { label: "Official links", state: "Planned" },
];

const suggestedPrompts = [
  "What should Texas fans watch on early downs?",
  "Give me the next-game briefing.",
  "Where is the roster context still thin?",
];

export default function Home() {
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
                Texas football reference deployment
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

            <div className="flex flex-1 flex-col justify-between gap-8 p-5">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-normal text-[#7f3f25]">
                  MVP scaffold
                </p>
                <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-[#111411] sm:text-5xl">
                  Built for fans who want signal, not generic recap sludge.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#4f5a52]">
                  Saturday Signal will pair trusted sources, retrieval, and a
                  sports-native voice so answers sound like a sharp fan analyst
                  with citations, not a tech demo in team colors.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {suggestedPrompts.map((prompt) => (
                  <button
                    className="min-h-24 rounded-md border border-[#d8d4c6] bg-[#f9f7ef] p-4 text-left text-sm font-medium leading-5 text-[#29322d] transition hover:border-[#8aa897] hover:bg-[#eef5ef]"
                    key={prompt}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form className="flex flex-col gap-3 border-t border-[#e0dccf] pt-5 sm:flex-row">
                <label className="sr-only" htmlFor="chat-input">
                  Ask Saturday Signal
                </label>
                <input
                  className="min-h-12 flex-1 rounded-md border border-[#c9c2b0] bg-white px-4 text-sm text-[#171916] outline-none transition placeholder:text-[#7b827b] focus:border-[#557763] focus:ring-2 focus:ring-[#b8d8c0]"
                  id="chat-input"
                  placeholder="Ask for a next-game brief, matchup read, or source-backed context..."
                  type="text"
                />
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#17221d] px-5 text-sm font-semibold text-[#f6f5f1] transition hover:bg-[#26382f]"
                  type="button"
                >
                  <Activity aria-hidden="true" size={17} />
                  Ask Saturday Signal
                </button>
              </form>
            </div>
          </div>

          <aside className="grid content-start gap-5">
            <section className="rounded-lg border border-[#d8d4c6] bg-[#fffdf7] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-[#7f3f25]">
                    Next game
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                    Texas at {nextGame.opponent}
                  </h2>
                </div>
                <CalendarDays aria-hidden="true" className="text-[#557763]" size={25} />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-[#f3f0e7] p-3">
                  <dt className="font-semibold text-[#657068]">Date</dt>
                  <dd className="mt-1 text-[#171916]">{nextGame.date}</dd>
                </div>
                <div className="rounded-md bg-[#f3f0e7] p-3">
                  <dt className="font-semibold text-[#657068]">Venue</dt>
                  <dd className="mt-1 text-[#171916]">{nextGame.venue}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-[#4f5a52]">{nextGame.note}</p>
            </section>

            <section className="rounded-lg border border-[#d8d4c6] bg-[#fffdf7] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#425047]">
                <Gauge aria-hidden="true" size={18} />
                Source readiness
              </div>
              <div className="mt-4 space-y-3">
                {sourceStates.map((source) => (
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
                Saturday Signal is not affiliated with, endorsed by, or
                sponsored by The University of Texas at Austin or Texas
                Athletics. MVP1 avoids official marks and uses source-backed
                football context.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
