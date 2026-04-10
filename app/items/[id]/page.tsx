"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  MessageCircle, 
  Heart, 
  Share2, 
  ArrowLeft, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  Loader2,
  Star,
  X,
  XCircle
} from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch logic - Completely wired to Firestore
  useEffect(() => {
    const fetchItemAndSeller = async () => {
      try {
        const docRef = doc(db, "listings", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const itemData: any = { id: docSnap.id, ...docSnap.data() };
          setItem(itemData);
          
          // Fetch Seller details
          if (itemData.sellerUid) {
            const sellerRef = doc(db, "users", itemData.sellerUid);
            const sellerSnap = await getDoc(sellerRef);
            
            // Fetch Seller ratings
            const ratingsRef = collection(db, "ratings");
            const qRatings = query(ratingsRef, where("targetUid", "==", itemData.sellerUid));
            const ratingsSnap = await getDocs(qRatings);
            
            // Fetch Seller active ads real-time
            const listingsRef = collection(db, "listings");
            const qActive = query(listingsRef, where("sellerUid", "==", itemData.sellerUid), where("status", "==", "approved"));
            const activeSnap = await getDocs(qActive);

            let avgRating = 0;
            if (!ratingsSnap.empty) {
              const total = ratingsSnap.docs.reduce((acc, d) => acc + (d.data().rating || 0), 0);
              avgRating = total / ratingsSnap.size;
            }

            if (sellerSnap.exists()) {
              setSeller({
                ...sellerSnap.data(),
                calculatedRating: avgRating,
                reviewCount: ratingsSnap.size,
                activeAdsCount: activeSnap.size
              });
            }
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemAndSeller();
  }, [id]);

  const handleStartChat = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.uid === item.sellerUid) {
      alert("This is your own listing!");
      return;
    }

    setActionLoading(true);
    try {
      // Check if a chat already exists for this item between these two users
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef, 
        where("itemId", "==", item.id),
        where("participants", "array-contains", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let chatId = null;

      // Filter for the specific seller in the participants array
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(item.sellerUid)) {
          chatId = doc.id;
        }
      });

      if (!chatId) {
        // Create new chat
        const newChatDoc = await addDoc(collection(db, "chats"), {
          participants: [user.uid, item.sellerUid],
          participantNames: {
            [user.uid]: user.displayName || "Buyer",
            [item.sellerUid]: item.sellerName || "Seller"
          },
          itemId: item.id,
          itemTitle: item.title,
          updatedAt: serverTimestamp(),
          lastMessage: {
            text: "Started a conversation",
            senderUid: user.uid,
            createdAt: serverTimestamp()
          }
        });
        chatId = newChatDoc.id;
      }

      router.push(`/messages?chatId=${chatId}`);
    } catch (err) {
      console.error("Chat init error:", err);
      alert("Failed to start chat.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    if (!reportReason.trim()) return;

    setReportLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        itemId: item.id,
        itemTitle: item.title,
        sellerUid: item.sellerUid,
        reporterUid: user.uid,
        reason: reportReason,
        status: "pending",
        createdAt: serverTimestamp()
      });
      alert("Report submitted. Our moderation team will review it shortly.");
      setIsReportModalOpen(false);
      setReportReason("");
    } catch (err) {
      console.error("Report error:", err);
      alert("Failed to submit report.");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return (
     <div className="container py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching listing...</p>
     </div>
  );

  if (!item) return (
    <div className="container py-20 text-center animate-fade-in">
       <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Info className="w-10 h-10 text-slate-400" />
       </div>
       <h1 className="text-2xl font-bold">Item not found</h1>
       <p className="text-slate-500 mt-2 mb-8">The listing you're looking for might have been sold or removed.</p>
       <Link href="/browse" className="btn-primary">Browse Marketplace</Link>
    </div>
  );

  return (
    <div className="container py-6 md:py-10 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary transition-all text-slate-500">
            <Heart className="w-5 h-5" />
          </button>
          <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary transition-all text-slate-500">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left Column: Media Gallery */}
        <div className="lg:col-span-3 space-y-6">
          <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 relative group shadow-sm">
             {item.images && item.images.length > 0 ? (
                <img src={item.images[activeImage]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-700 font-black text-6xl">UoE</div>
             )}
             <div className="absolute bottom-6 left-6 flex gap-2">
                <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black shadow-lg border border-slate-100 dark:border-slate-700 uppercase tracking-widest text-primary">
                   {item.condition}
                </span>
             </div>
          </div>
          
          {item.images && item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {item.images.map((img: string, idx: number) => (
                <div key={idx} onClick={() => setActiveImage(idx)} className={`aspect-square rounded-2xl border cursor-pointer transition-all overflow-hidden ${activeImage === idx ? 'border-primary ring-2 ring-primary/10' : 'border-slate-50 dark:border-slate-800 opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="card border-slate-100 dark:border-slate-800 mt-10">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        {/* Right Column: Pricing & Interaction */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2">
                <span className="badge badge-secondary">{item.category}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-bold">
                   <Calendar className="w-3.5 h-3.5" /> Posted Recently
                </span>
             </div>
             <h1 className="text-3xl font-extrabold tracking-tight dark:text-slate-100">{item.title}</h1>
             <div className="text-4xl font-black text-primary">KES {item.price.toLocaleString()}</div>
             <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <MapPin className="w-4 h-4 text-primary" /> {item.location}
             </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
             {item.status === 'sold' ? (
               <div className="w-full py-4 text-center bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                  <XCircle className="w-5 h-5" /> This item has been sold
               </div>
             ) : (
               <button onClick={handleStartChat} disabled={actionLoading} className="btn-primary w-full py-4 text-base justify-center shadow-xl shadow-indigo-100 dark:shadow-none font-black uppercase tracking-widest text-xs disabled:opacity-70">
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageCircle className="w-5 h-5 mr-2" /> Start Real-time Chat</>}
               </button>
             )}
             <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 text-amber-700 dark:text-amber-500 p-4 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                   <span className="font-extrabold uppercase tracking-widest block mb-1">Safety Tip</span>
                   Meet in safe, public places and never pay in advance!
                </div>
             </div>
          </div>

          {/* Seller Card */}
          <div className="card shadow-md border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-6">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                   {seller?.photoURL ? <img src={seller.photoURL} alt="Seller" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-slate-400" />}
                </div>
                <div>
                   <Link href={`/profile/${item.sellerUid}`} className="font-extrabold text-lg hover:text-primary transition-colors cursor-pointer dark:text-slate-100">
                      {seller?.name || item.sellerName || "Anonymous Seller"}
                   </Link>
                   <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">
                      <Star className={`w-2.5 h-2.5 ${seller?.calculatedRating > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} /> 
                      {seller?.calculatedRating > 0 ? `${seller.calculatedRating.toFixed(1)} Rating` : 'No reviews'} &bull; {seller?.isVerified ? 'Verified Student' : 'Student'}
                   </div>
                </div>
                <Link href={`/profile/${item.sellerUid}`} className="ml-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-primary transition-all">
                   <ChevronRight className="w-5 h-5" />
                </Link>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                   <span className="block text-xl font-black dark:text-slate-100">{seller?.activeAdsCount || 0}</span>
                   <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Ads</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                   <span className="block text-xl font-black dark:text-slate-100">
                     {seller?.createdAt ? (
                       typeof seller.createdAt === 'string' 
                         ? new Date(seller.createdAt).getFullYear() 
                         : (seller.createdAt as any).toDate?.() 
                           ? (seller.createdAt as any).toDate().getFullYear() 
                           : '2024'
                     ) : '2024'}
                   </span>
                   <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Member Since</span>
                </div>
             </div>
          </div>

          <button onClick={() => setIsReportModalOpen(true)} className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-error transition-colors text-xs font-bold uppercase tracking-widest">
             <AlertTriangle className="w-4 h-4" /> Report this listing
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button onClick={() => setIsReportModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                 <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black tracking-tight mb-2">Report <span className="text-error italic">Listing</span></h2>
              <p className="text-slate-500 text-sm mb-6">Tell us why this listing should be reviewed by our moderation team.</p>
              
              <form onSubmit={handleReport} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reason for reporting</label>
                    <textarea 
                       required
                       value={reportReason}
                       onChange={(e) => setReportReason(e.target.value)}
                       placeholder="e.g. Inappropriate content, Scam, Misleading price..."
                       className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-error outline-none min-h-[120px]"
                    />
                 </div>
                 <button 
                    type="submit" 
                    disabled={reportLoading}
                    className="w-full bg-error text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-100 dark:shadow-none flex items-center justify-center"
                 >
                    {reportLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Report"}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
