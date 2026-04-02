"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Tag, MapPin, ClipboardList, Package, ArrowRight, Save, Loader2, AlertCircle, X, PlusCircle, Image as ImageIcon } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

const CATEGORIES = ["Textbooks", "Electronics", "Furniture", "Clothing", "Services", "Hostels", "Other"];
const CONDITIONS = ["New", "Like New", "Excellent", "Good", "Used"];

export default function CreateListingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  
  // Media State
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...images, ...newFiles].slice(0, 5); // Limit 5
      setImages(updatedFiles);

      const newPreviews = updatedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const removeImage = (index: number) => {
    const updatedFiles = images.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setImages(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Upload Images to Storage
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const storageRef = ref(storage, `listings/${auth.currentUser!.uid}/${fileName}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      // 2. Create Firestore Document
      const docRef = await addDoc(collection(db, "listings"), {
        title,
        price: Number(price),
        category,
        condition,
        location,
        description,
        sellerUid: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName,
        createdAt: serverTimestamp(),
        status: "pending", // For admin moderation
        images: imageUrls,
      });

      router.push(`/items/${docRef.id}`);
    } catch (err: any) {
      setError("Failed to create listing. Please check your data or Firebase config.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">List an <span className="text-primary italic">Item</span></h1>
          <p className="text-slate-500 font-medium">Ready to sell? Describe your item and reach fellow students.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card shadow-sm border-slate-100 p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Basic Information
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Item Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. MacBook Air M1, Calculus Textbook..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Price (KES)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-lg"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Description</label>
              <textarea 
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item's condition, features, and why you're selling it..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="card shadow-sm border-slate-100 p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-primary" /> Location & Condition
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Item Condition</label>
                <select 
                   value={condition}
                   onChange={(e) => setCondition(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                   required
                >
                  <option value="">Select Condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Pickup Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Campus Library, Hostel D..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Media Upload & Summary */}
        <div className="space-y-6">
          <div className="card shadow-sm border-slate-100 p-8">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Camera className="w-5 h-5 text-primary" /> Photos
            </h3>
            
            <div className="space-y-4">
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              
              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                     <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all"
                     >
                       <PlusCircle className="w-6 h-6" />
                     </button>
                  )}
                </div>
              )}

              {previews.length === 0 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:border-primary transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-bold text-slate-600">Click to upload photos</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest leading-tight">Add up to 5 clear photos of your item</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary text-white card p-8 space-y-6 shadow-xl shadow-indigo-100 border-none relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <h4 className="text-lg font-black uppercase tracking-widest opacity-80">Ready to post?</h4>
            <ul className="space-y-3 text-sm font-medium text-white/90">
              <li className="flex items-center gap-2"><Tag className="w-4 h-4" /> Reach thousands of students</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Secured real-time chat</li>
              <li className="flex items-center gap-2"><Save className="w-4 h-4" /> Save drafts anytime</li>
            </ul>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-primary py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all mt-4 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Listing"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
