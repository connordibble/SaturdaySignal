import { connection } from "next/server";
import { defaultTeamConfig } from "@/config/team";
import { TeamDashboard } from "@/features/team-dashboard/team-dashboard";

export default async function Home() {
  await connection();

  return <TeamDashboard team={defaultTeamConfig} />;
}
