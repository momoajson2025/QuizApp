import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Brain, DollarSign, Shield, Globe, TrendingUp, Smartphone, Menu, X } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect logged-in users to appropriate dashboard
  if (user) {
    if (user.role === 'superadmin') {
      setLocation('/superadmin');
    } else if (['country_admin', 'state_admin', 'content_creator'].includes(user.role)) {
      setLocation('/admin');
    } else {
      setLocation('/dashboard');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                QuizRevenue
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">
                About
              </a>
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/auth')}
                data-testid="nav-login-button"
              >
                Login
              </Button>
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="nav-register-button"
              >
                Get Started
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-border">
            <div className="px-4 py-2 space-y-2">
              <a href="#features" className="block py-2 text-muted-foreground hover:text-primary">
                Features
              </a>
              <a href="#pricing" className="block py-2 text-muted-foreground hover:text-primary">
                Pricing
              </a>
              <a href="#about" className="block py-2 text-muted-foreground hover:text-primary">
                About
              </a>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setLocation('/auth')}
              >
                Login
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={() => setLocation('/auth')}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Earn While You{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Learn
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join the most engaging quiz platform where knowledge pays. Answer quizzes, watch ads, 
              and earn real money with our revolutionary revenue-sharing system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation('/auth')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg"
                data-testid="hero-start-earning-button"
              >
                Start Earning Today
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg"
                data-testid="hero-watch-demo-button"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need for a complete quiz experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Quiz Engine</h3>
                <p className="text-muted-foreground">
                  AI-powered quiz generation with adaptive difficulty and personalized content recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Revenue Sharing</h3>
                <p className="text-muted-foreground">
                  Earn 80% of ad revenue generated from your quiz participation. Fair and transparent payouts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Fraud Protection</h3>
                <p className="text-muted-foreground">
                  Advanced security with VPN detection, device fingerprinting, and behavioral analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Reach</h3>
                <p className="text-muted-foreground">
                  Region-based content delivery with country and state-level administrative controls.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-time Analytics</h3>
                <p className="text-muted-foreground">
                  Comprehensive dashboard with earnings tracking, performance metrics, and detailed insights.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Mobile First</h3>
                <p className="text-muted-foreground">
                  Optimized for mobile devices with responsive design and seamless user experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of users who are already earning money while expanding their knowledge.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation('/auth')}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            data-testid="cta-join-button"
          >
            Join QuizRevenue Today
          </Button>
        </div>
      </section>
    </div>
  );
}
