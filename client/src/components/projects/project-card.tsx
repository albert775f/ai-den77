import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import YouTubeSyncButton from "./youtube-sync-button";
import type { ProjectWithMembers } from "@shared/schema";

interface ProjectCardProps {
  project: ProjectWithMembers;
  onEdit?: (project: ProjectWithMembers) => void;
}

export default function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const deleteMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(project.id);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "in review":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/projects/${project.id}`)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={project.thumbnailUrl || "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
              alt={`${project.name} thumbnail`}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h4 className="font-semibold text-gray-900">{project.name}</h4>
              <p className="text-sm text-gray-500">{project.category}</p>
            </div>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subscribers</span>
            <span className="font-medium">{formatNumber(project.subscribers || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Videos</span>
            <span className="font-medium">{project.videoCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Monthly Views</span>
            <span className="font-medium">{formatNumber(project.monthlyViews || 0)}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {project.members.slice(0, 3).map((member) => (
                <img
                  key={member.id}
                  src={member.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
                  alt={member.name}
                  className="w-6 h-6 rounded-full border-2 border-white"
                />
              ))}
              {project.members.length > 3 && (
                <div className="w-6 h-6 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-500">+{project.members.length - 3}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <YouTubeSyncButton project={project} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(project)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
