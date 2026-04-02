import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { TrendingUp, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const DEMO_CREDENTIALS = [
  { role: "Admin",   email: "admin@fintrack.com",   password: "Admin@123",   gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  { role: "Analyst", email: "analyst@fintrack.com", password: "Analyst@123", gradient: "linear-gradient(135deg, #06b6d4, #2563eb)" },
  { role: "Viewer",  email: "viewer@fintrack.com",  password: "Viewer@123",  gradient: "linear-gradient(135deg, #10b981, #0d9488)" },
];

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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const emailValue = watch("email");

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/api/v1/users/login", data);
      login(res.data.user, res.data.accessToken);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    }
  };

  const fillCredentials = (cred) => {
    setValue("email", cred.email);
    setValue("password", cred.password);
  };

  return (
    <div className="min-h-screen mesh-bg dot-pattern flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold gradient-text tracking-tight">FinTrack</h1>
            <p className="text-xs text-muted-foreground -mt-0.5">Finance Dashboard</p>
          </div>
        </motion.div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1.5"
            >
              <label className="text-sm font-medium text-foreground/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border transition-all duration-200 outline-none
                    text-foreground placeholder:text-muted-foreground/50
                    focus:ring-2 focus:ring-primary/40 focus:border-primary/50 focus:bg-white/8
                    ${errors.email ? "border-destructive/60 bg-destructive/5" : "border-white/8 hover:border-white/15"}`}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-destructive"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password field */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-1.5"
            >
              <label className="text-sm font-medium text-foreground/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border transition-all duration-200 outline-none
                    text-foreground placeholder:text-muted-foreground/50
                    focus:ring-2 focus:ring-primary/40 focus:border-primary/50 focus:bg-white/8
                    ${errors.password ? "border-destructive/60 bg-destructive/5" : "border-white/8 hover:border-white/15"}`}
                />
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-destructive"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full py-2.5 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-5 border-t border-white/6"
          >
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
              Quick demo login
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <motion.button
                  key={cred.role}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fillCredentials(cred)}
                  className="relative px-3 py-2 rounded-xl text-xs font-medium text-white overflow-hidden group"
                >
                  <span
                    className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ background: cred.gradient }}
                  />
                  <span className="relative">{cred.role}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-2 text-center">
              Click a role to auto-fill credentials
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
