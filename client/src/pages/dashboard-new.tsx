import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Activity, 
  Calendar, 
  CheckSquare, 
  Clock, 
  FolderKanban, 
  Play, 
  TrendingUp, 
  Users, 
  FileText,
  AlertCircle,
  Target,
  Zap,
  BarChart3,
  User,
  Music,
  Upload,
  Star,
  ArrowRight,
  Plus
} from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { useLegacyRoleNames } from "@/hooks/useLegacyRoleNames";

interface DashboardStats {
  activeProjects: number;
  upcomingUploads: number;
  pendingTodos: number;
  teamMembers: number;
  totalActivities: number;
  completionRate: number;
  weeklyProgress: number;
  monthlyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  project?: string;
}

interface UpcomingUpload {
  id: number;
  title: string;
  projectName: string;
  scheduledDate: string;
  status: string;
  priority: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  profileImageUrl?: string;
  isOnline: boolean;
  completedTasks: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { getLegacyRoleName } = useLegacyRoleNames();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/activities"],
  });

  const { data: upcomingUploads, isLoading: uploadsLoading } = useQuery<UpcomingUpload[]>({
    queryKey: ["/api/dashboard/upcoming-uploads"],
  });

  const { data: teamMembers, isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/dashboard/team"],
  });

  const quickActions: QuickAction[] = [
    {
      id: "new-project",
      title: "Create Project",
      description: "Start a new YouTube channel project",
      href: "/projects",
      icon: FolderKanban,
      color: "bg-blue-500"
    },
    {
      id: "schedule-upload",
      title: "Schedule Upload",
      description: "Plan your next content upload",
      href: "/schedule",
      icon: Calendar,
      color: "bg-green-500"
    },
    {
      id: "add-todo",
      title: "Add Task",
      description: "Create a new task or reminder",
      href: "/todos",
      icon: CheckSquare,
      color: "bg-purple-500"
    },
    {
      id: "mix-audio",
      title: "Mix Audio",
      description: "Process audio files with MixMerge",
      href: "/mixmerge",
      icon: Music,
      color: "bg-orange-500"
    }
  ];

  const getTimeLabel = (date: string) => {
    const uploadDate = parseISO(date);
    if (isToday(uploadDate)) return "Today";
    if (isTomorrow(uploadDate)) return "Tomorrow";
    if (isThisWeek(uploadDate)) return "This Week";
    return format(uploadDate, "MMM d");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project": return FolderKanban;
      case "upload": return Upload;
      case "todo": return CheckSquare;
      case "audio": return Music;
      default: return Activity;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || "User"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your projects today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {user?.role === "admin" || user?.role === "manager" || user?.role === "employee" 
              ? getLegacyRoleName(user.role)
              : user?.role || "User"}
          </Badge>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Uploads</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.upcomingUploads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next upload in 2 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.pendingTodos || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completionRate || 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.teamMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {teamMembers?.filter(m => m.isOnline).length || 0} online now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Get started with common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.id} href={action.href}>
                <div className="group cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Uploads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Uploads
            </CardTitle>
            <CardDescription>
              Scheduled content uploads for the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : upcomingUploads && upcomingUploads.length > 0 ? (
              <div className="space-y-4">
                {upcomingUploads.slice(0, 5).map((upload) => (
                  <div key={upload.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className={`w-1 h-12 rounded-full ${getPriorityColor(upload.priority)}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {upload.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {upload.projectName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {getTimeLabel(upload.scheduledDate)}
                      </Badge>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(parseISO(upload.scheduledDate), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/schedule">
                  <Button variant="outline" className="w-full">
                    View All Uploads
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No upcoming uploads scheduled
                </p>
                <Link href="/schedule">
                  <Button variant="outline" className="mt-4">
                    Schedule Upload
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Activity
            </CardTitle>
            <CardDescription>
              Recent team member activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : teamMembers && teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.slice(0, 5).map((member) => (
                  <Link key={member.id} href={`/profile/${member.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          {member.profileImageUrl ? (
                            <img 
                              src={member.profileImageUrl} 
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                          )}
                        </div>
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.role === "admin" || member.role === "manager" || member.role === "employee" 
                            ? getLegacyRoleName(member.role)
                            : member.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.completedTasks}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          tasks
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No team activity yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest actions and updates across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.slice(0, 8).map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                      <ActivityIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.user} • {activity.project && `${activity.project} • `}
                        {format(parseISO(activity.timestamp), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No recent activity to display
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}