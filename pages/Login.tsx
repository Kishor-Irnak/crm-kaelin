import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../src/lib/firebase";
import { Loader2, Lock, Mail, ChevronRight } from "lucide-react";
import { cn } from "../components/ui-primitives";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.tsx's onAuthStateChanged will handle the rest.
    } catch (err: any) {
      console.error("Login failed:", err);
      // Provide a user friendly error message
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/invalid-email" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.");
      } else {
        setError("Failed to login. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(var(--primary))]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--card-border))] rounded-3xl shadow-xl relative z-10 overflow-hidden flex flex-col">
        <div className="p-8 sm:p-10 flex flex-col items-center border-b border-[hsl(var(--border))]">
          <div className="w-16 h-16 flex items-center justify-center mb-6">
            <img
              src="https://i.postimg.cc/s3hdwC3L/image-removebg-preview.png"
              alt="KAELIN"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight text-center">
            Welcome Back
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 text-center font-medium">
            Sign in to access the KAELIN CRM
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="p-8 sm:p-10 flex flex-col gap-6"
        >
          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-sm font-medium animate-in fade-in zoom-in-95 duration-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail
                    size={16}
                    className="text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors"
                  />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-semibold text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 focus:border-transparent transition-all"
                  placeholder="admin@kaelin.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock
                    size={16}
                    className="text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors"
                  />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-semibold text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl font-bold shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ChevronRight size={18} className="opacity-70" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs font-medium text-[hsl(var(--muted-foreground))] space-y-1 relative z-10">
        <p>&copy; {new Date().getFullYear()} KAELIN.</p>
        <p>Authorized access only.</p>
      </div>
    </div>
  );
};
