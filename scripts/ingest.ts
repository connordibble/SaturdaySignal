import { collectSourceDocuments } from "../src/server/ingest/pipeline";

async function main() {
  const teamSlug = process.argv[2] ?? "texas-football";
  const result = await collectSourceDocuments(teamSlug);

  console.log(
    JSON.stringify(
      {
        teamSlug: result.teamSlug,
        counts: result.counts,
        warnings: result.warnings,
        documentCount: result.documents.length,
        firstDocument: result.documents[0],
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
