"use client";

import { useState, useEffect } from "react";
import { Search, SortDesc, ChevronRight, SlidersHorizontal, PackageOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingCard from "@/components/ListingCard";

const CATEGORIES = ["All", "Textbooks", "Electronics", "Furniture", "Clothing", "Services", "Hostels"];

export default function BrowsePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Real-time fetching logic
  useEffect(() => {
    setLoading(true);
    let q = query(
      collection(db, "listings"),
      where("status", "==", "approved")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      // Sort by date in-memory
      docs = docs.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      // Combined Filters
      const filteredResults = docs.filter(item => {
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        const matchesCondition = selectedCondition === "All" || item.condition === selectedCondition;
        const matchesPrice = (item.price || 0) >= priceRange.min && (item.price || 0) <= priceRange.max;
        const matchesSearch = 
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesCondition && matchesPrice && matchesSearch;
      });

      setItems(filteredResults);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [searchTerm, selectedCategory, selectedCondition, priceRange]);

  return (
    <div className="container py-10 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">Marketplace <span className="text-primary italic">Feed</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Browse thousands of items from your fellow students.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:max-w-md">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="What are you looking for today?" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all text-sm font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-3 rounded-xl border lg:hidden transition-all ${isFilterOpen ? "bg-primary border-primary text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary"}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className={`${isFilterOpen ? "flex" : "hidden"} lg:flex flex-col gap-8 w-full lg:w-64 flex-shrink-0`}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Categories</h3>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    selectedCategory === cat 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-primary shadow-sm" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {cat}
                  {selectedCategory === cat && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Condition</h3>
            <div className="flex flex-wrap gap-2">
              {["All", "New", "Like New", "Excellent", "Used"].map(cond => (
                <button 
                  key={cond}
                  onClick={() => setSelectedCondition(cond)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    selectedCondition === cond 
                      ? "bg-primary border-primary text-white shadow-sm" 
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary"
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Max Price</h3>
            <input 
              type="range" 
              min="0" 
              max="100000" 
              step="1000"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
              className="w-full accent-primary bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>KES 0</span>
              <span>KES {priceRange.max.toLocaleString()}</span>
            </div>
          </div>

          <Link href="/sell" className="p-5 bg-slate-900 rounded-2xl text-white relative overflow-hidden group block shadow-xl">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all"></div>
            <h4 className="font-bold mb-2">Sell your items</h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">Declutter your room and earn extra cash today!</p>
            <div className="w-full py-2 bg-primary hover:bg-primary-hover rounded-lg text-xs font-bold transition-all text-center">
              Post an Ad
            </div>
          </Link>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-500 font-bold">Showing {items.length} listings</span>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
              <button className="flex items-center gap-1 hover:text-primary"><SortDesc className="w-4 h-4" /> Newest First</button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {items.map(item => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
               <PackageOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-2" />
               <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No items found</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
               <button 
                  onClick={() => {
                    setSearchTerm(""); 
                    setSelectedCategory("All");
                    setSelectedCondition("All");
                    setPriceRange({ min: 0, max: 100000 });
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Clear all filters
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
