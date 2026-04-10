"use client";

import { Lock, Eye, Database, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  const policies = [
    {
      title: "Data Collection",
      content: "We collect basic profile information (name, university email, campus location) to facilitate secure trading between students. Profile photos and listings are uploaded voluntarily.",
      icon: Database
    },
    {
      title: "Visibility",
      content: "Your contact details (phone/email) are NOT displayed publicly on listings. They are only shared when you explicitly initiate or accept a chat with another user.",
      icon: Eye
    },
    {
      title: "Security",
      content: "Your authentication data is securely handled by Firebase (Google). We employ modern encryption standards to protect your private messages and personal information.",
      icon: Lock
    }
  ];

  return (
    <div className="container py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Privacy <span className="text-emerald-500">Policy</span></h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Trust and Transparency</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-16">
          {policies.map((policy, i) => (
            <div key={i} className="card p-8 md:p-10 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 items-start hover:border-emerald-500/30 transition-all">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 flex-shrink-0">
                <policy.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">{policy.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {policy.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 md:p-12 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] text-center">
          <h2 className="text-2xl font-black mb-4">Questions about your data?</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto mb-0">
            If you have any concerns regarding how your information is handled, or if you would like to request data deletion, please contact the UoE Marketplace administrative team via the support channels.
          </p>
        </div>
      </div>
    </div>
  );
}
