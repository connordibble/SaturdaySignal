import { notFound } from "next/navigation";
import { enabledTeamSlugs, getTeamConfig } from "@/config/team";
import { TeamDashboard } from "@/features/team-dashboard/team-dashboard";

type TeamPageProps = {
  params: Promise<{ teamSlug: string }>;
};

export function generateStaticParams() {
  return enabledTeamSlugs.map((teamSlug) => ({ teamSlug }));
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamSlug } = await params;
  const team = getTeamConfig(teamSlug);

  if (!team) {
    notFound();
  }

  return <TeamDashboard team={team} />;
}
