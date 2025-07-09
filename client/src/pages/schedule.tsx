import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CalendarIcon, Clock, List, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CreateScheduleDialog from "@/components/schedule/create-schedule-dialog";
import EditScheduleDialog from "@/components/schedule/edit-schedule-dialog";
import CalendarView from "@/components/schedule/calendar";
import type { UploadScheduleWithProject } from "@shared/schema";

export default function Schedule() {
  const [activeTab, setActiveTab] = useState("calendar");
  
  const { data: schedule, isLoading } = useQuery<UploadScheduleWithProject[]>({
    queryKey: ["/api/upload-schedule"],
  });

  // Convert schedule data to calendar events format
  const calendarEvents = schedule?.map(item => ({
    date: new Date(item.scheduledDate),
    title: item.title,
    project: item.project.name,
    id: item.id,
    status: item.status,
    description: item.description
  })) || [];

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Upload Schedule" description="Manage your content publishing timeline." />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Upload Schedule" 
        description="Manage your content publishing timeline."
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Uploads</h3>
          <CreateScheduleDialog />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-6">
            <CalendarView events={calendarEvents} />
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            {schedule && schedule.length > 0 ? (
              <div className="space-y-4">
                {schedule.map((item) => (
                  <Card key={item.id} className="shadow-sm group hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={item.project.thumbnailUrl || "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                            alt={item.project.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.project.name} • {item.project.category}</p>
                            {item.assignedToUser && (
                              <p className="text-sm text-blue-600 mt-1">
                                Assigned to: {item.assignedToUser.firstName && item.assignedToUser.lastName 
                                  ? `${item.assignedToUser.firstName} ${item.assignedToUser.lastName}`
                                  : item.assignedToUser.email}
                              </p>
                            )}
                            {!item.assignedToUser && (
                              <p className="text-sm text-green-600 mt-1">Free for self-assignment</p>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(item.scheduledDate)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(item.scheduledDate)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <EditScheduleDialog 
                              scheduleId={item.id}
                              projectId={item.projectId}
                              trigger={
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-gray-500 mb-4">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No uploads scheduled</p>
                    <p>Create your first scheduled upload to get started.</p>
                  </div>
                  <CreateScheduleDialog />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}