"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  User, 
  Package, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Calendar,
  MessageCircle,
  Loader2,
  PackageOpen
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import ListingCard from "@/components/ListingCard";

export default function PublicProfilePage() {
  const { id } = useParams();
  const [sellerData, setSellerData] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    const fetchSeller = async () => {
      const docRef = doc(db, "users", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSellerData(docSnap.data());
      }
    };

    const qListings = query(
      collection(db, "listings"),
      where("sellerUid", "==", id),
      where("status", "==", "approved")
    );

    const unsubListings = onSnapshot(qListings, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qReviews = query(
      collection(db, "ratings"),
      where("targetUid", "==", id)
    );
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchSeller();
    return () => {
      unsubListings();
      unsubReviews();
    };
  }, [id]);

  const handleStartChat = async () => {
    if (!auth.currentUser) {
      router.push("/login");
      return;
    }

    if (auth.currentUser.uid === id) {
      router.push("/profile");
      return;
    }

    setActionLoading(true);
    try {
      // Logic similar to item page chat start
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", auth.currentUser.uid));
      // Simplified: just redirect for now or create a blank chat
      router.push(`/messages?userId=${id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="container py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading profile...</p>
    </div>
  );

  if (!sellerData) return (
     <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p className="text-slate-500 mt-2">This student might have left the marketplace.</p>
        <Link href="/browse" className="text-primary font-bold mt-4 inline-block hover:underline">Back to Marketplace</Link>
     </div>
  );

  return (
    <div className="container py-10 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar - Profile Summary */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="card p-8 text-center flex flex-col items-center border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500/10 to-transparent -z-10"></div>
            
            <div className="w-28 h-28 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl mb-6 overflow-hidden">
              {sellerData.photoURL ? (
                <img src={sellerData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-primary">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            
            <h2 className="text-2xl font-black tracking-tight">{sellerData.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">
               <ShieldCheck className="w-3.5 h-3.5 text-success" /> Verified Student
            </div>

            <div className="grid grid-cols-2 w-full gap-4 pt-8 border-t border-slate-50 dark:border-slate-800 mb-8">
               <div className="text-center">
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100">{listings.length}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Ads</div>
               </div>
               <div className="text-center">
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100">{sellerData.rating || "5.0"}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                     <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Rating
                  </div>
               </div>
            </div>

            <button 
              onClick={handleStartChat}
              disabled={actionLoading}
              className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest justify-center shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Message Seller"}
            </button>
          </div>

          <div className="card p-6 border-slate-100 dark:border-slate-800 space-y-4">
             <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-primary" /> {sellerData.location || "Main Campus"}
             </div>
             <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-primary" /> Joined {sellerData.createdAt?.toDate?.() ? new Intl.DateTimeFormat('en-GB').format(sellerData.createdAt.toDate()) : "Recently"}
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-12">
           <section>
              <h3 className="text-2xl font-black tracking-tight mb-8">Current <span className="text-primary italic">Listings</span></h3>
              {listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {listings.map(item => (
                     <ListingCard key={item.id} item={item} />
                   ))}
                </div>
              ) : (
                <div className="py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
                   <PackageOpen className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                   <div className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">No active listings found</div>
                </div>
              )}
           </section>

           <section>
              <h3 className="text-2xl font-black tracking-tight mb-8">Campus <span className="text-amber-500 italic">Reputation</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {reviews.length > 0 ? (
                   reviews.map(review => (
                     <div key={review.id} className="card border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/40 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-primary">
                                 {review.reviewerName?.[0] || <User className="w-5 h-5 text-slate-400" />}
                              </div>
                              <div>
                                 <div className="text-sm font-bold">{review.reviewerName || "Verified Student"}</div>
                                 <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Trade: {review.itemName}</div>
                              </div>
                           </div>
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                 <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-amber-500 fill-amber-500" : "text-slate-200 dark:text-slate-700"}`} />
                              ))}
                           </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{review.comment}"</p>
                     </div>
                   ))
                 ) : (
                   <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
                      <Star className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      <div className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">No reviews yet</div>
                   </div>
                 )}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
