import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Brain, Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  region: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val, "You must agree to the terms"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, verifyOtpMutation, resendOtpMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Redirect authenticated users
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

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      region: "",
      agreeToTerms: false,
    },
  });

  const handleLogin = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      const result = await registerMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        region: data.region,
      });
      setUserEmail(result.email);
      setShowOTPForm(true);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleOTPVerification = async (otp: string) => {
    try {
      await verifyOtpMutation.mutateAsync({
        email: userEmail,
        otp,
      });
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOtpMutation.mutateAsync({ email: userEmail });
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  if (showOTPForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
        <Card className="w-full max-w-md bg-white/60 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <p className="text-muted-foreground mt-2">
              We've sent a 6-digit code to{" "}
              <span className="font-medium" data-testid="verification-email">
                {userEmail}
              </span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-center mb-4">
                Enter Verification Code
              </Label>
              <OTPInput
                length={6}
                onComplete={handleOTPVerification}
                className="mb-6"
              />
            </div>
            
            <Button
              onClick={() => setShowOTPForm(false)}
              variant="outline"
              className="w-full"
              data-testid="back-to-auth-button"
            >
              Back to Registration
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <Button
                  variant="link"
                  onClick={handleResendOTP}
                  disabled={resendOtpMutation.isPending}
                  className="p-0 h-auto text-primary"
                  data-testid="resend-otp-button"
                >
                  {resendOtpMutation.isPending ? "Sending..." : "Resend Code"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md bg-white/60 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isLogin 
                ? "Sign in to your account to continue earning"
                : "Join thousands earning while learning"
              }
            </p>
          </CardHeader>
          
          <CardContent>
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register("email")}
                    data-testid="login-email-input"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...loginForm.register("password")}
                      data-testid="login-password-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="toggle-password-visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button variant="link" className="text-sm p-0">
                    Forgot password?
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={loginMutation.isPending}
                  data-testid="login-submit-button"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      {...registerForm.register("firstName")}
                      data-testid="register-first-name-input"
                    />
                    {registerForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      {...registerForm.register("lastName")}
                      data-testid="register-last-name-input"
                    />
                    {registerForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...registerForm.register("email")}
                    data-testid="register-email-input"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...registerForm.register("phone")}
                    data-testid="register-phone-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...registerForm.register("password")}
                      data-testid="register-password-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="region">Region (Optional)</Label>
                  <Select onValueChange={(value) => registerForm.setValue("region", value)}>
                    <SelectTrigger data-testid="register-region-select">
                      <SelectValue placeholder="Select your region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="gb">United Kingdom</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    {...registerForm.register("agreeToTerms")}
                    data-testid="register-terms-checkbox"
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the{" "}
                    <Button variant="link" className="p-0 h-auto text-primary">
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button variant="link" className="p-0 h-auto text-primary">
                      Privacy Policy
                    </Button>
                  </Label>
                </div>
                {registerForm.formState.errors.agreeToTerms && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.agreeToTerms.message}
                  </p>
                )}
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={registerMutation.isPending}
                  data-testid="register-submit-button"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="p-0 h-auto text-primary font-medium"
                  data-testid="toggle-auth-mode-button"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Hero */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <Brain className="h-24 w-24 mx-auto mb-8 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Turn Knowledge Into Cash</h2>
          <p className="text-xl text-purple-100 mb-6">
            Join our quiz platform and earn real money while expanding your knowledge.
          </p>
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Earn 80% of ad revenue</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Instant payouts available</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Fraud protection guaranteed</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Mobile-optimized experience</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
