"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowRight, ShieldCheck, Zap, Heart, MessageCircle, Loader2, PackageOpen, MapPin } from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingCard from "@/components/ListingCard";

const CATEGORIES = [
  { id: '1', name: 'Textbooks', icon: '📚', slug: 'Textbooks' },
  { id: '2', name: 'Electronics', icon: '💻', slug: 'Electronics' },
  { id: '3', name: 'Furniture', icon: '🪑', slug: 'Furniture' },
  { id: '4', name: 'Clothing', icon: '👕', slug: 'Clothing' },
  { id: '5', name: 'Services', icon: '🤝', slug: 'Services' },
  { id: '6', name: 'Hostels', icon: '🏠', slug: 'Hostels' },
];

export default function Home() {
  const [latestItems, setLatestItems] = useState<any[]>([]);
  const [userCount, setUserCount] = useState<number>(5000); // Fallback to 5,000+
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simplified query to avoid composite index requirements
    const q = query(
      collection(db, "listings"),
      where("status", "==", "approved"),
      limit(20) // Fetch a bit more to ensure we have enough after sorting
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in-memory and take the top 4
      const sorted = items.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      }).slice(0, 4);

      setLatestItems(sorted);
      setLoading(false);
    }, (err) => {
      console.error("[onSnapshot Home Listings] error:", err);
      setLoading(false);
    });

    // Fetch user count
    const fetchUserCount = async () => {
      try {
        const snapshot = await getCountFromServer(collection(db, "users"));
        setUserCount(snapshot.data().count);
      } catch (err) {
        console.error("User count error:", err);
      }
    };
    fetchUserCount();

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-20">
      {/* Hero Section */}
      <section className="container pt-10 text-center animate-fade-in">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <div className="badge badge-secondary py-1.5 px-4 mb-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-accent" /> 
            Trusted by {userCount.toLocaleString()}+ UoE Students
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Buy and Sell within your <span className="text-primary italic">Campus.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-xl">
            The safest way to trade textbooks, electronics, and furniture with fellow University of Eldoret students.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
            <Link href="/browse" className="btn-primary py-4 px-10 text-lg shadow-xl shadow-indigo-100 dark:shadow-none">
              Start Browsing <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/sell" className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 py-4 px-10 text-lg font-bold rounded-xl text-slate-800 dark:text-slate-100 hover:border-primary transition-all">
              Sell an Item
            </Link>
          </div>
        </div>
        
        {/* Category Quick Filter */}
        <div className="mt-16 flex flex-wrap justify-center gap-3 md:gap-4">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/browse?category=${cat.slug}`}
              className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 hover:border-primary hover:shadow-md transition-all flex items-center gap-3 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <div className="text-left">
                <span className="block font-bold text-sm text-slate-800">{cat.name}</span>
                <span className="block text-[10px] text-slate-400 font-medium uppercase">Browse</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Items Placeholder - Grid Section */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold">Latest Listings</h2>
              <p className="text-slate-500 text-sm mt-1">Recently posted by students around campus.</p>
            </div>
            <Link href="/browse" className="text-primary font-semibold flex items-center gap-1 hover:underline">
              See All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid-marketplace">
            {/* Post an Ad Card - Primary CTA */}
            <Link href="/sell" className="card p-8 bg-slate-900 dark:bg-primary/10 border-none relative overflow-hidden group flex flex-col justify-center min-h-[320px]">
               <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-700"></div>
               <div className="relative z-10">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20">
                     <Zap className="w-8 h-8 text-white fill-white/20" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 leading-tight">Got something to <span className="text-primary italic">sell</span>?</h3>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-[200px]">List your items in seconds and reach thousands of students on campus.</p>
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                     Start Listing Now <ArrowRight className="w-4 h-4" />
                  </div>
               </div>
            </Link>

            {loading ? (
               [1, 2, 3].map((i) => (
                  <div key={i} className="card bg-slate-100 dark:bg-slate-800 animate-pulse h-full border-none"></div>
               ))
            ) : latestItems.length > 0 ? (
               latestItems.map((item) => (
                  <ListingCard key={item.id} item={item} />
               ))
            ) : (
               <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <PackageOpen className="w-12 h-12" />
                  <p className="font-bold">No active listings found.</p>
               </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="container py-10">
        <h2 className="text-center text-3xl font-bold mb-16">Designed for <span className="text-primary italic underline-offset-8 underline">Campus Safety</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Verified Students</h3>
              <p className="text-slate-500 text-sm">Trading happens only between authenticated users. No anonymous scammers.</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Smart Negotiation</h3>
              <p className="text-slate-500 text-sm">Real-time chat enables quick pricing and meetup arrangements in safe zones.</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Cash/M-Pesa on Delivery</h3>
              <p className="text-slate-500 text-sm">No advance payments. Inspect your items face-to-face before completing the trade.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
