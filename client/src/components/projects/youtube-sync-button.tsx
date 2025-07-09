import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Youtube } from "lucide-react";
import type { ProjectWithMembers } from "@shared/schema";

interface YouTubeSyncButtonProps {
  project: ProjectWithMembers;
}

export default function YouTubeSyncButton({ project }: YouTubeSyncButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/sync-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync YouTube data");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "YouTube data synced successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Only show sync button if project has YouTube channel ID
  if (!project.youtubeChannelId) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => syncMutation.mutate()}
      disabled={syncMutation.isPending}
      className="flex items-center gap-2"
    >
      {syncMutation.isPending ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Youtube className="w-4 h-4" />
      )}
      {syncMutation.isPending ? "Syncing..." : "Sync YouTube"}
    </Button>
  );
}