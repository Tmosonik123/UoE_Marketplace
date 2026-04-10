import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UoE Marketplace | Buy & Sell on Campus",
  description: "The ultimate marketplace for University of Eldoret students. Buy and sell textbooks, electronics, furniture, and more with ease.",
  keywords: ["UoE", "University of Eldoret", "Marketplace", "Student Buy Sell", "Eldoret", "Campus Marketplace"],
  authors: [{ name: "UoE Marketplace Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-24 pb-12 overflow-hidden">
              {children}
            </main>
            <footer className="bg-slate-900 text-white py-12 mt-20">
              <div className="container grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      U
                    </div>
                    <span className="font-bold mb-2 text-white">UoE Marketplace</span>
                  </div>
                  <p className="text-slate-400 max-w-sm">
                    By Comrades, for Comrades.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-4">Marketplace</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li><a href="/browse" className="hover:text-white">Browse All</a></li>
                    <li><a href="/categories/textbooks" className="hover:text-white">Textbooks</a></li>
                    <li><a href="/categories/electronics" className="hover:text-white">Electronics</a></li>
                    <li><a href="/categories/utensils" className="hover:text-white">Utensils</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4">Legal & Safety</h4>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li><a href="/safety" className="hover:text-white">Safety Tips</a></li>
                    <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                    <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                    <li><a href="/rules" className="hover:text-white">Community Rules</a></li>
                  </ul>
                </div>
              </div>
              <div className="container mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
                &copy; {new Date().getFullYear()} UoE Marketplace.
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
