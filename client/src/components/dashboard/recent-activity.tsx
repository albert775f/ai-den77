import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ActivityWithDetails } from "@shared/schema";

interface RecentActivityProps {
  activities: ActivityWithDetails[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} days ago`;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-500">Latest team updates and actions</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <div key={activity.id} className="p-6 flex items-start space-x-4">
              <div className="flex-shrink-0">
                <img 
                  src={activity.user.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"}
                  alt={activity.user.name}
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user.name}</span>
                  <span> {activity.action} </span>
                  <span className="font-medium text-primary">{activity.project.name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{getTimeAgo(activity.createdAt!)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
