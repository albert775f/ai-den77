import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Gamepad2, Heart } from "lucide-react";
import type { UploadScheduleWithProject } from "@shared/schema";

interface UploadScheduleProps {
  schedule: UploadScheduleWithProject[];
}

export default function UploadSchedule({ schedule }: UploadScheduleProps) {
  const getProjectIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "technology":
        return Play;
      case "gaming":
        return Gamepad2;
      case "lifestyle":
        return Heart;
      default:
        return Play;
    }
  };

  const getProjectColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "technology":
        return "bg-primary bg-opacity-10 text-primary";
      case "gaming":
        return "bg-accent bg-opacity-10 text-accent";
      case "lifestyle":
        return "bg-secondary bg-opacity-10 text-secondary";
      default:
        return "bg-primary bg-opacity-10 text-primary";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Schedule Calendar */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upload Schedule</h3>
          <p className="text-sm text-gray-500">Upcoming content deadlines</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">December 2024</h4>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
            </div>
            
            {/* Mini Calendar */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 font-medium text-gray-500">{day}</div>
              ))}
              
              {/* Calendar days - simplified version */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`p-2 text-sm relative ${
                    day === 12 ? "bg-primary text-white rounded-full" : "text-gray-900"
                  }`}
                >
                  {day}
                  {[3, 5, 10, 15, 17, 20].includes(day) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-gray-500">Tech</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-gray-500">Gaming</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span className="text-gray-500">Lifestyle</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
          <p className="text-sm text-gray-500">Next 7 days</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {schedule.map((item) => {
            const Icon = getProjectIcon(item.project.category);
            return (
              <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getProjectColor(item.project.category)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.project.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatDate(item.scheduledDate)}</p>
                  <p className="text-xs text-gray-500">{formatTime(item.scheduledDate)}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
