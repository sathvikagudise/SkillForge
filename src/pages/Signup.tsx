import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authAPI, API_URL } from "@/services/api";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleGoogleSignup = () => {
    // Redirect browser to backend Google OAuth endpoint to start the flow
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Bcrypt has a 72-byte input limit; validate bytes, not characters
    try {
      const encoder = new TextEncoder();
      const byteLen = encoder.encode(formData.password).length;
      if (byteLen > 72) {
        setError("Password is too long. Bcrypt limits passwords to 72 bytes — use a shorter password (<=72 bytes).");
        return;
      }
    } catch (e) {
      // If TextEncoder isn't available for any reason, fall back to character length
      if (formData.password.length > 72) {
        setError("Password is too long (over 72 characters). Choose a shorter password.");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await authAPI.signup(
        formData.email,
        formData.password,
        formData.name
      );
      console.log("Signup successful:", response);
      // Navigate to login page
      navigate("/login");
    } catch (err: any) {
      // Normalize error into a readable message. The API may return structured JSON
      let message = "Signup failed. Please try again.";
      if (!err) {
        message = "Signup failed. No error information.";
      } else if (typeof err === 'string') {
        message = err;
      } else if (err.message) {
        // Sometimes err.message contains JSON (we stringify on the API side). Try to parse.
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && typeof parsed === 'object') {
            if (parsed.detail) {
              const d = parsed.detail;
              if (typeof d === 'string') message = d;
              else if (Array.isArray(d)) message = d.map((it: any) => it.msg || JSON.stringify(it)).join('; ');
              else message = JSON.stringify(d);
            } else {
              message = JSON.stringify(parsed);
            }
          } else {
            message = String(parsed);
          }
        } catch {
          message = err.message;
        }
      } else {
        try {
          message = JSON.stringify(err);
        } catch {
          message = String(err);
        }
      }

      setError(message);
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <Card className="shadow-xl border-gray-100">
          <CardHeader className="space-y-4 text-center pt-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Start your personalized learning experience</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 px-8 pb-8">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe"
                  className="h-11"
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com"
                  className="h-11"
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="h-11"
                  value={formData.password}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••"
                  className="h-11"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required 
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-11"
              onClick={handleGoogleSignup}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
