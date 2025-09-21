import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import UserDashboard from "@/pages/user-dashboard";
import QuizInterface from "@/pages/quiz-interface";
import AdminDashboard from "@/pages/admin-dashboard";
import SuperAdminDashboard from "@/pages/superadmin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={UserDashboard} roles={["user"]} />
      <ProtectedRoute path="/quiz/:id?" component={QuizInterface} roles={["user"]} />
      <ProtectedRoute 
        path="/admin" 
        component={AdminDashboard} 
        roles={["content_creator", "state_admin", "country_admin"]} 
      />
      <ProtectedRoute 
        path="/superadmin" 
        component={SuperAdminDashboard} 
        roles={["superadmin"]} 
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
