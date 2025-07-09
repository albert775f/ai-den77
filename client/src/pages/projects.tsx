import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import ProjectCard from "@/components/projects/project-card";
import CreateProjectDialog from "@/components/projects/create-project-dialog";
import EditProjectDialog from "@/components/projects/edit-project-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectWithMembers } from "@shared/schema";

export default function Projects() {
  const [editingProject, setEditingProject] = useState<ProjectWithMembers | null>(null);
  
  const { data: projects, isLoading } = useQuery<ProjectWithMembers[]>({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Project Hub" description="Manage your YouTube channels and content projects." />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Project Hub" 
        description="Manage your YouTube channels and content projects."
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">All Projects</h3>
          <CreateProjectDialog />
        </div>
        
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onEdit={setEditingProject}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No projects yet</div>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </div>
        )}
      </main>
      
      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}
    </div>
  );
}
