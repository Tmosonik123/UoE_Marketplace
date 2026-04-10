"use client";

import { ShieldCheck, MessageSquare, MapPin, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SafetyPage() {
  const safetyTips = [
    {
      title: "Meet in Public",
      description: "Always meet on campus or in well-lit public places like the Student Center or the Library during daylight hours.",
      icon: MapPin,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Inspect the Item",
      description: "Take your time to thoroughly inspect the item before paying. Ensure electronics work and clothing fits correctly.",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      title: "Safe Payments",
      description: "Avoid wire transfers or prepaid cards. Cash or mobile money (M-Pesa) after inspection is the safest standard.",
      icon: CreditCard,
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      title: "Trust Your Gut",
      description: "If a deal seems too good to be true or a user is being pushy, it's better to walk away. Safety first, always.",
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-50"
    }
  ];

  return (
    <div className="container py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4">
            <ShieldCheck className="w-4 h-4" /> Safety First
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Your Security is Our <span className="text-primary">Priority</span></h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            UoE Marketplace is built on trust, but always stay vigilant. Follow these guidelines to ensure a safe and successful campus trade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {safetyTips.map((tip, i) => (
            <div key={i} className="card p-8 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all">
              <div className={`w-14 h-14 ${tip.bg} ${tip.color} rounded-2xl flex items-center justify-center mb-6`}>
                <tip.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{tip.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tip.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-black mb-4">Notice Something suspicious?</h2>
              <p className="text-slate-400 font-medium mb-8">
                Help us keep the UoE community safe. If you encounter a fraudulent listing or suspicious behavior, report it immediately to our moderation team.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/browse" className="bg-white text-slate-900 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Report an item</Link>
                <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest px-4 py-2 border border-slate-800 rounded-2xl">
                  <CheckCircle2 className="w-4 h-4" /> Moderated 24/7
                </div>
              </div>
            </div>
            <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-16 h-16 md:w-24 md:h-24 text-primary opacity-50" />
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
}
