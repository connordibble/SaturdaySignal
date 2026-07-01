import type { SourceDocument } from "@/server/sources/types";

export type SourceChunk = {
  id: string;
  sourceDocumentId: string;
  chunkIndex: number;
  content: string;
  tokenEstimate: number;
  document: SourceDocument;
};

const maxWords = 90;

export function chunkSourceDocuments(documents: SourceDocument[]): SourceChunk[] {
  return documents.flatMap((document) => {
    const words = document.body.split(/\s+/).filter(Boolean);

    if (words.length <= maxWords) {
      return [createChunk(document, document.body, 0)];
    }

    const chunks: SourceChunk[] = [];

    for (let start = 0; start < words.length; start += maxWords) {
      chunks.push(createChunk(document, words.slice(start, start + maxWords).join(" "), chunks.length));
    }

    return chunks;
  });
}

function createChunk(
  document: SourceDocument,
  content: string,
  chunkIndex: number,
): SourceChunk {
  return {
    id: `${document.id}-chunk-${chunkIndex}`,
    sourceDocumentId: document.id,
    chunkIndex,
    content,
    tokenEstimate: estimateTokens(content),
    document,
  };
}

function estimateTokens(content: string) {
  return Math.ceil(content.split(/\s+/).filter(Boolean).length * 1.35);
}
