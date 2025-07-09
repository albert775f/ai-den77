import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckSquare, Clock, AlertCircle, User, Calendar, List, Grid, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CreateTodoDialog from "@/components/todos/create-todo-dialog";
import EditTodoDialog from "@/components/todos/edit-todo-dialog";
import TodoCard from "@/components/todos/todo-card";
import UploadFileDialog from "@/components/todos/upload-file-dialog";
import { apiRequest } from "@/lib/queryClient";
import type { TodoWithDetails, ProjectWithMembers } from "@shared/schema";

export default function Todos() {
  const [activeTab, setActiveTab] = useState("assigned");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTodoForUpload, setSelectedTodoForUpload] = useState<TodoWithDetails | null>(null);
  
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery<TodoWithDetails[]>({
    queryKey: ["/api/todos", { filter: activeTab }],
    queryFn: async () => {
      const res = await fetch(`/api/todos?filter=${activeTab}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
  });

  const { data: projects } = useQuery<ProjectWithMembers[]>({
    queryKey: ["/api/projects"],
  });

  const completeTodoMutation = useMutation({
    mutationFn: async (todoId: number) => {
      return apiRequest("PUT", `/api/todos/${todoId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (todoId: number) => {
      return apiRequest("DELETE", `/api/todos/${todoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const addTickMutation = useMutation({
    mutationFn: async (todoId: number) => {
      return apiRequest("PUT", `/api/todos/${todoId}/tick`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const completeAllTicksMutation = useMutation({
    mutationFn: async (todoId: number) => {
      return apiRequest("PUT", `/api/todos/${todoId}/complete-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const handleCompleteTodo = (todoId: number) => {
    completeTodoMutation.mutate(todoId);
  };

  const handleDeleteTodo = (todoId: number) => {
    deleteTodoMutation.mutate(todoId);
  };

  const handleAddTick = (todoId: number) => {
    addTickMutation.mutate(todoId);
  };

  const handleCompleteAllTicks = (todoId: number) => {
    completeAllTicksMutation.mutate(todoId);
  };

  const handleUpload = (todoId: number) => {
    const todo = todos?.find(t => t.id === todoId);
    if (todo) {
      setSelectedTodoForUpload(todo);
      setUploadDialogOpen(true);
    }
  };

  // Filter todos based on current filters
  const filteredTodos = todos?.filter(todo => {
    if (filterStatus !== "all" && todo.status !== filterStatus) return false;
    if (filterPriority !== "all" && todo.priority !== filterPriority) return false;
    if (filterProject !== "all") {
      if (filterProject === "general" && todo.projectId !== null) return false;
      if (filterProject !== "general" && todo.projectId?.toString() !== filterProject) return false;
    }
    return true;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="To-Do Management" description="Manage tasks and assignments across projects." />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="To-Do Management" 
        description="Manage tasks and assignments across projects."
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Tasks & Assignments</h3>
          <CreateTodoDialog />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="general">General Tasks</SelectItem>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Assigned to Me
            </TabsTrigger>
            <TabsTrigger value="created" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Created by Me
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="mt-6">
            {filteredTodos.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
                {filteredTodos.map((todo) => (
                  <div key={todo.id} className="relative group">
                    <TodoCard 
                      todo={todo} 
                      viewMode={viewMode}
                      onComplete={handleCompleteTodo}
                      onDelete={handleDeleteTodo}
                      onTick={handleAddTick}
                      onCompleteAll={handleCompleteAllTicks}
                      showAssignedBy={true}
                      onUpload={handleUpload}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditTodoDialog 
                        todo={todo}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-gray-500 mb-4">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No tasks assigned</p>
                    <p>Tasks assigned to you will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="created" className="mt-6">
            {filteredTodos.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
                {filteredTodos.map((todo) => (
                  <div key={todo.id} className="relative group">
                    <TodoCard 
                      todo={todo} 
                      viewMode={viewMode}
                      onComplete={handleCompleteTodo}
                      onDelete={handleDeleteTodo}
                      onTick={handleAddTick}
                      onCompleteAll={handleCompleteAllTicks}
                      showAssignedBy={false}
                      onUpload={handleUpload}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditTodoDialog 
                        todo={todo}
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-gray-500 mb-4">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No tasks created</p>
                    <p>Create your first task to get started.</p>
                  </div>
                  <CreateTodoDialog />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {selectedTodoForUpload && (
        <UploadFileDialog
          todo={selectedTodoForUpload}
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      )}
    </div>
  );
}