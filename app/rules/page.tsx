"use client";

import { CheckCircle2, XCircle, Info, Star } from "lucide-react";

export default function RulesPage() {
  const dos = [
    "Always use your real name on your profile",
    "Meet in safe, public campus locations",
    "Provide clear, honest photos of your items",
    "Respond to messages in a timely manner",
    "Rate your seller after a successful trade"
  ];

  const donts = [
    "List prohibited items (alcohol, weapons, etc.)",
    "Spam other users with irrelevant messages",
    "Create multiple accounts",
    "Use offensive language in descriptions",
    "No-show for a scheduled meetup"
  ];

  return (
    <div className="container py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-500 font-black uppercase tracking-[0.2em] text-[10px] mb-4">
            <Star className="w-4 h-4" /> Code of Conduct
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Community <span className="text-indigo-500">Rules</span></h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            To maintain a high-quality marketplace, all University of Eldoret students must adhere to these simple community guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[2.5rem] p-10 shadow-sm border-dashed">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-200 italic">The Do's</h3>
            </div>
            <ul className="space-y-6">
              {dos.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-emerald-800 dark:text-emerald-400 font-bold text-sm">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-[2.5rem] p-10 shadow-sm border-dashed">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-rose-900 dark:text-rose-200 italic">The Don'ts</h3>
            </div>
            <ul className="space-y-6">
              {donts.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-rose-800 dark:text-rose-400 font-bold text-sm tracking-tight">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex items-start gap-8 border border-white/5">
          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
            <Info className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-xl font-black mb-2">Fair Play Notice</h4>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              The UoE Marketplace is a self-policing community. Behavior that undermines the safety or integrity of the platform is strictly prohibited. Admins reserve the right to remove any content or user that violates these guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
