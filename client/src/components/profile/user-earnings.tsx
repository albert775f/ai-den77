import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, DollarSign, PlayCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface UserEarningsProps {
  userId: string;
}

interface EarningsData {
  id: number;
  groupId: number;
  assignedTo: string;
  earningsPercentage: number;
  createdAt: string;
  schedule: {
    id: number;
    title: string;
    projectId: number;
    scheduledDate: string;
    description?: string;
    status: string;
  };
  group: {
    id: number;
    name: string;
    description?: string;
    projectId: number;
  };
}

export default function UserEarnings({ userId }: UserEarningsProps) {
  const { data: earnings, isLoading } = useQuery<EarningsData[]>({
    queryKey: [`/api/users/${userId}/earnings`],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!earnings || earnings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No earnings yet</p>
            <p className="text-sm">Complete assigned template groups to start earning from videos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.earningsPercentage, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEarnings.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Share</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings.length > 0 ? (totalEarnings / earnings.length).toFixed(1) : "0"}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {earnings.map((earning) => (
              <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{earning.schedule.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{earning.group.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <CalendarDays className="h-3 w-3 mr-1" />
                      {format(new Date(earning.schedule.scheduledDate), "MMM d, yyyy")}
                    </Badge>
                    <Badge 
                      variant={earning.schedule.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {earning.schedule.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {earning.earningsPercentage}%
                  </div>
                  <p className="text-xs text-gray-500">ownership</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}