import { FolderOpen, Upload, Eye, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    activeProjects: number;
    upcomingUploads: number;
    totalViews: number;
    teamMembers: number;
    activeProjectsChange?: string;
    totalViewsChange?: string;
    teamMembersChange?: string;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Active Projects",
      value: stats.activeProjects,
      change: stats.activeProjectsChange || "+2",
      changeText: "from last month",
      icon: FolderOpen,
      iconBg: "bg-primary bg-opacity-10",
      iconColor: "text-primary",
    },
    {
      title: "Upcoming Uploads",
      value: stats.upcomingUploads,
      changeText: "Next 7 days",
      icon: Upload,
      iconBg: "bg-accent bg-opacity-10",
      iconColor: "text-accent",
    },
    {
      title: "Total Views",
      value: `${(stats.totalViews / 1000000).toFixed(1)}M`,
      change: stats.totalViewsChange || "+15%",
      changeText: "from last month",
      icon: Eye,
      iconBg: "bg-secondary bg-opacity-10",
      iconColor: "text-secondary",
    },
    {
      title: "Team Members",
      value: stats.teamMembers,
      change: stats.teamMembersChange,
      changeText: "Active this week",
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {card.change && (
                  <span className="text-sm text-green-600 font-medium">{card.change}</span>
                )}
                <span className={`text-sm text-gray-500 ${card.change ? "ml-2" : ""}`}>
                  {card.changeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
