"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  Package, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  ArrowUpRight,
  Loader2,
  MoreVertical,
  Trash2,
  UserX,
  Lock
} from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getCountFromServer, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AdminTab = "pending" | "reports" | "users" | "inventory";

export default function AdminPage() {
  const { user, userData, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [counts, setCounts] = useState({ users: 0, items: 0, activeItems: 0, chats: 0, reports: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState("7"); // Default 7 days
  const [userPage, setUserPage] = useState(0); 
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    // 1. Guard: Only run listeners if authenticated AND admin
    if (authLoading) return;
    if (!user || !isAdmin) {
       // Non-admins shouldn't be here
       return;
    }

    // 1. Fetch Real-time Counts
    const fetchCounts = async () => {
      try {
        const uSnapshot = await getCountFromServer(collection(db, "users"));
        const iSnapshot = await getCountFromServer(collection(db, "listings"));
        const activeSnapshot = await getCountFromServer(query(collection(db, "listings"), where("status", "==", "approved")));
        const cSnapshot = await getCountFromServer(collection(db, "chats"));
        const rSnapshot = await getCountFromServer(query(collection(db, "reports"), where("status", "==", "pending")));
        
        setCounts({
          users: uSnapshot.data().count,
          items: iSnapshot.data().count,
          activeItems: activeSnapshot.data().count,
          chats: cSnapshot.data().count,
          reports: rSnapshot.data().count
        });
      } catch (err) {
        console.error("Count fetch error:", err);
      }
    };
    fetchCounts();

    // 2. Listen to Pending Listings
    const qPending = query(collection(db, "listings"), where("status", "==", "pending"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error("[onSnapshot Admin Pending Listings] error:", err);
    });

    // 3. Listen to Reports
    const qReports = query(collection(db, "reports"), where("status", "==", "pending"));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("[onSnapshot Admin Reports] error:", err);
    });

    // 4. Listen to All Users (Limit 50 for performance)
    const qUsers = query(collection(db, "users"), limit(50));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
       setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
       console.error("[onSnapshot Admin Users] error:", err);
    });

    // 5. Listen to All Listings
    const qAllListings = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(100));
    const unsubAllListings = onSnapshot(qAllListings, (snapshot) => {
       setAllListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
       console.error("[onSnapshot Admin Inventory] error:", err);
    });

    return () => {
      unsubPending();
      unsubReports();
      unsubUsers();
      unsubAllListings();
    };
  }, [user, isAdmin, authLoading]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "listings", id), { status: "approved" });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject and delete this listing?")) return;
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, "listings", id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setActionLoading(reportId);
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "dismissed" });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReportedItem = async (reportId: string, itemId: string) => {
    if (!confirm("Delete the reported item and close report?")) return;
    setActionLoading(reportId);
    try {
      if (itemId) await deleteDoc(doc(db, "listings", itemId));
      await updateDoc(doc(db, "reports", reportId), { status: "resolved_deleted" });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveUser = async (user: any) => {
    setActionLoading(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), { isVerified: !user.isVerified });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId) return;
    setActionLoading(selectedUserId);
    try {
      const until = new Date();
      if (banDuration === "permanent") {
        until.setFullYear(until.getFullYear() + 100);
      } else {
        until.setDate(until.getDate() + parseInt(banDuration));
      }
      
      await updateDoc(doc(db, "users", selectedUserId), { 
        bannedUntil: until.toISOString(),
        isVerified: false
      });
      setIsBanModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), { bannedUntil: null });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveUser = async (userId: string) => {
    if (!confirm("Archive this user account? They will lose access to the platform.")) return;
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), { isArchived: true });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), { isArchived: false });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDeleteUser = async (userId: string) => {
    if (!confirm("PERMANENTLY delete this user profile? This action is irreversible.")) return;
    setActionLoading(userId);
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = u.isArchived === true;
    return matchesSearch && (showArchived ? isArchived : !isArchived);
  });

  const filteredInventory = allListings.filter(l => 
    l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.sellerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPending = pendingListings.filter(l => 
    l.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = reports.filter(r => 
    r.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Guard Rendering
  if (authLoading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Verifying Credentials...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mb-8">
           <Lock className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Access <span className="text-rose-500 italic">Denied</span></h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-10 font-medium">You don't have the administrative clearances required to access this terminal.</p>
        <Link href="/" className="btn-primary py-3 px-8 text-sm">Return to Marketplace</Link>
      </div>
    );
  }

  const stats = [
    { label: "Total Users", value: counts.users.toLocaleString(), icon: Users, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600", change: "+12%", tab: "users" as AdminTab },
    { label: "All Listings", value: counts.items.toLocaleString(), icon: Package, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600", change: "+8%", tab: "inventory" as AdminTab },
    { label: "Active Listings", value: counts.activeItems.toLocaleString(), icon: CheckCircle, color: "bg-green-50 dark:bg-green-900/20 text-green-600", change: counts.activeItems > 0 ? "Live" : "No Activity", tab: "inventory" as AdminTab },
    { label: "Pending Reports", value: counts.reports.toLocaleString(), icon: AlertCircle, color: "bg-rose-50 dark:bg-rose-900/20 text-rose-600", change: counts.reports > 0 ? "Action Required" : "All Clear", tab: "reports" as AdminTab },
  ];

  return (
    <div className="container py-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 mb-1.5 ml-1">
            <ShieldCheck className="w-4 h-4" /> Admin Terminal
          </div>
          <h1 className="text-4xl font-black tracking-tight">System <span className="text-primary">Moderation</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Protecting the UoE campus marketplace community.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
         {stats.map((stat, i) => (
            <button 
               key={i} 
               onClick={() => setActiveTab(stat.tab)}
               className={`card p-6 flex flex-col gap-4 border-slate-100 dark:border-slate-800 shadow-sm text-left transition-all hover:border-primary active:scale-95 ${activeTab === stat.tab ? "ring-2 ring-primary border-primary" : ""}`}
            >
               <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                     <stat.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${stat.change.includes('+') ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>
                     {stat.change}
                  </span>
               </div>
               <div>
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
               </div>
            </button>
         ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
         <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="flex flex-col gap-1">
               <button 
                  onClick={() => setActiveTab("pending")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === 'pending' ? "bg-primary text-white border-primary shadow-xl shadow-indigo-100 dark:shadow-none" : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}
               >
                  <Clock className="w-4 h-4" /> Approval Queue
                  {pendingListings.length > 0 && <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded text-[8px]">{pendingListings.length}</span>}
               </button>
               <button 
                  onClick={() => setActiveTab("reports")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === 'reports' ? "bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-100 dark:shadow-none" : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}
               >
                  <AlertCircle className="w-4 h-4" /> Reported Content
                  {reports.length > 0 && <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded text-[8px]">{reports.length}</span>}
               </button>
               <button 
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === 'users' ? "bg-indigo-500 text-white border-indigo-500 shadow-xl shadow-indigo-100 dark:shadow-none" : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}
               >
                  <Users className="w-4 h-4" /> User Directory
               </button>
               <button 
                  onClick={() => setActiveTab("inventory")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === 'inventory' ? "bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-100 dark:shadow-none" : "text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"}`}
               >
                  <Package className="w-4 h-4" /> Inventory
               </button>
            </div>
         </aside>

         <main className="flex-1">
            <div className="card shadow-sm border-slate-100 dark:border-slate-800 p-0 overflow-hidden">
               <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-800/10">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {activeTab === 'pending' && <Package className="w-5 h-5 text-primary" />}
            {activeTab === 'reports' && <AlertCircle className="w-5 h-5 text-rose-500" />}
            {activeTab === 'users' && <Users className="w-5 h-5 text-indigo-500" />}
            {activeTab === 'inventory' && <Package className="w-5 h-5 text-emerald-500" />}
            
            {activeTab === 'pending' && "Listing Approval Queue"}
            {activeTab === 'reports' && "System Reports"}
            {activeTab === 'users' && "User Directory"}
            {activeTab === 'inventory' && "Master Listing Inventory"}
          </h3>
                   <div className="flex items-center gap-3">
                      {activeTab === 'users' && (
                         <button 
                            onClick={() => setShowArchived(!showArchived)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showArchived ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary'}`}
                         >
                            {showArchived ? "View Active Users" : "View Archived"}
                         </button>
                      )}
                      <div className="relative">
                         <input 
                          type="text" 
                          placeholder={`Search ${activeTab}...`} 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl py-2 px-10 text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-primary" 
                        />
                         <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      </div>
                   </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                             {activeTab === 'pending' ? "Item Details" : activeTab === 'users' ? "User Profile" : "Details"}
                          </th>
                           <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                              {activeTab === 'pending' || activeTab === 'inventory' ? "Seller" : activeTab === 'users' ? "Contact / Activity" : "Reported By"}
                           </th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                             {activeTab === 'users' ? "Role" : "Category / Reason"}
                          </th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                       </tr>
                    </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                       {activeTab === 'pending' && filteredPending.map(listing => (
                          <tr key={listing.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                             <td className="p-6">
                                <div className="font-bold text-sm">{listing.title} <span className="text-primary font-black ml-1 text-xs">KES {listing.price?.toLocaleString()}</span></div>
                                <div className="text-[10px] font-black text-slate-400 uppercase mt-1">ID: {listing.id}</div>
                             </td>
                             <td className="p-6 text-sm font-medium">{listing.sellerName || "Anonymous"}</td>
                             <td className="p-6"><span className="badge badge-secondary">{listing.category}</span></td>
                             <td className="p-6">
                                <div className="flex items-center justify-end gap-2">
                                   <button onClick={() => handleReject(listing.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><XCircle className="w-4 h-4" /></button>
                                   <button onClick={() => handleApprove(listing.id)} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all"><CheckCircle className="w-4 h-4" /></button>
                                </div>
                             </td>
                          </tr>
                       ))}

                        {activeTab === 'reports' && filteredReports.map(report => (
                          <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                             <td className="p-6">
                                <Link href={`/items/${report.itemId}`} className="group">
                                   <div className="font-bold text-sm group-hover:text-primary transition-colors">Item: {report.itemTitle}</div>
                                   <div className="text-[10px] font-black text-rose-500 uppercase mt-1 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> Reported Content
                                   </div>
                                </Link>
                             </td>
                             <td className="p-6 text-sm font-medium">Citizen ID: {report.reporterUid?.slice(0, 6)}...</td>
                             <td className="p-6 text-xs text-slate-500 italic max-w-xs truncate">"{report.reason}"</td>
                             <td className="p-6">
                                 <div className="flex items-center justify-end gap-2">
                                    <Link href={`/items/${report.itemId}`} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-primary transition-all font-bold text-[10px] px-3">View Item</Link>
                                    <button onClick={() => handleDismissReport(report.id)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-200 transition-all font-bold text-[10px] px-3">Dismiss</button>
                                    <button onClick={() => handleDeleteReportedItem(report.id, report.itemId)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all font-bold text-[10px] px-3">Delete Item</button>
                                 </div>
                             </td>
                          </tr>
                       ))}

                        {activeTab === 'users' && filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-6">
                                 <div className="font-bold text-sm">{u.name}</div>
                                 <div className="text-[10px] font-black text-slate-400 uppercase mt-1">UID: {u.id?.slice(0, 8)}...</div>
                              </td>
                              <td className="p-6 text-sm font-medium">
                                 <div className="text-slate-600">{u.email}</div>
                                 <div className="text-[10px] text-slate-400 font-bold mt-1">
                                    Seen: {u.lastSeen ? new Date(u.lastSeen).toLocaleDateString() : 'Unknown'}
                                 </div>
                              </td>
                             <td className="p-6">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-100 text-slate-500'}`}>
                                   {u.role || 'Student'}
                                </span>
                             </td>
                              <td className="p-6 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    {showArchived ? (
                                      <>
                                        <button 
                                           onClick={() => handleRestoreUser(u.id)}
                                           className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all font-bold text-[10px] px-3"
                                        >
                                           Restore
                                        </button>
                                        <button 
                                           onClick={() => handlePermanentDeleteUser(u.id)}
                                           disabled={u.id === user.uid}
                                           className={`p-2 rounded-lg transition-all ml-2 ${u.id === user.uid ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                                           title={u.id === user.uid ? "Cannot delete yourself" : "Permanent Delete"}
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button 
                                           onClick={() => handleApproveUser(u)}
                                           disabled={u.id === user.uid}
                                           className={`p-2 rounded-lg transition-all ${u.id === user.uid ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : u.isVerified ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-green-50'}`}
                                           title={u.id === user.uid ? "Cannot verify yourself" : u.isVerified ? "Revoke Approval" : "Approve Student"}
                                        >
                                           <ShieldCheck className="w-4 h-4" />
                                        </button>
                                        {u.bannedUntil && new Date(u.bannedUntil) > new Date() ? (
                                           <button 
                                              onClick={() => handleUnbanUser(u.id)}
                                              disabled={u.id === user.uid}
                                              className={`p-2 rounded-lg transition-all ${u.id === user.uid ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                                              title={u.id === user.uid ? "Cannot unban yourself" : "Unban User"}
                                           >
                                              <Lock className="w-4 h-4" />
                                           </button>
                                        ) : (
                                           <button 
                                              onClick={() => { setSelectedUserId(u.id); setIsBanModalOpen(true); }}
                                              disabled={u.id === user.uid}
                                              className={`p-2 rounded-lg transition-all ${u.id === user.uid ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                                              title={u.id === user.uid ? "Cannot ban yourself" : "Ban User"}
                                           >
                                              <UserX className="w-4 h-4" />
                                           </button>
                                        )}
                                        <button 
                                           onClick={() => handleArchiveUser(u.id)}
                                           disabled={u.id === user.uid}
                                           className={`p-2 rounded-lg transition-all ${u.id === user.uid ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white'}`}
                                           title={u.id === user.uid ? "Cannot archive yourself" : "Archive User"}
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                 </div>
                              </td>
                          </tr>
                       ))}

                        {activeTab === 'inventory' && filteredInventory.map(listing => (
                          <tr key={listing.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                             <td className="p-6">
                                <div className="font-bold text-sm mb-0.5">{listing.title}</div>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-black text-primary uppercase tracking-widest">KES {listing.price?.toLocaleString()}</span>
                                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${listing.status === 'sold' ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-600'}`}>
                                      {listing.status}
                                   </span>
                                </div>
                             </td>
                             <td className="p-6 text-sm font-medium text-slate-600">{listing.sellerName || "Anonymous"}</td>
                             <td className="p-6 text-xs text-slate-400">
                                {listing.category}
                             </td>
                             <td className="p-6 text-right">
                                <Link href={`/items/${listing.id}`} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg hover:text-primary transition-all inline-block"><Eye className="w-4 h-4" /></Link>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                  </table>
                  
                  {((activeTab === 'pending' && pendingListings.length === 0) || (activeTab === 'reports' && reports.length === 0)) && (
                     <div className="py-24 text-center">
                        <CheckCircle className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">All Clear!</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">No pending active {activeTab === 'pending' ? "listings" : "reports"} in the system.</p>
                     </div>
                  )}
               </div>
            </div>
         </main>
       </div>

       {/* Ban Modal */}
       {isBanModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
                <h2 className="text-2xl font-black mb-1">Ban <span className="text-rose-500">User</span></h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Select horizontal suspension duration.</p>

                <div className="space-y-4">
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duration</label>
                      <select 
                        value={banDuration}
                        onChange={(e) => setBanDuration(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-rose-500 transition-all appearance-none"
                      >
                         <option value="1">24 Hours</option>
                         <option value="3">3 Days</option>
                         <option value="7">1 Week</option>
                         <option value="30">1 Month</option>
                         <option value="365">1 Year</option>
                         <option value="permanent">Permanent</option>
                      </select>
                   </div>

                   <div className="flex items-center gap-3 pt-4">
                      <button 
                        onClick={() => setIsBanModalOpen(false)}
                        className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleBanUser}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                      >
                        Apply Ban
                      </button>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
