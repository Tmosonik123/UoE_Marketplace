"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Package, 
  MessageSquare, 
  Heart, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Star, 
  ExternalLink,
  Trash2,
  CheckCircle,
  Clock,
  PackageOpen,
  MapPin
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";

type ActiveTab = "listings" | "saved" | "reviews";

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("listings");
  const [listings, setListings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      // Fetch user's listings
      const qListings = query(
        collection(db, "listings"),
        where("sellerUid", "==", user.uid)
      );

      const unsubListings = onSnapshot(qListings, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setListings(items);
        setListingsLoading(false);
      }, (err) => {
        console.error("[onSnapshot Profile My Listings] error:", err);
        setListingsLoading(false);
      });

      // Fetch user's favorites
      const qFavs = collection(db, "users", user.uid, "favorites");
      const unsubFavs = onSnapshot(qFavs, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFavorites(items);
      }, (err) => {
        console.error("[onSnapshot Profile Favorites] error:", err);
      });

      // Fetch user's reviews (mock or real if collection exists)
      const qReviews = query(
        collection(db, "ratings"),
        where("targetUid", "==", user.uid)
      );
      const unsubReviews = onSnapshot(qReviews, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviews(items);
      }, (err) => {
        console.error("[onSnapshot Profile Reviews] error:", err);
      });

      return () => {
        unsubListings();
        unsubFavs();
        unsubReviews();
      };
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this listing?")) {
      await deleteDoc(doc(db, "listings", id));
    }
  };

  const toggleStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    const newStatus = currentStatus === "sold" ? "approved" : "sold";
    await updateDoc(doc(db, "listings", id), { status: newStatus });
  };

  if (loading || !user) {
    return (
      <div className="container min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar - Profile Summary */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="card p-8 text-center flex flex-col items-center border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl mb-6 overflow-hidden relative group">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-primary">
                  <User className="w-10 h-10" />
                </div>
              )}
              <Link 
                href="/profile/settings"
                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
            
            <h2 className="text-xl font-black tracking-tight">{userData?.name || user.displayName || "User"}</h2>
            <div className="flex flex-col items-center gap-1.5 mt-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                 <ShieldCheck className="w-3.5 h-3.5 text-success" /> Verified Student
              </div>
              {userData?.location && (
                <div className="flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-widest mt-1">
                   <MapPin className="w-3 h-3" /> {userData.location}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 w-full gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
               <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-slate-100">{listings.length}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listings</div>
               </div>
               <div className="text-center">
                  <div className="text-lg font-black text-slate-800 dark:text-slate-100">{userData?.rating || "5.0"}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                     <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Rating
                  </div>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
             <button 
                onClick={() => setActiveTab("listings")}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${
                   activeTab === 'listings' 
                   ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 shadow-sm" 
                   : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
             >
                <Package className="w-4 h-4 text-primary" /> My Listings
             </button>
             <button 
                onClick={() => setActiveTab("saved")}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${
                   activeTab === 'saved' 
                   ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 shadow-sm" 
                   : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
             >
                <Heart className="w-4 h-4" /> Saved Items
             </button>
             <button 
                onClick={() => setActiveTab("reviews")}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${
                   activeTab === 'reviews' 
                   ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 shadow-sm" 
                   : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
             >
                <MessageSquare className="w-4 h-4" /> My Reviews
             </button>
             <div className="h-px bg-slate-50 dark:bg-slate-800 my-4 mx-4"></div>
             <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-black text-[10px] uppercase tracking-widest"
             >
                <LogOut className="w-4 h-4" /> Sign Out
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
           {activeTab === 'listings' && (
             <>
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                     <h1 className="text-4xl font-black tracking-tight">Manage <span className="text-primary italic">Listings</span></h1>
                     <p className="text-slate-500 dark:text-slate-400 font-medium">Track your items and performance.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {listingsLoading ? (
                     [1, 2, 3].map(i => <div key={i} className="card h-40 bg-slate-50 dark:bg-slate-800 animate-pulse border-none"></div>)
                  ) : listings.length > 0 ? (
                     listings.map(item => (
                        <Link key={item.id} href={`/items/${item.id}`} className="card group overflow-hidden border-slate-100 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/40 transition-all">
                           <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                              {item.images?.[0] ? (
                                 <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700 font-black">UoE</div>
                              )}
                              <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm ${
                                 item.status === 'approved' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                              }`}>
                                 {item.status}
                              </div>
                           </div>
                           
                           <div className="p-5 space-y-4">
                              <div>
                                 <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate mb-1">{item.title}</h3>
                                 <div className="text-primary font-black text-lg">KES {item.price.toLocaleString()}</div>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                                 <div className="flex items-center gap-1">
                                    <button 
                                       onClick={(e) => toggleStatus(item.id, item.status, e)}
                                       className={`p-2 rounded-lg transition-colors ${item.status === 'sold' ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-green-600"}`}
                                       title="Mark as Sold"
                                    >
                                       <CheckCircle className="w-4 h-4" />
                                    </button>
                                 </div>
                                 <button 
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-lg"
                                    title="Delete Listing"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        </Link>
                     ))
                  ) : (
                    <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
                       <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No active listings yet</h3>
                       <p className="text-slate-500 dark:text-slate-400 max-w-xs">You haven't listed any items for sale.</p>
                       <Link href="/sell" className="text-primary font-bold hover:underline">List your first item &rarr;</Link>
                    </div>
                  )}
               </div>
             </>
           )}

           {activeTab === 'saved' && (
             <>
               <div className="mb-8">
                  <h1 className="text-4xl font-black tracking-tight">Saved <span className="text-error italic">Items</span></h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Things you're keeping an eye on.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {favorites.length > 0 ? (
                    favorites.map(item => (
                      <ListingCard key={item.id} item={{ ...item, id: item.listingId }} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
                       <Heart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your wishlist is empty</h3>
                       <p className="text-slate-500 dark:text-slate-400 max-w-xs">Love an item? Click the heart icon to save it here.</p>
                       <Link href="/browse" className="text-primary font-bold hover:underline">Start Browsing &rarr;</Link>
                    </div>
                  )}
               </div>
             </>
           )}

           {activeTab === 'reviews' && (
             <>
               <div className="mb-8">
                  <h1 className="text-4xl font-black tracking-tight">My <span className="text-amber-500 italic">Reviews</span></h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Feedback from your campus trading partners.</p>
               </div>

               <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="card border-slate-100 dark:border-slate-800">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-slate-400" />
                               </div>
                               <div>
                                  <div className="font-bold">{review.reviewerName || "Verified Student"}</div>
                                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Purchased {review.itemName}</div>
                               </div>
                            </div>
                            <div className="flex gap-0.5">
                               {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"}`} />
                               ))}
                            </div>
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{review.comment}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
                       <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                       <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No reviews yet</h3>
                       <p className="text-slate-500 dark:text-slate-400 max-w-xs">Feedback will appear here once you complete trades with other students.</p>
                    </div>
                  )}
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
}
