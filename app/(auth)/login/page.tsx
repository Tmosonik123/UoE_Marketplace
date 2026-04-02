"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, ShieldCheck, Globe, AlertCircle, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: any) {
      setError("Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md">
        <div className="card shadow-2xl p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <LogIn className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Sign in to your UoE Marketplace account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 mb-6 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <Link href="/forgot-password" title="Coming soon" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-3.5 justify-center mt-2 shadow-lg shadow-indigo-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="relative mt-10 mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-wider">Or continue with</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm"
            >
              <Globe className="w-5 h-5 text-slate-700" /> Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm opacity-50 cursor-not-allowed">
              <ShieldCheck className="w-5 h-5 text-slate-700" /> GitHub
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-10">
            Don't have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
