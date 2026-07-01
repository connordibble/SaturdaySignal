import { z } from "zod";

const sourceStateSchema = z.object({
  label: z.string().min(1),
  state: z.enum(["Ready", "Planned", "Needs key"]),
});

const teamConfigSchema = z.object({
  slug: z.string().min(1),
  sport: z.literal("football"),
  league: z.literal("college-football"),
  conference: z.string().min(1),
  displayName: z.string().min(1),
  referenceLabel: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  theme: z.object({
    page: z.string().min(1),
    surface: z.string().min(1),
    surfaceSoft: z.string().min(1),
    surfaceStrong: z.string().min(1),
    ink: z.string().min(1),
    inkSubtle: z.string().min(1),
    accent: z.string().min(1),
    accentStrong: z.string().min(1),
    accentSoft: z.string().min(1),
    muted: z.string().min(1),
    border: z.string().min(1),
    borderStrong: z.string().min(1),
    contrast: z.string().min(1),
    steel: z.string().min(1),
  }),
  sourcePolicy: z.object({
    disclaimer: z.string().min(1),
    trustedSourceLabels: z.array(z.string().min(1)),
    protectedMarksGuidance: z.array(z.string().min(1)),
  }),
  voice: z.object({
    posture: z.string().min(1),
    preferredTerms: z.array(z.string().min(1)),
    bannedPhrases: z.array(z.string().min(1)),
  }),
  nextGame: z.object({
    opponent: z.string().min(1),
    site: z.enum(["home", "away", "neutral"]),
    date: z.string().min(1),
    kickoff: z.string().min(1),
    venue: z.string().min(1),
    tv: z.string().optional(),
    note: z.string().min(1),
  }),
  sourceStates: z.array(sourceStateSchema).min(1),
  suggestedPrompts: z.array(z.string().min(1)).min(1),
});

export type TeamConfig = z.infer<typeof teamConfigSchema>;

export const teamConfigs = {
  "texas-football": teamConfigSchema.parse({
    slug: "texas-football",
    sport: "football",
    league: "college-football",
    conference: "SEC",
    displayName: "Texas football",
    referenceLabel: "Texas football reference deployment",
    aliases: ["Texas", "Longhorns", "UT Austin"],
    theme: {
      page: "#fff3e6",
      surface: "#fffaf3",
      surfaceSoft: "#ffead5",
      surfaceStrong: "#f4d8bf",
      ink: "#241711",
      inkSubtle: "#3b2a21",
      accent: "#b65a24",
      accentStrong: "#873b1c",
      accentSoft: "#efc19d",
      muted: "#735845",
      border: "#dec0a5",
      borderStrong: "#bf815c",
      contrast: "#fff8ee",
      steel: "#2f3c44",
    },
    sourcePolicy: {
      disclaimer:
        "Saturday Signal is not affiliated with, endorsed by, or sponsored by The University of Texas at Austin or Texas Athletics.",
      trustedSourceLabels: [
        "CollegeFootballData",
        "Official schedule links",
        "Verified game notes",
      ],
      protectedMarksGuidance: [
        "Do not use official logos or mascot imagery.",
        "Do not use Bevo as product branding.",
        "Do not imply official access, sponsorship, or endorsement.",
      ],
    },
    voice: {
      posture: "smart fan analyst",
      preferredTerms: [
        "early downs",
        "line of scrimmage",
        "explosiveness",
        "field position",
        "pressure",
        "success rate",
        "EPA",
        "PPA",
      ],
      bannedPhrases: [
        "as an AI",
        "it is important to note",
        "official partner",
        "guaranteed lock",
      ],
    },
    nextGame: {
      opponent: "Texas State",
      site: "home",
      date: "Saturday, September 5, 2026",
      kickoff: "2:30 p.m. CT",
      venue: "DKR-Texas Memorial Stadium, Austin, Texas",
      tv: "ESPN",
      note: "The opener is the first baseline check for early-down efficiency, clean operation, and whether Texas controls the line of scrimmage before the schedule tightens.",
    },
    sourceStates: [
      { label: "Schedule fixture", state: "Ready" },
      { label: "CFBD adapter", state: "Planned" },
      { label: "Official links", state: "Planned" },
    ],
    suggestedPrompts: [
      "What should Texas fans watch on early downs?",
      "Give me the next-game briefing.",
      "Where is the roster context still thin?",
    ],
  }),
} satisfies Record<string, TeamConfig>;

export type TeamSlug = keyof typeof teamConfigs;

export const defaultTeamSlug: TeamSlug = "texas-football";
export const defaultTeamConfig = teamConfigs[defaultTeamSlug];
export const enabledTeamSlugs = Object.keys(teamConfigs) as TeamSlug[];

export function getTeamConfig(slug: string): TeamConfig | undefined {
  return teamConfigs[slug as TeamSlug];
}

export function validateTeamConfig(config: TeamConfig): TeamConfig {
  return teamConfigSchema.parse(config);
}
