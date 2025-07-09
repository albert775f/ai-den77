import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Calendar, Clock, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { InsertUploadSchedule, ProjectWithMembers, DescriptionTemplate, User } from "@shared/schema";

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

type GroupAssignment = {
  groupId: number;
  assignedTo: string;
  earningsPercentage: number;
};

const scheduleFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  projectId: z.number().min(1, "Project is required"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  description: z.string().optional(),
  templateId: z.number().optional(),
  thumbnailUrl: z.string().optional(),
  status: z.enum(["scheduled", "published", "draft"]).default("scheduled"),
  assignedTo: z.string().optional(),
  videoAssignedTo: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface CreateScheduleDialogProps {
  trigger?: React.ReactNode;
}

export default function CreateScheduleDialog({ trigger }: CreateScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery<ProjectWithMembers[]>({
    queryKey: ["/api/projects"],
  });

  const { data: templates } = useQuery<DescriptionTemplate[]>({
    queryKey: ["/api/description-templates"],
    enabled: !!selectedProject,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: todoGroups } = useQuery<TodoTemplateGroup[]>({
    queryKey: [`/api/projects/${selectedProject}/todo-template-groups`],
    enabled: !!selectedProject,
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      projectId: 0,
      scheduledDate: "",
      scheduledTime: "",
      description: "",
      status: "scheduled",
      assignedTo: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      const scheduleData = {
        title: data.title,
        projectId: data.projectId,
        scheduledDate: scheduledDateTime.toISOString(),
        description: data.description,
        status: data.status,
        assignedTo: data.assignedTo === "free" ? null : data.assignedTo || null,

      };
      
      // Create the schedule first
      const response = await apiRequest("POST", "/api/upload-schedule", scheduleData);
      const schedule = await response.json();
      
      // Then create assignments for each group
      for (const assignment of groupAssignments) {
        if (assignment.assignedTo && assignment.assignedTo !== "no-assignment") {
          await apiRequest("POST", `/api/upload-schedule/${schedule.id}/assignments`, {
            groupId: assignment.groupId,
            assignedTo: assignment.assignedTo,
            earningsPercentage: assignment.earningsPercentage,
          });
        }
      }
      
      return schedule;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Upload scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/upload-schedule"] });
      setOpen(false);
      form.reset();
      setGroupAssignments([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule upload",
        variant: "destructive",
      });
    },
  });

  const calculateEarningsPercentage = (assignments: GroupAssignment[]) => {
    const assignedGroups = assignments.filter(a => a.assignedTo && a.assignedTo !== "no-assignment");
    const totalGroups = assignedGroups.length;
    return totalGroups > 0 ? Math.round((100 / totalGroups) * 100) / 100 : 0;
  };

  const updateGroupAssignment = (groupId: number, assignedTo: string) => {
    setGroupAssignments(prev => {
      let updatedAssignments;
      const existing = prev.find(a => a.groupId === groupId);
      
      if (existing) {
        updatedAssignments = prev.map(a => 
          a.groupId === groupId 
            ? { ...a, assignedTo } 
            : a
        );
      } else {
        updatedAssignments = [...prev, { groupId, assignedTo, earningsPercentage: 0 }];
      }
      
      // Recalculate earnings for all assigned groups
      const earningsPercentage = calculateEarningsPercentage(updatedAssignments);
      return updatedAssignments.map(a => ({
        ...a,
        earningsPercentage: a.assignedTo && a.assignedTo !== "no-assignment" ? earningsPercentage : 0
      }));
    });
  };

  const onSubmit = async (data: ScheduleFormData) => {
    mutation.mutate(data);
  };

  const handleProjectChange = (projectId: string) => {
    const id = parseInt(projectId);
    setSelectedProject(id);
    form.setValue("projectId", id);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates?.find(t => t.id === parseInt(templateId));
    if (template) {
      form.setValue("description", template.content);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Schedule New Upload
          </DialogTitle>
          <DialogDescription>
            Create a new scheduled upload for your project. You can assign todo template groups to team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter video title"
              {...form.register("title")}
              className="w-full"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.filter(project => project.id && project.name).map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.projectId && (
              <p className="text-sm text-destructive">{form.formState.errors.projectId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                {...form.register("scheduledDate")}
                className="w-full"
              />
              {form.formState.errors.scheduledDate && (
                <p className="text-sm text-destructive">{form.formState.errors.scheduledDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                {...form.register("scheduledTime")}
                className="w-full"
              />
              {form.formState.errors.scheduledTime && (
                <p className="text-sm text-destructive">{form.formState.errors.scheduledTime.message}</p>
              )}
            </div>
          </div>

          {selectedProject && templates && templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">Description Template</Label>
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(template => template.id && template.name).map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter video description"
              {...form.register("description")}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              placeholder="Enter thumbnail URL (optional)"
              {...form.register("thumbnailUrl")}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select onValueChange={(value) => form.setValue("assignedTo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Leave free for self-assignment" />
                </SelectTrigger>
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
            </div>


          </div>

          {selectedProject && todoGroups && todoGroups.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Todo Group Assignments
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Assign todo template groups to specific team members for this upload.
              </p>
              <div className="space-y-3">
                {todoGroups.map((group) => (
                  <Card key={group.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-gray-600">{group.description}</p>
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
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Earnings: {groupAssignments.find(a => a.groupId === group.id)?.earningsPercentage || 0}%
                          </Badge>
                          <button
                            type="button"
                            onClick={() => {
                              const newPercentage = prompt("Enter earnings percentage (0-100):", 
                                (groupAssignments.find(a => a.groupId === group.id)?.earningsPercentage || 0).toString());
                              if (newPercentage !== null) {
                                const percentage = Math.max(0, Math.min(100, parseInt(newPercentage) || 0));
                                setGroupAssignments(prev => 
                                  prev.map(a => 
                                    a.groupId === group.id 
                                      ? { ...a, earningsPercentage: percentage }
                                      : a
                                  )
                                );
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Select 
                          onValueChange={(value) => updateGroupAssignment(group.id, value)}
                          value={groupAssignments.find(a => a.groupId === group.id)?.assignedTo || "no-assignment"}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-assignment">No assignment</SelectItem>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Scheduling..." : "Schedule Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}