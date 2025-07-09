import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Shield, User, Calendar, Activity, FileText, CheckSquare, DollarSign, Camera, Lock, Edit } from "lucide-react";
import { format } from "date-fns";
import UserEarnings from "@/components/profile/user-earnings";
import { useLegacyRoleNames } from "@/hooks/useLegacyRoleNames";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface UserStats {
  totalProjects: number;
  totalTodos: number;
  completedTodos: number;
  totalUploads: number;
  totalActivities: number;
  joinedDate: string;
}

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

export default function Profile() {
  const { user } = useAuth();
  const { getLegacyRoleName } = useLegacyRoleNames();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/profile/stats"],
    enabled: !!user,
  });

  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const profileForm = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordChangeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordChangeSchema>) => {
      const response = await apiRequest("PUT", "/api/profile/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      setShowPasswordDialog(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating password",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileUpdateSchema>) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setShowProfileEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const profilePictureUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      
      const response = await fetch("/api/profile/picture", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload profile picture");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error uploading picture",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      profilePictureUploadMutation.mutate(file);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Your account information and activity statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    {imagePreview || user.profileImageUrl ? (
                      <img 
                        src={imagePreview || user.profileImageUrl} 
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {profilePictureUploadMutation.isPending && (
                  <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Full Name
                </label>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProfileEditDialog(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <p className="text-base">{user.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Role
                </label>
                <div className="mt-1">
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="flex items-center gap-1 w-fit"
                  >
                    {user.role === "admin" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {user.role === "admin" || user.role === "manager" || user.role === "employee" 
                      ? getLegacyRoleName(user.role)
                      : user.role}
                  </Badge>
                </div>
              </div>

              {stats && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Member Since
                  </label>
                  <p className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(stats.joinedDate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}

              {/* Change Password Button */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {isLoading ? "..." : stats?.totalProjects || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total projects worked on
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
                  {isLoading ? "..." : stats?.completedTodos || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Completed out of {stats?.totalTodos || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {isLoading ? "..." : stats?.totalUploads || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Scheduled uploads
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
                  {isLoading ? "..." : stats?.totalActivities || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total activities recorded
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>
            Your account activity and contributions to the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Task Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Completion Rate</span>
                  <span className="text-sm font-medium">
                    {stats?.totalTodos && stats?.completedTodos 
                      ? Math.round((stats.completedTodos / stats.totalTodos) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${stats?.totalTodos && stats?.completedTodos 
                        ? (stats.completedTodos / stats.totalTodos) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Team Contribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Projects involved</span>
                  <span className="text-sm font-medium">{stats?.totalProjects || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Content scheduled</span>
                  <span className="text-sm font-medium">{stats?.totalUploads || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Video Earnings
          </CardTitle>
          <CardDescription>
            Your ownership percentages from completed template group assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserEarnings userId={user.id} />
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit((data) => passwordChangeMutation.mutate(data))} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={passwordChangeMutation.isPending}>
                  {passwordChangeMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showProfileEditDialog} onOpenChange={setShowProfileEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit((data) => profileUpdateMutation.mutate(data))} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowProfileEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={profileUpdateMutation.isPending}>
                  {profileUpdateMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}