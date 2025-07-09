import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard-new";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Schedule from "@/pages/schedule";
import Todos from "@/pages/todos";
import Pinboard from "@/pages/pinboard";
import MixMerge from "@/pages/mixmerge";
import AuthPage from "@/pages/auth-page";
import AdminPanel from "@/pages/admin-panel";
import Profile from "@/pages/profile";
import PublicProfile from "@/pages/public-profile";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/projects/:id" component={ProjectDetail} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/todos" component={Todos} />

          <Route path="/mixmerge" component={MixMerge} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/:userId" component={PublicProfile} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
