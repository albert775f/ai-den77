import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTodoTemplateGroupSchema, insertTodoTemplateSchema } from "@shared/schema";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { z } from "zod";

type TodoTemplateGroup = {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  createdAt: string;
  templates: TodoTemplate[];
};

type TodoTemplate = {
  id: number;
  groupId: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: number | null;
  order: number;
  createdAt: string;
};

const groupSchema = insertTodoTemplateGroupSchema.omit({ projectId: true }).extend({
  name: z.string().min(1, "Group name is required"),
});

const templateSchema = insertTodoTemplateSchema.omit({ groupId: true }).extend({
  title: z.string().min(1, "Template title is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

interface TodoTemplateGroupsProps {
  projectId: number;
}

export default function TodoTemplateGroups({ projectId }: TodoTemplateGroupsProps) {
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TodoTemplateGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/todo-template-groups`],
  });

  const groupForm = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onSubmit",
  });

  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      estimatedDuration: "",
      order: 0,
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof groupSchema>) => {
      console.log("Making API request with data:", data);
      const result = await apiRequest("POST", `/api/projects/${projectId}/todo-template-groups`, data);
      console.log("API response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/todo-template-groups`] });
      setIsGroupDialogOpen(false);
      groupForm.reset();
      toast({ title: "Success", description: "Template group created successfully" });
    },
    onError: (error) => {
      console.error("Group creation error:", error);
      toast({ title: "Error", description: `Failed to create template group: ${error.message}`, variant: "destructive" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      console.log("Making template API request with data:", data);
      const result = await apiRequest("POST", `/api/todo-template-groups/${selectedGroup!.id}/templates`, data);
      console.log("Template API response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/todo-template-groups`] });
      setIsTemplateDialogOpen(false);
      templateForm.reset();
      toast({ title: "Success", description: "Template created successfully" });
    },
    onError: (error) => {
      console.error("Template creation error:", error);
      toast({ title: "Error", description: `Failed to create template: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/todo-template-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/todo-template-groups`] });
      toast({ title: "Success", description: "Template group deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete template group", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/todo-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/todo-template-groups`] });
      toast({ title: "Success", description: "Template deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    },
  });

  const toggleGroupExpansion = (groupId: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 hover:bg-red-600";
      case "high": return "bg-orange-500 hover:bg-orange-600";
      case "medium": return "bg-yellow-500 hover:bg-yellow-600";
      case "low": return "bg-green-500 hover:bg-green-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading template groups...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Todo Template Groups</h2>
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template Group</DialogTitle>
              <DialogDescription>
                Create a new group to organize related todo templates that can be assigned together.
              </DialogDescription>
            </DialogHeader>
            <Form {...groupForm}>
              <form onSubmit={groupForm.handleSubmit((data) => {
                console.log("Submitting group data:", data);
                createGroupMutation.mutate(data);
              }, (errors) => {
                console.log("Form validation errors:", errors);
              })} className="space-y-4">
                <FormField
                  control={groupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pre-Production Tasks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={groupForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of this group's purpose" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createGroupMutation.isPending}
                    onClick={(e) => {
                      console.log("Create Group button clicked");
                      console.log("Form state:", groupForm.formState);
                      console.log("Form values:", groupForm.getValues());
                    }}
                  >
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {groups?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No template groups found. Create your first group to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {groups?.map((group: TodoTemplateGroup) => (
            <Card key={group.id} className="border-l-4 border-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroupExpansion(group.id)}
                      >
                        {expandedGroups.has(group.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="outline">{group.templates.length} templates</Badge>
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-600 mt-1 ml-10">{group.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsTemplateDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteGroupMutation.mutate(group.id)}
                      disabled={deleteGroupMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedGroups.has(group.id) && (
                <CardContent>
                  {group.templates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No templates in this group yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.templates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{template.title}</h4>
                              <Badge className={`text-white ${getPriorityColor(template.priority)}`}>
                                {template.priority}
                              </Badge>
                              {template.estimatedDuration && (
                                <Badge variant="outline">{template.estimatedDuration}min</Badge>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Template to {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Create a new todo template within this group that can be assigned to team members.
            </DialogDescription>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit((data) => {
              console.log("Submitting template data:", data);
              const templateData = {
                ...data,
                groupId: selectedGroup!.id,
                estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration as string) : null
              };
              console.log("Template data with groupId:", templateData);
              createTemplateMutation.mutate(templateData);
            }, (errors) => {
              console.log("Template form validation errors:", errors);
            })} className="space-y-4">
              <FormField
                control={templateForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Review video content" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description of the task" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full p-2 border rounded">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Minutes</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="30" 
                        {...field} 
                        value={field.value || ""} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createTemplateMutation.isPending}>
                  {createTemplateMutation.isPending ? "Creating..." : "Add Template"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}