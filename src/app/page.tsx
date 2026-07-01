import { defaultTeamConfig } from "@/config/team";
import { TeamDashboard } from "@/features/team-dashboard/team-dashboard";

export default function Home() {
  return <TeamDashboard team={defaultTeamConfig} />;
}
