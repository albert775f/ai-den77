import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Edit, Users, Save, CalendarDays, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { User } from "@shared/schema";

type TodoTemplateGroup = {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  templates: TodoTemplate[];
};

type TodoTemplate = {
  id: number;
  groupId: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedMinutes: number | null;
};

type ScheduleAssignment = {
  id: number;
  scheduleId: number;
  groupId: number;
  assignedTo: string | null;
  earningsPercentage: number;
  group: TodoTemplateGroup;
};

type GroupAssignmentUpdate = {
  groupId: number;
  assignedTo: string;
  earningsPercentage?: number;
};

interface EditScheduleDialogProps {
  scheduleId: number;
  projectId: number;
  trigger?: React.ReactNode;
}

const editScheduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  assignedTo: z.string().optional(),
});

export default function EditScheduleDialog({ scheduleId, projectId, trigger }: EditScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState<GroupAssignmentUpdate[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: todoGroups } = useQuery<TodoTemplateGroup[]>({
    queryKey: [`/api/projects/${projectId}/todo-template-groups`],
    enabled: !!projectId,
  });

  const { data: currentAssignments } = useQuery<ScheduleAssignment[]>({
    queryKey: [`/api/upload-schedule/${scheduleId}/assignments`],
    enabled: !!scheduleId && open,
  });

  const { data: scheduleData } = useQuery({
    queryKey: [`/api/upload-schedule/${scheduleId}`],
    enabled: !!scheduleId && open,
  });

  const form = useForm<z.infer<typeof editScheduleSchema>>({
    resolver: zodResolver(editScheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduledDate: "",
      status: "scheduled",
      assignedTo: "",
    },
  });

  // Initialize form when schedule data loads
  useEffect(() => {
    if (scheduleData && open) {
      const dateStr = scheduleData.scheduledDate 
        ? new Date(scheduleData.scheduledDate).toISOString().slice(0, 16)
        : "";
      
      form.reset({
        title: scheduleData.title || "",
        description: scheduleData.description || "",
        scheduledDate: dateStr,
        status: scheduleData.status || "scheduled",
        assignedTo: scheduleData.assignedTo || "",
      });
    }
  }, [scheduleData, open, form]);

  // Initialize assignments when data loads
  useEffect(() => {
    if (todoGroups && currentAssignments) {
      const initialAssignments = todoGroups.map(group => {
        const existing = currentAssignments.find(a => a.groupId === group.id);
        return {
          groupId: group.id,
          assignedTo: existing?.assignedTo || "no-assignment",
          earningsPercentage: existing?.earningsPercentage || 0,
        };
      });
      setAssignments(initialAssignments);
    }
  }, [todoGroups, currentAssignments]);

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editScheduleSchema>) => {
      const scheduleData = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        assignedTo: data.assignedTo === "free" ? null : data.assignedTo || null,
      };
      return apiRequest("PUT", `/api/upload-schedule/${scheduleId}`, scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/upload-schedule/${scheduleId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/upload-schedule"] });
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, data }: { assignmentId?: number; data: any }) => {
      if (assignmentId) {
        return apiRequest("PUT", `/api/schedule-assignments/${assignmentId}`, data);
      } else {
        return apiRequest("POST", `/api/upload-schedule/${scheduleId}/assignments`, { ...data, scheduleId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/upload-schedule/${scheduleId}/assignments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/upload-schedule"] });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return apiRequest("DELETE", `/api/schedule-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/upload-schedule/${scheduleId}/assignments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/upload-schedule"] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/upload-schedule/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upload-schedule"] });
      queryClient.invalidateQueries({ queryKey: [`/api/upload-schedule/${scheduleId}`] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

  const handleSaveAssignments = async () => {
    try {
      for (const assignment of assignments) {
        const existing = currentAssignments?.find(a => a.groupId === assignment.groupId);
        
        if (assignment.assignedTo && assignment.assignedTo !== "") {
          // Create or update assignment
          if (existing) {
            if (existing.assignedTo !== assignment.assignedTo || existing.earningsPercentage !== assignment.earningsPercentage) {
              await updateAssignmentMutation.mutateAsync({
                assignmentId: existing.id,
                data: { 
                  assignedTo: assignment.assignedTo,
                  earningsPercentage: assignment.earningsPercentage || 0
                },
              });
            }
          } else {
            await updateAssignmentMutation.mutateAsync({
              data: {
                groupId: assignment.groupId,
                assignedTo: assignment.assignedTo,
                earningsPercentage: assignment.earningsPercentage || 0
              },
            });
          }
        } else if (existing) {
          // Delete assignment if it exists but no one is assigned
          await deleteAssignmentMutation.mutateAsync(existing.id);
        }
      }
      
      toast({
        title: "Success",
        description: "Group assignments updated successfully",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignments",
        variant: "destructive",
      });
    }
  };

  const calculateEarningsPercentage = (assignments: GroupAssignmentUpdate[]) => {
    const assignedGroups = assignments.filter(a => a.assignedTo && a.assignedTo !== "no-assignment");
    const totalGroups = assignedGroups.length;
    return totalGroups > 0 ? Math.round((100 / totalGroups) * 100) / 100 : 0;
  };

  const handleAssignmentChange = (groupId: number, assignedTo: string) => {
    const newAssignments = assignments.map(a => 
      a.groupId === groupId 
        ? { ...a, assignedTo }
        : a
    );
    
    // Calculate earnings percentage
    const earningsPercentage = calculateEarningsPercentage(newAssignments);
    
    // Update earnings percentage for all assigned groups
    const updatedAssignments = newAssignments.map(a => ({
      ...a,
      earningsPercentage: (a.assignedTo && a.assignedTo !== "no-assignment") ? earningsPercentage : 0
    }));
    
    setAssignments(updatedAssignments);
  };

  const handleEarningsChange = (groupId: number, earningsPercentage: number) => {
    setAssignments(prev => 
      prev.map(a => 
        a.groupId === groupId 
          ? { ...a, earningsPercentage }
          : a
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Schedule
          </DialogTitle>
          <DialogDescription>
            Edit the schedule details and modify todo group assignments for this upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Details Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(updateScheduleMutation.mutate)} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Schedule Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter description (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign To</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Leave free for self-assignment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">Free for self-assignment</SelectItem>
                              {users?.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => deleteScheduleMutation.mutate()}
                      disabled={deleteScheduleMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteScheduleMutation.isPending ? "Deleting..." : "Delete Schedule"}
                    </Button>
                    <Button type="submit" disabled={updateScheduleMutation.isPending}>
                      {updateScheduleMutation.isPending ? "Updating..." : "Update Schedule"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>

          {/* Todo Group Assignments */}
          {todoGroups && todoGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Todo Group Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Assign todo template groups to specific team members for this upload schedule.
                  </p>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {todoGroups.map((group) => {
                      const assignment = assignments.find(a => a.groupId === group.id);
                      const currentAssignment = currentAssignments?.find(a => a.groupId === group.id);
                      
                      return (
                        <Card key={group.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{group.name}</h4>
                                {currentAssignment && (
                                  <Badge variant="secondary">Currently Assigned</Badge>
                                )}
                              </div>
                              {group.description && (
                                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{group.templates.length} templates</Badge>
                                {group.templates.slice(0, 3).map((template) => (
                                  <span key={template.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {template.title}
                                  </span>
                                ))}
                                {group.templates.length > 3 && (
                                  <span className="text-xs text-gray-500">+{group.templates.length - 3} more</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-48">
                                <Select
                                  value={assignment?.assignedTo || "no-assignment"}
                                  onValueChange={(value) => handleAssignmentChange(group.id, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="No assignment" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no-assignment">No assignment</SelectItem>
                                    {users?.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        {user.firstName && user.lastName 
                                          ? `${user.firstName} ${user.lastName}` 
                                          : user.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {assignment?.assignedTo && assignment.assignedTo !== "no-assignment" && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={assignment.earningsPercentage || 0}
                                    onChange={(e) => handleEarningsChange(group.id, parseFloat(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                  <span className="text-sm text-gray-600">%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveAssignments}
                      disabled={updateAssignmentMutation.isPending || deleteAssignmentMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateAssignmentMutation.isPending || deleteAssignmentMutation.isPending ? "Saving..." : "Save Assignments"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}