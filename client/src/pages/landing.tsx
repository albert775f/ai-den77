import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Users, Calendar, BarChart3 } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export default function Landing() {
  const { websiteName, websiteLogo } = useSystemSettings();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            {websiteLogo && (
              <img 
                src={websiteLogo} 
                alt="Logo" 
                className="h-16 w-16 mr-4 rounded-lg object-cover"
              />
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              {websiteName}
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A comprehensive platform for managing YouTube channels, content scheduling, and team collaboration.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <PlayCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Project Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage multiple YouTube channels with comprehensive project tracking and analytics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work together with role-based permissions and real-time activity tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Upload Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Plan and schedule content uploads with intuitive calendar views and reminders.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track performance metrics, subscriber growth, and engagement across all projects.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to streamline your content workflow?
          </h2>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.location.href = "/api/login"}
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 text-lg"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}