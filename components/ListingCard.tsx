"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

interface ListingCardProps {
  item: any;
}

export default function ListingCard({ item }: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(item.status || 'pending');

  useEffect(() => {
    // Listen to listing status changes
    const listingRef = doc(db, "listings", item.id);
    const unsubStatus = onSnapshot(listingRef, (doc) => {
      if (doc.exists()) {
        setStatus(doc.data().status);
      }
    });

    if (!auth.currentUser) return () => unsubStatus();

    const favRef = doc(db, "users", auth.currentUser.uid, "favorites", item.id);
    const unsubFav = onSnapshot(favRef, (doc) => {
      setIsFavorited(doc.exists());
    }, (err) => {
      console.error("[onSnapshot Card Favorite Status] error:", err);
    });

    return () => {
      unsubStatus();
      unsubFav();
    };
  }, [item.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) {
      alert("Please login to save items.");
      return;
    }

    setLoading(true);
    const favRef = doc(db, "users", auth.currentUser.uid, "favorites", item.id);

    try {
      if (isFavorited) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          listingId: item.id,
          title: item.title,
          price: item.price,
          category: item.category,
          image: item.images?.[0] || "",
          status: status, // Save current status too
          savedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isSold = status === 'sold';

  return (
    <Link 
      href={`/items/${item.id}`} 
      className={`card group border-slate-100 hover:border-primary/20 dark:hover:border-primary/40 transition-all duration-300 ${isSold ? 'grayscale opacity-75 grayscale-[0.5]' : ''}`}
    >
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 overflow-hidden relative border border-slate-50 dark:border-slate-700">
        <div className="absolute top-3 right-3 z-10">
          <button 
            onClick={toggleFavorite}
            disabled={loading}
            className={`backdrop-blur-sm p-2 rounded-full shadow-lg transition-all hover:scale-110 ${
              isFavorited 
                ? "bg-red-500 text-white" 
                : "bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
          </button>
        </div>
        
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
           {isSold && (
             <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black py-1 px-2.5 rounded-lg shadow-lg uppercase tracking-widest ring-1 ring-white/20">
                Sold Out
             </span>
           )}
           {item.condition && !isSold && (
             <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] font-black py-1 px-2.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 uppercase tracking-widest text-slate-900">
                {item.condition}
             </span>
           )}
        </div>
        
        {item.images?.[0] || item.image ? (
           <img 
            src={item.images?.[0] || item.image} 
            alt={item.title} 
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isSold ? 'blur-[0.5px]' : ''}`} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 font-black text-4xl opacity-50 select-none">
            UoE
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</span>
        </div>
        <h3 className={`text-base font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] ${isSold ? 'text-slate-400' : ''}`}>
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50 dark:border-slate-800">
          <span className={`text-xl font-black ${isSold ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
            KES {item.price?.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" /> {item.location}
          </span>
        </div>
      </div>
    </Link>
  );
}
