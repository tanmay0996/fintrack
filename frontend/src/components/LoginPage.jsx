import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/api/v1/users/login", data);
      login(res.data.user, res.data.accessToken);
      toast.success(`Welcome back, ${res.data.user.name}`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">FinTrack</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 p-3 rounded-md bg-muted text-xs space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Demo credentials</p>
            <p>Admin: admin@fintrack.com / Admin@123</p>
            <p>Analyst: analyst@fintrack.com / Analyst@123</p>
            <p>Viewer: viewer@fintrack.com / Viewer@123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
