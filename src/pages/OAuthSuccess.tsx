import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      // Save token and navigate to dashboard
      localStorage.setItem("access_token", token);
      // short delay to allow user to see message
      setTimeout(() => navigate("/dashboard", { replace: true }), 300);
    } else {
      // No token present — go to login
      navigate("/login", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-semibold">Signing you in…</h1>
        <p className="text-muted-foreground">If you are not redirected automatically, <a href="/login" className="text-primary underline">click here</a>.</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
