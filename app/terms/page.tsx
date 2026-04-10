"use client";

import { FileText, ShieldCheck, Scale, AlertCircle } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Eligibility",
      content: "This marketplace is exclusively for current students and staff of the University of Eldoret. You must use your university-affiliated credentials to register and trade.",
      icon: ShieldCheck
    },
    {
      title: "2. Prohibited Items",
      content: "Illegal substances, weapons, counterfeit goods, hazardous materials, and items violating university policy are strictly prohibited. Listing such items will result in an immediate and permanent ban.",
      icon: AlertCircle
    },
    {
      title: "3. Trading Safety",
      content: "UoE Marketplace provides a platform for connecting buyers and sellers. We do not handle payments or delivery. All trades are performed at the discretion and risk of the participating parties.",
      icon: Scale
    },
    {
      title: "4. Account Integrity",
      content: "Users are responsible for maintaining the confidentiality of their accounts. Providing false information or impersonating others is grounds for termination.",
      icon: FileText
    }
  ];

  return (
    <div className="container py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Terms of <span className="text-primary">Service</span></h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Last Updated: April 2026</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="card p-8 md:p-12 border-slate-100 dark:border-slate-800 shadow-sm mb-12">
            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed mb-10">
              Welcome to the UoE Marketplace. By using our platform, you agree to comply with the following terms. These rules are designed to ensure a fair and safe environment for all campus residents.
            </p>

            <div className="space-y-12">
              {sections.map((section, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors group-hover:bg-primary group-hover:text-white">
                      <section.icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl font-bold m-0">{section.title}</h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed pl-12">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-3xl p-8 flex items-start gap-6">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-rose-900 dark:text-rose-200 font-black mb-2 m-0">Violation Policy</h3>
              <p className="text-rose-700 dark:text-rose-400 text-sm font-medium mb-0">
                Breaching these terms may lead to listing removal, temporary suspension, or permanent account expulsion depending on the severity of the violation. We reserve the right to report serious legal infractions to campus security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
