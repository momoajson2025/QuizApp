import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Crown, 
  TrendingUp, 
  PieChart, 
  Users, 
  Globe, 
  DollarSign, 
  Shield, 
  MonitorSpeaker, 
  Settings,
  Brain,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

export default function SuperAdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is superadmin
  if (!user || user.role !== 'superadmin') {
    setLocation('/dashboard');
    return null;
  }

  // Fetch superadmin data
  const { data: analytics } = useQuery({
    queryKey: ["/api/superadmin/analytics"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: revenue } = useQuery({
    queryKey: ["/api/superadmin/revenue"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: fraudLogs } = useQuery({
    queryKey: ["/api/superadmin/fraud-logs"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: auditLogs } = useQuery({
    queryKey: ["/api/superadmin/audit-logs"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const sidebarItems = [
    { id: "overview", label: "Executive Dashboard", icon: TrendingUp },
    { id: "analytics", label: "Advanced Analytics", icon: PieChart },
    { id: "roles", label: "Role Management", icon: Users },
    { id: "regions", label: "Global Regions", icon: Globe },
    { id: "revenue", label: "Revenue Engine", icon: DollarSign },
    { id: "fraud", label: "Fraud Detection", icon: Shield },
    { id: "ads", label: "Ad Management", icon: MonitorSpeaker },
    { id: "system", label: "System Settings", icon: Settings },
  ];

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-border flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center flex-shrink-0 px-4 py-6 border-b border-border">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold gradient-text">SuperAdmin</span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`superadmin-sidebar-${item.id}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex items-center space-x-3 w-full">
          <img 
            src={`https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`}
            alt="SuperAdmin avatar" 
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">SuperAdmin</p>
            <p className="text-xs text-muted-foreground truncate">System Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            className="flex-shrink-0"
            data-testid="superadmin-logout-button"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderExecutiveDashboard = () => (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Executive Dashboard</h1>
        <p className="text-muted-foreground mt-2">Real-time platform insights and performance metrics</p>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-0 shadow-lg border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Global Revenue</p>
                <p className="text-2xl font-bold text-foreground">$1,245,892</p>
                <p className="text-sm text-green-600 mt-1">+15.2% MoM</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Users</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.totalUsers?.toLocaleString() || "524,183"}
                </p>
                <p className="text-sm text-blue-600 mt-1">+8.7% MoM</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ad Providers</p>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-purple-600 mt-1">Active integrations</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MonitorSpeaker className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fraud Prevention</p>
                <p className="text-2xl font-bold text-foreground">99.2%</p>
                <p className="text-sm text-orange-600 mt-1">Detection accuracy</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Distribution */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">User Payouts (80%)</span>
                </div>
                <span className="text-sm font-medium">$996,714</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Platform Fee (20%)</span>
                </div>
                <span className="text-sm font-medium">$249,178</span>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-purple-500"></div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Performance */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Top Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">🇺🇸 United States</span>
                <span className="text-sm font-medium">$456,789</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">🇨🇦 Canada</span>
                <span className="text-sm font-medium">$234,567</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">🇬🇧 United Kingdom</span>
                <span className="text-sm font-medium">$189,432</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">🇩🇪 Germany</span>
                <span className="text-sm font-medium">$156,234</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Response Time</span>
                <span className="text-sm font-medium text-green-600">142ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database Health</span>
                <span className="text-sm font-medium text-green-600">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ad Provider Uptime</span>
                <span className="text-sm font-medium text-green-600">99.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fraud Detection</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Analytics */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Analytics</CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="default" className="gradient-bg text-white">
                  1W
                </Button>
                <Button size="sm" variant="outline">
                  1M
                </Button>
                <Button size="sm" variant="outline">
                  3M
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                <p className="text-muted-foreground">Advanced revenue analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Engagement</CardTitle>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="na">North America</SelectItem>
                  <SelectItem value="eu">Europe</SelectItem>
                  <SelectItem value="asia">Asia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                <p className="text-muted-foreground">User engagement metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case "overview":
        return renderExecutiveDashboard();
      case "analytics":
        return (
          <div className="text-center py-20">
            <PieChart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Advanced Analytics</h3>
            <p className="text-muted-foreground">Coming soon - Deep platform analytics</p>
          </div>
        );
      case "roles":
        return (
          <div className="text-center py-20">
            <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Role Management</h3>
            <p className="text-muted-foreground">Coming soon - Hierarchical role management</p>
          </div>
        );
      case "regions":
        return (
          <div className="text-center py-20">
            <Globe className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Global Regions</h3>
            <p className="text-muted-foreground">Coming soon - Global region management</p>
          </div>
        );
      case "revenue":
        return (
          <div className="text-center py-20">
            <DollarSign className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Revenue Engine</h3>
            <p className="text-muted-foreground">Coming soon - Advanced revenue management</p>
          </div>
        );
      case "fraud":
        return (
          <div className="text-center py-20">
            <Shield className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Fraud Detection</h3>
            <p className="text-muted-foreground">Coming soon - Enterprise fraud detection</p>
          </div>
        );
      case "ads":
        return (
          <div className="text-center py-20">
            <MonitorSpeaker className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Ad Management</h3>
            <p className="text-muted-foreground">Coming soon - Multi-provider ad management</p>
          </div>
        );
      case "system":
        return (
          <div className="text-center py-20">
            <Settings className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">System Settings</h3>
            <p className="text-muted-foreground">Coming soon - Global system configuration</p>
          </div>
        );
      default:
        return renderExecutiveDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {renderSidebar()}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            {renderCurrentTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
