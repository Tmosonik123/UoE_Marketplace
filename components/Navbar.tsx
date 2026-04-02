"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Menu, X, PlusCircle, MessageSquare, ShieldCheck, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, userData, isAdmin, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for unread messages
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        total += (data.unreadCount?.[user.uid] || 0);
      });
      setUnreadCount(total);
    }, (err) => {
      console.error("[onSnapshot Navbar Notifications] error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "glass shadow-lg py-3" : "bg-transparent py-5"
    }`}>
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
            U
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            UoE <span className="text-primary">Marketplace</span>
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-10 relative">
          <input 
            type="text" 
            placeholder="Search textbooks, electronics..." 
            className="w-full bg-slate-100 border-none rounded-full py-2.5 px-12 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center gap-6">
          <button 
             onClick={toggleTheme}
             className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-primary transition-all shadow-inner"
          >
             {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 font-bold" />}
          </button>
          <Link href="/browse" className="text-sm font-medium hover:text-primary flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Browse
          </Link>
          
          {!loading && user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <ShieldCheck className="w-4 h-4" /> Admin
                </Link>
              )}
              <Link href="/messages" className="text-sm font-medium hover:text-primary flex items-center gap-2 relative">
                <div className="relative">
                   <MessageSquare className="w-4 h-4" />
                   {unreadCount > 0 && (
                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-pulse border border-white">
                       {unreadCount > 9 ? "9+" : unreadCount}
                     </span>
                   )}
                </div>
                Messages
              </Link>
              <Link href="/sell" className="btn-primary py-2 px-4 text-sm">
                <PlusCircle className="w-4 h-4" /> List Item
              </Link>
              <Link href="/profile" className="flex items-center gap-2 p-1 rounded-full border border-slate-200 hover:border-primary transition-colors">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-secondary" />
                  )}
                </div>
              </Link>
            </>
          ) : !loading && (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium hover:text-primary">Login</Link>
              <Link href="/signup" className="btn-primary py-2 px-6 text-sm">Sign Up</Link>
            </div>
          )}
          {loading && <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse"></div>}
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden p-2 text-slate-800"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-2xl p-6 flex flex-col gap-4 animate-fade-in">
           <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-slate-100 border-none rounded-full py-2.5 px-12 focus:ring-2 focus:ring-primary outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
          </div>
          <Link href="/browse" className="text-lg font-medium p-2" onClick={() => setIsMobileMenuOpen(false)}>Browse Listings</Link>
          
          {isAdmin && (
            <Link href="/admin" className="text-lg font-bold p-2 text-amber-600 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <ShieldCheck className="w-5 h-5" /> Admin Console
            </Link>
          )}

          {!loading && user ? (
            <>
              <Link href="/messages" className="text-lg font-medium p-2 flex items-center justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                Messages
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                    {unreadCount > 9 ? "9+" : unreadCount} New
                  </span>
                )}
              </Link>
              <Link href="/sell" className="text-lg font-medium p-2 text-primary" onClick={() => setIsMobileMenuOpen(false)}>List an Item</Link>
              <Link href="/profile" className="text-lg font-medium p-2" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
            </>
          ) : !loading && (
            <div className="flex flex-col gap-3 mt-4">
              <Link href="/login" className="btn-secondary text-center py-3 border border-slate-200 rounded-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link href="/signup" className="btn-primary text-center py-3 rounded-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Create Account</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
