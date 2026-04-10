"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Send, User, MapPin, MoreHorizontal, MessageSquare, ArrowLeft, Loader2, Package, Star, Trash2, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment, writeBatch, arrayRemove } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

// Cache user names to prevent massive N+1 query overhead in realtime listeners
const userNamesCache: Record<string, string> = {};

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("chatId");
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null); 
  const [messages, setMessages] = useState<any[]>([]);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const scrollContainerRef = useRef<null | HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  // Track which chats we've cleared unread for this session to avoid cascading writes
  const clearedChatsRef = useRef<Set<string>>(new Set());

  // 1. Fetch user's active chats in real-time
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = snapshot.docs.map((chatDoc) => {
        const data = chatDoc.data() as any;
        
        // Skip if current user has hidden this chat
        if (data.hiddenBy?.includes(user?.uid)) return null;

        const participants = data.participants || [];
        const otherUid = participants.find((id: string) => id !== user?.uid);
        
        // Use cache if available, otherwise placeholder. Fetch happens async.
        let otherName = otherUid && userNamesCache[otherUid] ? userNamesCache[otherUid] : "UoE Student";

        let formattedTime = "Just now";
        try {
          if (data.updatedAt && typeof data.updatedAt.toDate === "function") {
            formattedTime = new Intl.DateTimeFormat('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }).format(data.updatedAt.toDate());
          }
        } catch (err) {
          console.warn("[onSnapshot Inbox] timestamp format error:", err);
        }

        return {
          id: chatDoc.id,
          ...data,
          otherUid, // Store this for async fetch later
          otherName,
          timestamp: formattedTime
        };
      });

      // Filter out nulls and sort
      let filtered = chatList.filter(c => c !== null).sort((a: any, b: any) => {
        const dateA = a.updatedAt?.seconds || 0;
        const dateB = b.updatedAt?.seconds || 0;
        return dateB - dateA;
      });

      setChats(filtered as any[]);
      setLoading(false);

      // Async fetch missing names to update state WITHOUT blocking initial render
      filtered.forEach(async (chat) => {
         if (chat.otherUid && !userNamesCache[chat.otherUid]) {
            // Instantly mark as fetching so duplicate chats with this user don't fire parallel requests
            userNamesCache[chat.otherUid] = "Loading...";
            
            try {
               const userDoc = await getDoc(doc(db, "users", chat.otherUid));
               const name = userDoc.exists() ? userDoc.data().name : "Unknown User";
               userNamesCache[chat.otherUid] = name;
                  
               // Trigger re-render with new name for ALL chats involving this user
               setChats(currentChats => currentChats.map(c => 
                  c.otherUid === chat.otherUid ? { ...c, otherName: name } : c
               ));
            } catch (e) {
               console.error("Failed to fetch user name:", e);
               userNamesCache[chat.otherUid] = "Unknown User"; // Prevent infinite retry loops
            }
         }
      });
      
      const parsedUrlChatId = new URLSearchParams(window.location.search).get("chatId");
      setSelectedChat(currentSelected => {
         // Only force the URL chat to open if we haven't selected anything yet!
         if (parsedUrlChatId && !currentSelected) {
            const chatToSelect = filtered.find(c => c?.id === parsedUrlChatId);
            return chatToSelect || null;
         }
         // Otherwise, preserve the current chat selection silently when updates arrive!
         if (currentSelected) {
            const updatedCurrentChat = filtered.find(c => c?.id === currentSelected.id);
            return updatedCurrentChat || currentSelected;
         }
         return null;
      });
      
    }, (err) => {
      console.error("[onSnapshot Inbox Chats] error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [urlChatId, user]);

  // 2. Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    
    // Reset initial load flag when switching chats
    isInitialLoadRef.current = true;
    
    const q = query(
      collection(db, "chats", selectedChat.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(msgDoc => {
        const data = msgDoc.data();
        let formattedTime = "Just now";
        
        try {
          if (data.createdAt && typeof data.createdAt.toDate === "function") {
            formattedTime = new Intl.DateTimeFormat('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }).format(data.createdAt.toDate());
          }
        } catch (err) {
          console.warn("[onSnapshot] timestamp format error:", err);
        }

        return {
          id: msgDoc.id,
          ...data,
          timestamp: formattedTime
        };
      });

      // replace all messages
      setMessages(msgList);
      
      // Determine if we should scroll
      const container = scrollContainerRef.current;
      if (container) {
         // If initial load, jump regardless. If new messages, only jump if near bottom.
         const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
         const shouldScroll = isInitialLoadRef.current || isNearBottom;
         
         if (shouldScroll) {
            // Short delay to ensure DOM has rendered new messages
            setTimeout(() => {
              scrollToBottom(isInitialLoadRef.current ? "auto" : "smooth");
              isInitialLoadRef.current = false;
            }, 10);
         } else {
            isInitialLoadRef.current = false;
         }
      }
    }, (err) => {
      console.error("[onSnapshot Chat Messages] error:", err);
    });
    
    return () => unsubscribe();
  }, [selectedChat?.id]);

  // 3. Clear unread count ONCE when a chat is first opened (not on every message update)
  // Using a ref to track cleared chats prevents the cascading write loop:
  // new message → unreadCount++ → effect fires → clears → listener fires again → repeat
  useEffect(() => {
    if (!selectedChat?.id || !user) return;
    const currentUid = user.uid;
    const chatId = selectedChat.id;
    
    // Only clear once per chat per session
    if (clearedChatsRef.current.has(chatId)) return;
    
    const unreadCount = selectedChat.unreadCount?.[currentUid] || 0;
    if (unreadCount <= 0) return;

    // Mark as cleared immediately to prevent duplicate calls
    clearedChatsRef.current.add(chatId);
    
    const chatRef = doc(db, "chats", chatId);
    updateDoc(chatRef, {
      [`unreadCount.${currentUid}`]: 0
    }).catch(err => {
      console.warn("[clearUnread] error:", err);
      // Remove from cleared set on failure so it can retry next time
      clearedChatsRef.current.delete(chatId);
    });
  }, [selectedChat?.id, user]);
  // Note: intentionally NOT depending on selectedChat.unreadCount to avoid re-triggering

  // 3. Fetch item status for rating prompt
  useEffect(() => {
     if (!selectedChat?.itemId) return;
     const fetchItem = async () => {
        const itemSnap = await getDoc(doc(db, "listings", selectedChat.itemId));
        if (itemSnap.exists()) {
           setSelectedItem({ id: itemSnap.id, ...itemSnap.data() });
        }
     };
     fetchItem();
  }, [selectedChat?.itemId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;
    
    // Check if item is sold and user is restricted
    if (selectedItem?.status === 'sold') {
      const isBuyer = selectedItem.buyerUid === user.uid;
      if (!isBuyer || selectedItem.isRated) {
        alert("Messaging is closed for this sold item.");
        return;
      }
    }
    
    const text = newMessage.trim();
    const currentUserUid = user.uid;
    const otherUid = selectedChat.participants?.find((id: string) => id !== currentUserUid);
    const participants = selectedChat.participants || [currentUserUid, otherUid].filter(Boolean);

    // OPTIMISTIC UPDATE: Show message instantly for sender
    const optimisticId = `optimistic-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: optimisticId,
      text,
      senderUid: currentUserUid,
      participants,
      timestamp: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
    }]);
    setNewMessage("");
    scrollToBottom();

    const chatRef = doc(db, "chats", selectedChat.id);
    const messagesRef = collection(db, "chats", selectedChat.id, "messages");

    // CAUSAL ORDER: Write message first, then update chat metadata in .then()
    // This ensures the recipient's inbox never pings before the message document exists.
    // Without this, two parallel writes could leave recipient clicking an empty thread.
    addDoc(messagesRef, {
      text,
      senderUid: currentUserUid,
      participants, // stored for fast Firestore rule checks
      createdAt: serverTimestamp()
    })
    .then(() => {
      // Only update inbox metadata AFTER message is committed to the server
      return updateDoc(chatRef, {
        lastMessage: { text, senderUid: currentUserUid, createdAt: serverTimestamp() },
        updatedAt: serverTimestamp(),
        [`hiddenBy`]: arrayRemove(currentUserUid),
        ...(otherUid ? { [`unreadCount.${otherUid}`]: increment(1) } : {})
      });
    })
    .catch(err => {
      console.error("Send failed:", err);
      // Remove optimistic message so user knows to retry
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    });

    scrollToBottom();
  };

  const handleDeleteChat = async () => {
    if (!selectedChat || !user) return;
    
    if (confirm("Hide this conversation? It will reappear if you receive a new message.")) {
      const chatRef = doc(db, "chats", selectedChat.id);
      
      try {
        const currentHidden = selectedChat.hiddenBy || [];
        await updateDoc(chatRef, {
          hiddenBy: [...currentHidden, user.uid]
        });
        setSelectedChat(null);
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  return (
    <div className="container h-[calc(100vh-140px)] flex gap-6 animate-fade-in py-6">
      {/* Sidebar: Chat List */}
      <aside className={`w-full lg:w-96 flex flex-col gap-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 ${selectedChat ? "hidden lg:flex" : "flex"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Inbox</h2>
          <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
             <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-12 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full opacity-50">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Loading Chats</span>
             </div>
          ) : chats.length > 0 ? (
            chats.map(chat => (
              <button 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 rounded-2xl flex items-center gap-4 transition-all text-left group ${selectedChat?.id === chat.id ? "bg-indigo-50 border-primary" : "hover:bg-slate-50 border-transparent"} border`}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                   <User className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                     <h4 className={`font-bold truncate text-sm ${selectedChat?.id === chat.id ? "text-primary" : "text-slate-800"}`}>{chat.otherName}</h4>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{chat.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mb-1 italic opacity-80">Re: {chat.itemTitle}</p>
                  <p className="text-xs text-slate-400 truncate">{chat.lastMessage?.text}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center px-4">
              <Package className="w-10 h-10 mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest leading-loose">No active conversations.<br/>Contact a seller to start.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main: Message Window */}
      <main className={`flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${!selectedChat ? "hidden lg:flex items-center justify-center bg-slate-50/50" : "flex"}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between glass z-10">
               <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedChat(null)} className="lg:hidden p-2 -ml-2 text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-none">{selectedChat.otherName}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                       <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Package className="w-3 h-3" /> {selectedChat.itemTitle}
                       </span>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDeleteChat}
                    className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all group"
                    title="Delete Conversation"
                  >
                     <MoreHorizontal className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                  </button>
               </div>
            </div>

            {/* Rating Prompt for Buyer if Item is Sold */}
            {selectedItem?.status === 'sold' && selectedItem?.buyerUid === auth.currentUser?.uid && !selectedItem?.isRated && (
               <div className="mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">Transaction Complete!</h4>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">How was your experience with {selectedChat.otherName}?</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => setIsRatingModalOpen(true)}
                     className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-100 dark:shadow-none"
                  >
                     Rate Seller
                  </button>
               </div>
            )}

            {/* Chat Messages Area */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-8 flex flex-col gap-6"
            >
              <div className="text-center py-6">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-100/50 px-4 py-1.5 rounded-full">
                    Safe zone chat enabled
                 </span>
              </div>
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderUid === user?.uid ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`max-w-[75%] px-5 py-3.5 rounded-2xl shadow-sm leading-relaxed text-sm ${
                    msg.senderUid === user?.uid 
                      ? "bg-primary text-white rounded-br-none" 
                      : "bg-slate-100 text-slate-700 rounded-bl-none"
                  }`}>
                    {msg.text}
                    <div className={`text-[10px] mt-1.5 font-bold ${msg.senderUid === user?.uid ? "text-indigo-100 text-right" : "text-slate-400"}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
               {selectedItem?.status === 'sold' && (selectedItem.buyerUid !== user?.uid || selectedItem.isRated) ? (
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                     <Package className="w-5 h-5 text-slate-300 mb-2" />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {selectedItem.isRated ? "Transaction Completed & Rated" : "This item has been sold"}
                     </p>
                     <p className="text-[10px] text-slate-400 font-medium mt-1">Chat is now read-only</p>
                  </div>
               ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-white p-2 pl-6 rounded-2xl shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                     <input 
                       type="text" 
                       placeholder="Type your message here..." 
                       value={newMessage}
                       onChange={(e) => setNewMessage(e.target.value)}
                       className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                     />
                     <button 
                       type="submit" 
                       disabled={sending || !newMessage.trim()}
                       className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-hover shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all font-bold"
                     >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 ml-0.5" />}
                     </button>
                  </form>
               )}
               <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                  Never share sensitive info like passwords in chat
               </p>
            </div>
          </>
        ) : (
          <div className="text-center p-12 flex flex-col items-center gap-6 animate-fade-in">
             <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-50 border border-slate-100 mb-4 animate-bounce duration-[3000ms]">
                <MessageSquare className="w-12 h-12 text-primary/20" />
             </div>
             <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800">Your Conversations</h2>
                <p className="text-slate-500 max-w-sm mt-3 font-medium leading-relaxed">Select a message from the left to start chatting with buyers or sellers on campus.</p>
             </div>
             <Link href="/browse" className="btn-primary py-3 px-8 text-xs uppercase tracking-widest font-black shadow-lg shadow-indigo-100">
                Continue Browsing
             </Link>
          </div>
        )}
      </main>
      {/* Rating Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
              <button 
                onClick={() => setIsRatingModalOpen(false)} 
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                 <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-black tracking-tight mb-2">Rate <span className="text-amber-500 italic">Seller</span></h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">How was your transaction for "{selectedChat.itemTitle}"?</p>
              
              <div className="space-y-6">
                 <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rating</span>
                    <div className="flex gap-2">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setRating(star)}
                            className="transition-all hover:scale-125"
                          >
                             <Star className={`w-10 h-10 ${star <= rating ? "text-amber-500 fill-amber-500" : "text-slate-100 dark:text-slate-800"}`} />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Write a short review</label>
                    <textarea 
                       value={ratingComment}
                       onChange={(e) => setRatingComment(e.target.value)}
                       placeholder="e.g. Great seller, fast response, item as described!"
                       className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[100px]"
                    />
                 </div>

                 <button 
                    onClick={async () => {
                       if (!auth.currentUser || !selectedChat) return;
                       setRatingLoading(true);
                       try {
                          // 1. Create rating doc
                          const sellerUid = selectedChat.participants.find((id: string) => id !== auth.currentUser?.uid);
                          await addDoc(collection(db, "ratings"), {
                             targetUid: sellerUid,
                             reviewerUid: auth.currentUser.uid,
                             reviewerName: auth.currentUser.displayName || "Verified Student",
                             rating,
                             comment: ratingComment,
                             itemId: selectedChat.itemId,
                             itemName: selectedChat.itemTitle,
                             createdAt: serverTimestamp()
                          });

                          // 2. Mark item as rated
                          await updateDoc(doc(db, "listings", selectedChat.itemId), {
                             isRated: true
                          });

                          alert("Thanks for your feedback!");
                          setIsRatingModalOpen(false);
                          setSelectedItem((prev: any) => ({ ...prev, isRated: true }));
                       } catch (err) {
                          console.error("Rating error:", err);
                       } finally {
                          setRatingLoading(false);
                       }
                    }}
                    disabled={ratingLoading}
                    className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] shadow-xl transition-all flex items-center justify-center gap-2"
                 >
                    {ratingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Review"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="container h-[calc(100vh-140px)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
