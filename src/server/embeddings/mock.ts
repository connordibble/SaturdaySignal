import { embeddingDimensions, type EmbeddingProvider } from "./types";

// Deterministic offline embedding: unigrams and bigrams hashed into a fixed
// 1536-dim bag-of-words vector, L2-normalized. Cosine similarity then behaves
// like lexical overlap with phrase sensitivity — not semantic, but stable,
// free, and good enough to exercise the full pgvector path without a key.
export function createMockEmbeddingProvider(): EmbeddingProvider {
  return {
    name: "mock",
    model: "hashed-bag-of-words",
    dimensions: embeddingDimensions,

    async embed(texts: string[]) {
      return texts.map(embedText);
    },
  };
}

function embedText(text: string): number[] {
  const vector = new Array<number>(embeddingDimensions).fill(0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    vector[fnv1a(token) % embeddingDimensions] += 1;
  }

  for (let index = 0; index < tokens.length - 1; index += 1) {
    vector[fnv1a(`${tokens[index]} ${tokens[index + 1]}`) % embeddingDimensions] += 1;
  }

  return l2Normalize(vector);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
}

function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (norm === 0) {
    return vector;
  }

  return vector.map((value) => value / norm);
}
