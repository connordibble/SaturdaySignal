export type EmbeddingEnv = Record<string, string | undefined>;

// Fixed by the source_chunks.embedding vector(1536) column; every provider
// must emit vectors of exactly this width.
export const embeddingDimensions = 1536;

export type EmbeddingProvider = {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
};

export class EmbeddingProviderError extends Error {
  constructor(
    readonly provider: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(`[${provider}] ${message}`, options);
    this.name = "EmbeddingProviderError";
  }
}
