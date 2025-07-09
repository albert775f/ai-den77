import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Calendar, Activity, FileText, CheckSquare, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useLegacyRoleNames } from "@/hooks/useLegacyRoleNames";
import { useParams } from "wouter";

interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  totalProjects: number;
  totalTodos: number;
  completedTodos: number;
  totalActivities: number;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { getLegacyRoleName } = useLegacyRoleNames();

  const { data: profile, isLoading } = useQuery<PublicUserProfile>({
    queryKey: ["/api/profile/public", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const response = await fetch(`/api/profile/public/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The user profile you're looking for doesn't exist or is not available.
          </p>
        </div>
      </div>
    );
  }

  const completionRate = profile.totalTodos > 0 
    ? Math.round((profile.completedTodos / profile.totalTodos) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Team member profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  {profile.profileImageUrl ? (
                    <img 
                      src={profile.profileImageUrl} 
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Full Name
                </label>
                <p className="text-lg font-semibold">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <p className="text-base">{profile.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Role
                </label>
                <div className="mt-1">
                  <Badge
                    variant={profile.role === "admin" ? "default" : "secondary"}
                    className="flex items-center gap-1 w-fit"
                  >
                    {profile.role === "admin" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {profile.role === "admin" || profile.role === "manager" || profile.role === "employee" 
                      ? getLegacyRoleName(profile.role)
                      : profile.role}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Member Since
                </label>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(profile.createdAt), "MMMM d, yyyy")}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={profile.isActive ? "default" : "secondary"}>
                    {profile.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {profile.totalProjects}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Projects involved in
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckSquare className="h-5 w-5" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {profile.completedTodos}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  of {profile.totalTodos} tasks completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {profile.totalActivities}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total activities recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {completionRate}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Task completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Task Completion</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.completedTodos} / {profile.totalTodos}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {profile.totalProjects}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Active Projects
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {profile.totalActivities}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Activities
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}