import { chunkSourceDocuments, type SourceChunk } from "./chunk";
import type { SourceDocument } from "@/server/sources/types";

export type RetrievalHit = {
  chunk: SourceChunk;
  score: number;
};

const stopwords = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "give",
  "how",
  "is",
  "me",
  "of",
  "on",
  "should",
  "the",
  "to",
  "what",
  "where",
  "with",
]);

export function retrieveSourceChunks(
  query: string,
  documents: SourceDocument[],
  limit = 4,
): RetrievalHit[] {
  const queryTerms = tokenize(query);
  const chunks = chunkSourceDocuments(documents);

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTerms, query) }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function scoreChunk(chunk: SourceChunk, queryTerms: string[], rawQuery: string) {
  const title = chunk.document.title.toLowerCase();
  const content = `${title} ${chunk.content.toLowerCase()}`;
  let score = 0;

  for (const term of queryTerms) {
    const occurrences = countOccurrences(content, term);

    if (occurrences === 0) {
      continue;
    }

    const weight = term.length > 4 ? 2 : 1;
    score += Math.min(occurrences, 3) * weight;

    if (title.includes(term)) {
      score += 2;
    }
  }

  // Adjacent query terms appearing together ("ohio state", "roster context")
  // disambiguate far better than the terms alone, so phrase hits dominate.
  for (const phrase of bigrams(queryTerms)) {
    if (content.includes(phrase)) {
      score += 4;
    }
  }

  // Schedule-intent questions should surface the schedule summary and game
  // documents first. This is generic across teams; opponent-specific matches
  // fall out of the term and phrase scoring above.
  if (/next|opener|brief|schedule/i.test(rawQuery)) {
    if (chunk.document.sourceType === "schedule") {
      score += 4;
    }

    if (chunk.document.sourceType === "game") {
      score += 1;
    }
  }

  return score;
}

function countOccurrences(content: string, term: string): number {
  let count = 0;
  let index = content.indexOf(term);

  while (index !== -1) {
    count += 1;
    index = content.indexOf(term, index + term.length);
  }

  return count;
}

function bigrams(terms: string[]): string[] {
  const phrases: string[] = [];

  for (let index = 0; index < terms.length - 1; index += 1) {
    phrases.push(`${terms[index]} ${terms[index + 1]}`);
  }

  return phrases;
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !stopwords.has(term));
}
