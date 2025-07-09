import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Upload, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SystemSettingsData {
  websiteName: string;
  websiteLogo: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsData>({
    websiteName: "",
    websiteLogo: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: systemSettings } = useQuery({
    queryKey: ["/api/admin/system-settings"],
    onSuccess: (data: any[]) => {
      const settingsObj: SystemSettingsData = {
        websiteName: "",
        websiteLogo: ""
      };
      data.forEach((setting: any) => {
        if (setting.key === "websiteName") settingsObj.websiteName = setting.value || "";
        if (setting.key === "websiteLogo") settingsObj.websiteLogo = setting.value || "";
      });
      setSettings(settingsObj);
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest("POST", "/api/admin/system-settings", { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-settings"] });
      toast({
        title: "Success",
        description: "System settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update system settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    try {
      await updateSettingMutation.mutateAsync({ key: "websiteName", value: settings.websiteName });
      await updateSettingMutation.mutateAsync({ key: "websiteLogo", value: settings.websiteLogo });
    } catch (error) {
      // Error handling done in mutation
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll just use the file name as placeholder
      // In a real implementation, you'd upload the file to a storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings(prev => ({ ...prev, websiteLogo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure website branding and display settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="websiteName" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website Name
          </Label>
          <Input
            id="websiteName"
            value={settings.websiteName}
            onChange={(e) => setSettings(prev => ({ ...prev, websiteName: e.target.value }))}
            placeholder="Enter website name (e.g., Team Hub)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteLogo" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Website Logo
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="websiteLogo"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="flex-1"
            />
            {settings.websiteLogo && (
              <div className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={settings.websiteLogo} 
                  alt="Logo preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Upload a logo image that will be displayed in the navigation and landing page.
          </p>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={updateSettingMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateSettingMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}