import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Brain, 
  Users, 
  DollarSign, 
  Globe, 
  Shield, 
  CheckCircle, 
  ClipboardList,
  TrendingUp,
  Plus,
  User,
  AlertTriangle,
  Clock,
  Award,
  Ban
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user has admin privileges
  if (!user || !['content_creator', 'state_admin', 'country_admin'].includes(user.role)) {
    setLocation('/dashboard');
    return null;
  }

  // Fetch admin data
  const { data: adminQuizzes } = useQuery({
    queryKey: ["/api/admin/quizzes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/superadmin/analytics"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: user.role === 'country_admin', // Only country admins can see broader analytics
  });

  const sidebarItems = [
    { id: "overview", label: "Analytics Overview", icon: TrendingUp },
    { id: "quizzes", label: "Quiz Management", icon: Brain },
    { id: "users", label: "User Management", icon: Users },
    { id: "revenue", label: "Revenue Tracking", icon: DollarSign },
    { id: "regions", label: "Region Management", icon: Globe },
    { id: "fraud", label: "Fraud Detection", icon: Shield },
    { id: "approvals", label: "Pending Approvals", icon: CheckCircle, badge: 5 },
    { id: "audit", label: "Audit Logs", icon: ClipboardList },
  ];

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-border flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center flex-shrink-0 px-4 py-6 border-b border-border">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold gradient-text">Admin Panel</span>
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
                data-testid={`admin-sidebar-${item.id}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex items-center space-x-3 w-full">
          <img 
            src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`}
            alt="Admin avatar" 
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {user.role.replace('_', ' ')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            className="flex-shrink-0"
            data-testid="admin-logout-button"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor platform performance and manage operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">$528,976.82</p>
                <p className="text-sm text-green-600 mt-1">+7.9% vs prev month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">156,841</p>
                <p className="text-sm text-blue-600 mt-1">+12.3% vs prev month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                <p className="text-2xl font-bold text-foreground">89,342</p>
                <p className="text-sm text-purple-600 mt-1">+18.7% vs prev month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Fee</p>
                <p className="text-2xl font-bold text-foreground">$105,795.36</p>
                <p className="text-sm text-orange-600 mt-1">20% of total revenue</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Trend</CardTitle>
              <Select defaultValue="7days">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                <p className="text-muted-foreground">Revenue analytics chart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Activity</CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="default" className="gradient-bg text-white">
                  Daily
                </Button>
                <Button size="sm" variant="outline">
                  Weekly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                <p className="text-muted-foreground">User activity chart</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Administrative Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Quiz "Advanced Physics" approved</p>
                <p className="text-sm text-muted-foreground">By Admin Sarah Johnson • 2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">New regional admin assigned to California</p>
                <p className="text-sm text-muted-foreground">By SuperAdmin • 5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Fraudulent account suspended</p>
                <p className="text-sm text-muted-foreground">Automatic fraud detection • 1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuizManagementTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quiz Management</h1>
          <p className="text-muted-foreground mt-1">Manage and approve quiz content</p>
        </div>
        <Button className="gradient-bg text-white hover:shadow-lg transition-shadow">
          <Plus className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="math">Math</SelectItem>
            <SelectItem value="science">Science</SelectItem>
            <SelectItem value="history">History</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="eu">Europe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quiz List */}
      <Card className="glass-card border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quiz Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/20">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">Advanced Calculus Concepts</div>
                      <div className="text-sm text-muted-foreground">20 questions • Estimated 25 min</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                        alt="Creator"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-foreground">Dr. Emily Chen</div>
                        <div className="text-sm text-muted-foreground">Content Creator</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Mathematics
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Pending Review
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    2 hours ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <Button variant="ghost" size="sm" className="text-primary">
                      Review
                    </Button>
                    <Button variant="ghost" size="sm" className="text-green-600">
                      Approve
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Reject
                    </Button>
                  </td>
                </tr>
                
                <tr className="hover:bg-muted/20">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">World History Timeline</div>
                      <div className="text-sm text-muted-foreground">15 questions • Estimated 18 min</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                        alt="Creator"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-foreground">Prof. Michael Ross</div>
                        <div className="text-sm text-muted-foreground">Content Creator</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      History
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Approved
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    1 day ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <Button variant="ghost" size="sm" className="text-primary">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      Archive
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "quizzes":
        return renderQuizManagementTab();
      case "users":
        return (
          <div className="text-center py-20">
            <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
            <p className="text-muted-foreground">Coming soon - Manage platform users</p>
          </div>
        );
      case "revenue":
        return (
          <div className="text-center py-20">
            <DollarSign className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Revenue Tracking</h3>
            <p className="text-muted-foreground">Coming soon - Detailed revenue analytics</p>
          </div>
        );
      case "regions":
        return (
          <div className="text-center py-20">
            <Globe className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Region Management</h3>
            <p className="text-muted-foreground">Coming soon - Manage regional settings</p>
          </div>
        );
      case "fraud":
        return (
          <div className="text-center py-20">
            <Shield className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Fraud Detection</h3>
            <p className="text-muted-foreground">Coming soon - Advanced fraud monitoring</p>
          </div>
        );
      case "approvals":
        return (
          <div className="text-center py-20">
            <CheckCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Pending Approvals</h3>
            <p className="text-muted-foreground">Coming soon - Content approval workflow</p>
          </div>
        );
      case "audit":
        return (
          <div className="text-center py-20">
            <ClipboardList className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Audit Logs</h3>
            <p className="text-muted-foreground">Coming soon - System audit trails</p>
          </div>
        );
      default:
        return renderOverviewTab();
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
