import { collectSourceDocuments } from "../src/server/ingest/pipeline";
import { defaultTeamConfig } from "../src/config/team";
import { createDbClient } from "../src/server/db/client";
import {
  games,
  seasons,
  sourceChunks,
  sourceDocuments,
  teams,
} from "../src/server/db/schema";
import { chunkSourceDocuments } from "../src/server/rag/chunk";
import { resolveEmbeddingProvider } from "../src/server/embeddings/registry";
import scheduleFixture from "../data/fixtures/texas-football/schedule.json";

async function main() {
  const { db, client } = createDbClient();
  const result = await collectSourceDocuments("texas-football");

  await db
    .insert(teams)
    .values({
      slug: defaultTeamConfig.slug,
      displayName: defaultTeamConfig.displayName,
      sport: defaultTeamConfig.sport,
      conference: defaultTeamConfig.conference,
      aliases: defaultTeamConfig.aliases,
    })
    .onConflictDoUpdate({
      target: teams.slug,
      set: {
        displayName: defaultTeamConfig.displayName,
        sport: defaultTeamConfig.sport,
        conference: defaultTeamConfig.conference,
        aliases: defaultTeamConfig.aliases,
      },
    });

  await db
    .insert(seasons)
    .values({
      teamSlug: defaultTeamConfig.slug,
      year: scheduleFixture.seasonYear,
      label: `${scheduleFixture.seasonYear} Texas football`,
    })
    .onConflictDoUpdate({
      target: [seasons.teamSlug, seasons.year],
      set: {
        label: `${scheduleFixture.seasonYear} Texas football`,
      },
    });

  for (const game of scheduleFixture.games) {
    await db
      .insert(games)
      .values({
        id: game.id,
        teamSlug: defaultTeamConfig.slug,
        seasonYear: scheduleFixture.seasonYear,
        opponent: game.opponent,
        site: game.site,
        startsAt: game.startsAt ? new Date(game.startsAt) : null,
        venue: game.venue,
        tv: game.tv,
        sourceUrl: scheduleFixture.sourceUrl,
        metadata: {
          dateLabel: game.dateLabel,
          kickoff: game.kickoff,
        },
      })
      .onConflictDoUpdate({
        target: games.id,
        set: {
          opponent: game.opponent,
          site: game.site,
          startsAt: game.startsAt ? new Date(game.startsAt) : null,
          venue: game.venue,
          tv: game.tv,
          sourceUrl: scheduleFixture.sourceUrl,
          metadata: {
            dateLabel: game.dateLabel,
            kickoff: game.kickoff,
          },
        },
      });
  }

  for (const document of result.documents) {
    await db
      .insert(sourceDocuments)
      .values({
        id: document.id,
        teamSlug: document.teamSlug,
        provider: document.provider,
        sourceType: document.sourceType,
        sourceUrl: document.sourceUrl,
        title: document.title,
        body: document.body,
        metadata: document.metadata,
        publishedAt: document.publishedAt ? new Date(document.publishedAt) : null,
        fetchedAt: new Date(document.fetchedAt),
      })
      .onConflictDoUpdate({
        target: sourceDocuments.id,
        set: {
          sourceUrl: document.sourceUrl,
          title: document.title,
          body: document.body,
          metadata: document.metadata,
          publishedAt: document.publishedAt ? new Date(document.publishedAt) : null,
          fetchedAt: new Date(document.fetchedAt),
        },
      });
  }

  // Chunk the corpus and persist embeddings so chat can use pgvector search.
  // Uses the configured embedding provider (deterministic mock by default, a
  // real model when OPENAI_API_KEY / EMBEDDINGS_PROVIDER is set).
  const { provider: embeddings, warning: embeddingWarning } = resolveEmbeddingProvider();
  const chunks = chunkSourceDocuments(result.documents);
  const vectors = await embeddings.embed(chunks.map((chunk) => chunk.content));

  for (const [index, chunk] of chunks.entries()) {
    const embedding = vectors[index];

    await db
      .insert(sourceChunks)
      .values({
        id: chunk.id,
        sourceDocumentId: chunk.sourceDocumentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenEstimate: chunk.tokenEstimate,
        embedding,
        metadata: {},
      })
      .onConflictDoUpdate({
        target: sourceChunks.id,
        set: {
          content: chunk.content,
          tokenEstimate: chunk.tokenEstimate,
          embedding,
        },
      });
  }

  await client.end();

  console.log(
    JSON.stringify(
      {
        teamSlug: result.teamSlug,
        counts: result.counts,
        warnings: embeddingWarning ? [...result.warnings, embeddingWarning] : result.warnings,
        embeddings: { provider: embeddings.name, model: embeddings.model },
        persisted: {
          games: scheduleFixture.games.length,
          sourceDocuments: result.documents.length,
          sourceChunks: chunks.length,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
