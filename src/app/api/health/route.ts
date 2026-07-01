import { enabledTeamSlugs } from "@/config/team";
import { hasDatabaseUrl } from "@/server/db/client";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "saturday-signal",
    databaseConfigured: hasDatabaseUrl(),
    enabledTeams: enabledTeamSlugs,
  });
}
