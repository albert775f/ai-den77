import { useQuery } from "@tanstack/react-query";

const LEGACY_ROLES = [
  { key: "admin", name: "Legacy Admin", description: "Full administrative access (legacy role)" },
  { key: "manager", name: "Legacy Manager", description: "Team and project management access (legacy role)" },
  { key: "employee", name: "Legacy Employee", description: "Basic team member access (legacy role)" }
];

export function useLegacyRoleNames() {
  const { data: systemSettings = [] } = useQuery<any[]>({
    queryKey: ["/api/system-settings"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getLegacyRoleName = (roleKey: string) => {
    const setting = systemSettings.find(s => s.key === `legacy_role_${roleKey}_name`);
    return setting?.value || LEGACY_ROLES.find(r => r.key === roleKey)?.name || `Legacy ${roleKey}`;
  };

  return { getLegacyRoleName };
}