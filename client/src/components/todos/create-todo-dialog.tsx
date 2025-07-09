import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Eye, EyeOff, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { insertTodoSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { z } from "zod";
import type { ProjectWithMembers, User } from "@shared/schema";
import TodoAttachment from "@/components/todos/todo-attachment";

type TodoFormData = z.infer<typeof insertTodoSchema>;

interface CreateTodoDialogProps {
  trigger?: React.ReactNode;
  projectId?: number;
}

export default function CreateTodoDialog({ trigger, projectId }: CreateTodoDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery<ProjectWithMembers[]>({
    queryKey: ["/api/projects"],
  });

  const { data: teamMembers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<TodoFormData>({
    resolver: zodResolver(insertTodoSchema.omit({ assignedBy: true })),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      projectId: projectId || null,
      assignedTo: user?.id || "",
      dueDate: null,
      isPrivate: false,
      visibleTo: [],
      totalTicks: 1,
      currentTicks: 0,
    },
  });

  const createTodoMutation = useMutation({
    mutationFn: async (todo: TodoFormData) => {
      // The server will automatically set assignedBy to the current user
      const todoData = { 
        ...todo,
        // Convert date string to ISO string if date exists
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null
      };
      delete (todoData as any).assignedBy;
      console.log("Creating todo with data:", todoData);
      return apiRequest("POST", "/api/todos", todoData);
    },
    onSuccess: () => {
      console.log("Todo created successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Todo created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating todo:", error);
      toast({
        title: "Error",
        description: `Failed to create todo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TodoFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    createTodoMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Todo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Todo</DialogTitle>
          <DialogDescription>
            Create a new task with details, assignment, and completion requirements.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter todo title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter todo description (optional)" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalTicks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      Completion Ticks
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="100"
                        placeholder="1"
                        {...field}
                        value={field.value || 1}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-500">
                      Number of ticks required to complete this task (e.g., "Find 20 names" = 20 ticks)
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="text-foreground">
                          {member.firstName && member.lastName ? 
                            `${member.firstName} ${member.lastName}` : 
                            member.email
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))} 
                    value={field.value?.toString() || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">General Task</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Privacy Options */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground">Privacy Settings</h4>
              
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Make this todo private
                      </FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Only you and the assigned person can see this todo
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('isPrivate') && (
                <FormField
                  control={form.control}
                  name="visibleTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional People Who Can See This Todo</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const currentValues = field.value || [];
                          if (!currentValues.includes(value)) {
                            field.onChange([...currentValues, value]);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Add people to share with" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamMembers?.filter(member => 
                            !(field.value || []).includes(member.id) && 
                            member.id !== form.watch('assignedTo')
                          ).map((member) => (
                            <SelectItem key={member.id} value={member.id} className="text-foreground">
                              {member.firstName && member.lastName ? 
                                `${member.firstName} ${member.lastName}` : 
                                member.email
                              }
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((userId) => {
                            const member = teamMembers?.find(m => m.id === userId);
                            return (
                              <div key={userId} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm">
                                <span>{member?.firstName && member?.lastName ? 
                                  `${member.firstName} ${member.lastName}` : 
                                  member?.email
                                }</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(field.value.filter(id => id !== userId));
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTodoMutation.isPending}
                onClick={async (e) => {
                  console.log("Submit button clicked");
                  console.log("Form valid:", form.formState.isValid);
                  console.log("Form values:", form.getValues());
                  console.log("Form errors:", form.formState.errors);
                  
                  // Trigger validation
                  const isValid = await form.trigger();
                  console.log("After trigger - Form valid:", isValid);
                  console.log("After trigger - Form errors:", form.formState.errors);
                  
                  if (isValid) {
                    onSubmit(form.getValues());
                  }
                  e.preventDefault();
                }}
              >
                {createTodoMutation.isPending ? "Creating..." : "Create Todo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}