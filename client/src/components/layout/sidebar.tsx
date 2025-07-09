import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Calendar,
  CheckSquare,
  LogOut,
  User,
  Play,
  Layers,
  Music,
  Shield,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useLegacyRoleNames } from "@/hooks/useLegacyRoleNames";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "To-Dos", href: "/todos", icon: CheckSquare },
  { name: "MixMerge", href: "/mixmerge", icon: Music },
];

const adminNavigation = [
  { name: "Admin Panel", href: "/admin", icon: Shield },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { websiteName, websiteLogo } = useSystemSettings();
  const { getLegacyRoleName } = useLegacyRoleNames();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {websiteLogo ? (
            <img 
              src={websiteLogo} 
              alt="Logo" 
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-lg">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{websiteName}</h1>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
        
        {/* Admin Navigation */}
        {user?.role === "admin" && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Admin
            </h3>
            {adminNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        {user && (
          <Link
            href="/profile"
            className={cn(
              "flex items-center mb-4 px-3 py-2 rounded-lg transition-colors",
              location === "/profile"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : user.firstName || user.lastName || user.email || "User"}
              </p>
              {user.role && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role === "admin" || user.role === "manager" || user.role === "employee" 
                    ? getLegacyRoleName(user.role)
                    : user.role}
                </p>
              )}
            </div>
          </Link>
        )}
        
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-5 h-5 mr-3" />
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}