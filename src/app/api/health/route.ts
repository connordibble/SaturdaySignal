import { enabledTeamSlugs, getSourceReadiness, teamConfigs } from "@/config/team";
import { describeLlmProvider } from "@/server/llm/registry";
import { hasDatabaseUrl } from "@/server/db/client";

export const runtime = "nodejs";

export async function GET() {
  const sources = Object.fromEntries(
    enabledTeamSlugs.map((slug) => [slug, getSourceReadiness(teamConfigs[slug])]),
  );

  return Response.json({
    ok: true,
    service: "saturday-signal",
    databaseConfigured: hasDatabaseUrl(),
    llm: describeLlmProvider(),
    enabledTeams: enabledTeamSlugs,
    sources,
  });
}
