import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import ProjectHub from "@/components/dashboard/project-hub";
import UploadSchedule from "@/components/dashboard/upload-schedule";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectWithMembers, UploadScheduleWithProject, ActivityWithDetails } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    activeProjects: number;
    upcomingUploads: number;
    totalViews: number;
    teamMembers: number;
    activeProjectsChange?: string;
    totalViewsChange?: string;
    teamMembersChange?: string;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<ProjectWithMembers[]>({
    queryKey: ["/api/projects"],
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery<UploadScheduleWithProject[]>({
    queryKey: ["/api/upload-schedule"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityWithDetails[]>({
    queryKey: ["/api/activities"],
  });

  if (statsLoading || projectsLoading || scheduleLoading || activitiesLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard" description="Welcome back! Here's what's happening with your projects." />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Dashboard" 
        description="Welcome back! Here's what's happening with your projects."
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <StatsCards stats={stats || {
          activeProjects: 0,
          upcomingUploads: 0,
          totalViews: 0,
          teamMembers: 0
        }} />
        <ProjectHub projects={projects || []} />
        <UploadSchedule schedule={schedule || []} />
        <RecentActivity activities={activities || []} />
      </main>
    </div>
  );
}
