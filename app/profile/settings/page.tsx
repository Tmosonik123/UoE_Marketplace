"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  MapPin, 
  Camera, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle,
  X,
  UploadCloud
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const CAMPUSES = ["Main Campus", "Annex Campus", "Town Campus"];

export default function SettingsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Main Campus");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (userData) {
      setName(userData.name || "");
      setLocation(userData.location || "Main Campus");
      setImagePreview(userData.photoURL || null);
    }
  }, [user, userData, authLoading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSuccess(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      let photoURL = userData?.photoURL || "";

      // 1. Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `avatars/${user.uid}/profile_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // 2. Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        name,
        location,
        photoURL,
        updatedAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return (
    <div className="container min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="container py-10 animate-fade-in max-w-2xl">
      <Link 
        href="/profile" 
        className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-8 font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 border-none">Account <span className="text-primary italic">Settings</span></h1>
          <p className="text-slate-500 font-medium mt-2">Update your profile information and campus location.</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl flex items-center gap-3 animate-slide-up">
            <Check className="w-5 h-5" />
            <span className="text-sm font-bold">Profile updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Profile Picture Upload */}
          <div className="card p-8 flex flex-col items-center gap-6 border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400"></div>
            
            <div className="relative">
               <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-slate-50 flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
               </div>
               <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
               >
                  <Camera className="w-5 h-5" />
               </button>
            </div>
            
            <div className="text-center">
               <h3 className="font-bold">Profile Avatar</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">PNG, JPG up to 2MB</p>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Personal Details */}
          <div className="card p-8 space-y-6 border-slate-100 shadow-sm">
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                <div className="relative">
                   <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-12 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                      required
                   />
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Campus</label>
                <div className="relative">
                   <select 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-12 focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none"
                      required
                   >
                      {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                </div>
             </div>
          </div>

          <button 
             type="submit" 
             disabled={saving}
             className="btn-primary w-full py-5 rounded-2xl justify-center text-xs uppercase tracking-widest font-black shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
               <span className="flex items-center gap-2">
                 <Save className="w-4 h-4" /> Save All Changes
               </span>
             )}
          </button>
        </form>
      </div>
    </div>
  );
}
