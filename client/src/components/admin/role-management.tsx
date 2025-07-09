import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLegacyRoleNames } from "@/hooks/useLegacyRoleNames";
import { Shield, Users, Edit, Trash2, Plus, UserCheck, UserX } from "lucide-react";
import type { Role, User } from "@shared/schema";

const AVAILABLE_PERMISSIONS = [
  "projects.create",
  "projects.edit",
  "projects.delete",
  "projects.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "roles.view",
  "todos.create",
  "todos.edit",
  "todos.delete",
  "todos.view",
  "admin.system_settings",
  "admin.full_access"
];

const LEGACY_ROLES = [
  { key: "admin", name: "Legacy Admin", description: "Full administrative access (legacy role)" },
  { key: "manager", name: "Legacy Manager", description: "Team and project management access (legacy role)" },
  { key: "employee", name: "Legacy Employee", description: "Basic team member access (legacy role)" }
];

function LegacyRoleCard({ 
  roleKey, 
  name, 
  description, 
  users 
}: { 
  roleKey: string; 
  name: string; 
  description: string; 
  users: User[]; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getLegacyRoleName } = useLegacyRoleNames();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRoleValue, setNewRoleValue] = useState("");
  const [editingRoleName, setEditingRoleName] = useState(false);
  const [newRoleName, setNewRoleName] = useState(name);

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}`, { role: newRole });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      setNewRoleValue("");
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const updateRoleNameMutation = useMutation({
    mutationFn: async ({ roleKey, newName }: { roleKey: string; newName: string }) => {
      const response = await apiRequest("PUT", `/api/admin/legacy-roles/${roleKey}`, { name: newName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-settings"] });
      setEditingRoleName(false);
      toast({
        title: "Success",
        description: "Role name updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role name",
        variant: "destructive",
      });
      setNewRoleName(name); // Reset to original name on error
    },
  });

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        {editingRoleName ? (
          <div className="flex items-center gap-2">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-48"
              placeholder="Role name"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newRoleName.trim()) {
                  updateRoleNameMutation.mutate({ roleKey, newName: newRoleName.trim() });
                }
              }}
              disabled={!newRoleName.trim() || updateRoleNameMutation.isPending}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingRoleName(false);
                setNewRoleName(name);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{name}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingRoleName(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        )}
        <Badge variant="outline">Legacy</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Users ({users.length})</span>
        </div>
        
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users with this role</p>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 border rounded bg-muted/50">
                <div>
                  <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {editingUser?.id === user.id ? (
                    <div className="flex items-center gap-2">
                      <Select value={newRoleValue} onValueChange={setNewRoleValue}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{getLegacyRoleName("admin")}</SelectItem>
                          <SelectItem value="manager">{getLegacyRoleName("manager")}</SelectItem>
                          <SelectItem value="employee">{getLegacyRoleName("employee")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newRoleValue) {
                            updateUserRoleMutation.mutate({ userId: user.id, newRole: newRoleValue });
                          }
                        }}
                        disabled={!newRoleValue || updateUserRoleMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUser(null);
                          setNewRoleValue("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingUser(user);
                        setNewRoleValue(user.role || "");
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

function RoleForm({ 
  role, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  role?: Role; 
  onSubmit: (data: RoleFormData) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: role?.name || "",
    description: role?.description || "",
    permissions: role?.permissions || [],
    isSystem: role?.isSystem || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Role Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter role name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter role description"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
          {AVAILABLE_PERMISSIONS.map(permission => (
            <div key={permission} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={permission}
                checked={formData.permissions.includes(permission)}
                onChange={() => togglePermission(permission)}
                className="rounded"
              />
              <Label htmlFor={permission} className="text-sm font-mono">
                {permission}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : role ? "Update Role" : "Create Role"}
        </Button>
      </div>
    </form>
  );
}

function UserRoleAssignment({ userId, userName }: { userId: string; userName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles"],
  });

  const { data: userRoles = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", userId, "roles"],
    enabled: !!userId,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return apiRequest("POST", `/api/admin/users/${userId}/roles`, { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "roles"] });
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "roles"] });
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    },
  });

  const availableRoles = roles.filter(role => 
    !userRoles.some(ur => ur.roleId === role.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Roles for {userName}</h3>
      </div>

      <div className="space-y-2">
        <Label>Current Roles</Label>
        {userRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No roles assigned</p>
        ) : (
          <div className="space-y-2">
            {userRoles.map(userRole => (
              <div key={userRole.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <Badge variant="secondary">{userRole.role.name}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">{userRole.role.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRoleMutation.mutate(userRole.roleId)}
                  disabled={removeRoleMutation.isPending}
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {availableRoles.length > 0 && (
        <div className="space-y-2">
          <Label>Assign New Role</Label>
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => assignRoleMutation.mutate(parseInt(value))}
              disabled={assignRoleMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role to assign" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: systemSettings = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/system-settings"],
  });

  // Get custom legacy role names from system settings
  const getLegacyRoleName = (roleKey: string) => {
    const setting = systemSettings.find(s => s.key === `legacy_role_${roleKey}_name`);
    return setting?.value || LEGACY_ROLES.find(r => r.key === roleKey)?.name || `Legacy ${roleKey}`;
  };

  // Create dynamic legacy roles with custom names
  const dynamicLegacyRoles = LEGACY_ROLES.map(role => ({
    ...role,
    name: getLegacyRoleName(role.key)
  }));

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: RoleFormData) => {
      return apiRequest("POST", "/api/admin/roles", roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RoleFormData> }) => {
      return apiRequest("PUT", `/api/admin/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      setEditingRole(null);
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <RoleForm
              onSubmit={createRoleMutation.mutate}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createRoleMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="text-center py-4">Loading roles...</div>
            ) : (
              <div className="space-y-4">
                {roles.map(role => (
                  <div key={role.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{role.name}</h3>
                        {role.isSystem && (
                          <Badge variant="outline">System</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Role</DialogTitle>
                            </DialogHeader>
                            <RoleForm
                              role={role}
                              onSubmit={(data) => updateRoleMutation.mutate({ id: role.id, data })}
                              onCancel={() => setEditingRole(null)}
                              isLoading={updateRoleMutation.isPending}
                            />
                          </DialogContent>
                        </Dialog>
                        {!role.isSystem && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the role "{role.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteRoleMutation.mutate(role.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Legacy Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dynamicLegacyRoles.map(legacyRole => (
                <LegacyRoleCard
                  key={legacyRole.key}
                  roleKey={legacyRole.key}
                  name={legacyRole.name}
                  description={legacyRole.description}
                  users={users.filter(user => user.role === legacyRole.key)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              User Role Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select onValueChange={(value) => {
                  const user = users.find(u => u.id === value);
                  setSelectedUser(user || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="border rounded-lg p-4">
                  <UserRoleAssignment
                    userId={selectedUser.id}
                    userName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Role Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select onValueChange={(value) => {
                  const user = users.find(u => u.id === value);
                  setSelectedUser(user || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="border rounded-lg p-4">
                  <UserRoleAssignment
                    userId={selectedUser.id}
                    userName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}