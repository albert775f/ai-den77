import { useQuery } from "@tanstack/react-query";
import type { SystemSettings } from "@shared/schema";

export function useSystemSettings() {
  const { data: settings, isLoading } = useQuery<SystemSettings[]>({
    queryKey: ["/api/system-settings"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const getSettingValue = (key: string, defaultValue: string = "") => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  return {
    settings,
    isLoading,
    websiteName: getSettingValue("websiteName", "Team Hub"),
    websiteLogo: getSettingValue("websiteLogo", ""),
  };
}