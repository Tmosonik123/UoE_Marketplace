"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, UserPlus, User, ShieldCheck, AlertCircle, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("Main Campus");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    
    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Profile Display Name
      await updateProfile(user, { displayName: name });

      // 3. Create User Document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        photoURL: "",
        createdAt: new Date().toISOString(),
        role: "user",
        location: location,
        isVerified: false, // Initially false, can be set by admin or future logic
        rating: 0,
        listingsCount: 0
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-[80vh] flex items-center justify-center animate-fade-in py-10">
      <div className="w-full max-w-md">
        <div className="card shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Join the Community</h1>
            <p className="text-slate-500 mt-2">Create your UoE Marketplace account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 mb-6 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Primary Campus</label>
              <div className="relative">
                <select 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all appearance-none font-medium"
                  required
                >
                  <option value="Main Campus">Main Campus</option>
                  <option value="Annex Campus">Annex Campus</option>
                  <option value="Town Campus">Town Campus</option>
                </select>
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

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
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
                  required
                />
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex items-start gap-2 mt-2 px-1">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-[11px] text-slate-500 font-medium">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and 
                <Link href="/privacy" className="text-primary hover:underline"> Privacy Policy</Link>.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 justify-center mt-2 shadow-xl shadow-indigo-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-10">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
