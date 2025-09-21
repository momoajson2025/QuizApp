import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Brain, 
  DollarSign, 
  Trophy, 
  User, 
  Home, 
  TrendingUp, 
  Calendar,
  Play,
  Star,
  Wallet,
  UserPlus,
  Plus,
  Flame,
  Award,
  CheckCircle,
  Menu,
  X,
  Calculator,
  Atom,
  MapPin
} from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

export default function UserDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: quizzes } = useQuery({
    queryKey: ["/api/quizzes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: earnings } = useQuery({
    queryKey: ["/api/dashboard/earnings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "quizzes", label: "Quizzes", icon: Brain },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "Profile", icon: User },
  ];

  const renderSidebar = () => (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-border">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold gradient-text">QuizRevenue</span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`sidebar-${item.id}-button`}
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
            src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`} 
            alt="User avatar" 
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="flex-shrink-0"
            data-testid="logout-button"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Good morning, {user.firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to earn while learning something new today?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-foreground" data-testid="total-earnings">
                  ${user.totalEarnings || "0.00"}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quizzes</p>
                <p className="text-2xl font-bold text-foreground" data-testid="quizzes-completed">
                  {user.quizzesCompleted || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-foreground" data-testid="current-streak">
                  {user.currentStreak || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold text-foreground" data-testid="total-points">
                  {user.points || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className="glass-card border-0 shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-[1.02] transition-all"
            onClick={() => setLocation('/quiz')}
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center mb-4">
                <Play className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Start New Quiz</h3>
              <p className="text-sm text-muted-foreground">Begin earning with a fresh quiz</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Request Payout</h3>
              <p className="text-sm text-muted-foreground">Withdraw your earnings</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Invite Friends</h3>
              <p className="text-sm text-muted-foreground">Earn referral bonuses</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Plus className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity yet</p>
                <p className="text-sm text-muted-foreground">Complete your first quiz to see activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderQuizzesTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Available Quizzes</h1>
        <p className="text-muted-foreground mt-2">Choose from our collection of engaging quizzes</p>
      </div>

      {/* Quiz Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Badge className="bg-primary text-primary-foreground whitespace-nowrap">All</Badge>
        <Badge variant="secondary" className="whitespace-nowrap">Math</Badge>
        <Badge variant="secondary" className="whitespace-nowrap">Science</Badge>
        <Badge variant="secondary" className="whitespace-nowrap">History</Badge>
        <Badge variant="secondary" className="whitespace-nowrap">Geography</Badge>
      </div>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes && quizzes.length > 0 ? (
          quizzes.slice(0, 6).map((quiz: any) => (
            <Card 
              key={quiz.id} 
              className="glass-card border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() => setLocation(`/quiz/${quiz.id}`)}
              data-testid={`quiz-card-${quiz.id}`}
            >
              <div className="h-32 gradient-bg flex items-center justify-center">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {quiz.category || 'General'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{quiz.estimatedTime || 15} min</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {quiz.description || 'Test your knowledge and earn rewards'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <User className="inline h-4 w-4 mr-1" />
                    <span>{quiz.participantCount || 0} players</span>
                  </div>
                  <Button 
                    size="sm"
                    className="gradient-bg text-white hover:shadow-md transition-shadow"
                  >
                    Start Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Quizzes Available</h3>
            <p className="text-muted-foreground">Check back later for new quiz content</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEarningsTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Earnings Dashboard</h1>
        <p className="text-muted-foreground mt-2">Track your quiz performance and revenue</p>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground">${earnings?.total || "0.00"}</h3>
              <p className="text-muted-foreground">Total Earnings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground">${earnings?.average || "0.00"}</h3>
              <p className="text-muted-foreground">Average per Quiz</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground">{earnings?.totalQuizzes || 0}</h3>
              <p className="text-muted-foreground">Quizzes Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart Placeholder */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Earnings chart will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLeaderboardTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">See how you rank against other players</p>
      </div>

      {/* Leaderboard Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Badge className="bg-primary text-primary-foreground whitespace-nowrap">Global</Badge>
        <Badge variant="secondary" className="whitespace-nowrap">Country</Badge>
        <Badge variant="secondary" className="whitespace-nowrap">State</Badge>
      </div>

      {/* Leaderboard List */}
      <Card className="glass-card border-0 shadow-lg">
        <CardContent className="p-6">
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.slice(0, 10).map((entry: any, index: number) => (
                <div key={entry.id} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{entry.rank || index + 1}</span>
                  </div>
                  <img 
                    src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32`}
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">User {index + 1}</p>
                    <p className="text-sm text-muted-foreground">{entry.points || 0} points</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">${entry.earnings || "0.00"}</p>
                    <p className="text-sm text-muted-foreground">{entry.quizzesCompleted || 0} quizzes</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Leaderboard Data</h3>
              <p className="text-muted-foreground">Complete quizzes to appear on the leaderboard</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <p className="text-muted-foreground">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Region</label>
              <p className="text-muted-foreground">{user.region || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Member Since</label>
              <p className="text-muted-foreground">
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Earnings</span>
              <span className="font-medium">${user.totalEarnings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quizzes Completed</span>
              <span className="font-medium">{user.quizzesCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Streak</span>
              <span className="font-medium">{user.currentStreak} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Points</span>
              <span className="font-medium">{user.points}</span>
            </div>
            <Separator />
            <Button className="w-full gradient-bg text-white">
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "quizzes":
        return renderQuizzesTab();
      case "earnings":
        return renderEarningsTab();
      case "leaderboard":
        return renderLeaderboardTab();
      case "profile":
        return renderProfileTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <img 
                src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32`}
                alt="User avatar" 
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h2 className="font-semibold text-foreground">{user.firstName} {user.lastName}</h2>
                <p className="text-xs text-muted-foreground">Ready to play</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                <Star className="h-3 w-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-800">{user.points}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-64 flex flex-col fixed inset-y-0">
            {renderSidebar()}
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="fixed inset-y-0 left-0 w-64 bg-white">
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${!isMobile ? 'ml-64' : ''}`}>
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
            {renderCurrentTab()}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40">
          <div className="flex items-center justify-around py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("overview")}
              className={`flex flex-col items-center py-2 px-3 ${
                activeTab === "overview" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="mobile-nav-overview"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("quizzes")}
              className={`flex flex-col items-center py-2 px-3 ${
                activeTab === "quizzes" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="mobile-nav-quizzes"
            >
              <Brain className="h-5 w-5" />
              <span className="text-xs mt-1">Quizzes</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/quiz')}
              className="flex flex-col items-center py-2 px-3"
              data-testid="mobile-nav-play"
            >
              <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                <Play className="h-5 w-5 text-white" />
              </div>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("earnings")}
              className={`flex flex-col items-center py-2 px-3 ${
                activeTab === "earnings" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="mobile-nav-earnings"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs mt-1">Earnings</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center py-2 px-3 ${
                activeTab === "profile" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="mobile-nav-profile"
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
