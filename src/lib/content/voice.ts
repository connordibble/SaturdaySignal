export type VoiceEvaluation = {
  passed: boolean;
  flags: string[];
  matchedFootballTerms: string[];
};

const bannedPhrases = [
  "as an ai",
  "it is important to note",
  "in conclusion",
  "delve",
  "official partner",
  "guaranteed lock",
];

const footballTerms = [
  "early down",
  "early downs",
  "line of scrimmage",
  "explosive",
  "explosiveness",
  "field position",
  "front seven",
  "pressure",
  "personnel",
  "success rate",
  "epa",
  "ppa",
  "finishing drive",
  "finishing drives",
  "run fit",
  "coverage",
];

const toxicRivalryTerms = ["trash fanbase", "poverty program", "classless"];

export function evaluateVoiceSample(text: string): VoiceEvaluation {
  const normalized = text.toLowerCase().replaceAll(/[\u2010-\u2015-]/g, " ");
  const flags: string[] = [];
  const matchedFootballTerms = footballTerms.filter((term) =>
    normalized.includes(term),
  );

  for (const phrase of bannedPhrases) {
    if (normalized.includes(phrase)) {
      flags.push(`banned phrase: ${phrase}`);
    }
  }

  for (const phrase of toxicRivalryTerms) {
    if (normalized.includes(phrase)) {
      flags.push(`toxic rivalry language: ${phrase}`);
    }
  }

  if (matchedFootballTerms.length === 0) {
    flags.push("missing football-specific language");
  }

  if (!hasCitationCue(text)) {
    flags.push("missing citation or freshness cue");
  }

  return {
    passed: flags.length === 0,
    flags,
    matchedFootballTerms,
  };
}

function hasCitationCue(text: string) {
  return /\[[^\]]+\]|source|freshness|last updated|according to/i.test(text);
}
