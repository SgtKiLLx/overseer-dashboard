"use client";

import { useState } from "react";
import { Menu, X, LayoutDashboard, Map as MapIcon, Users, Crown, Settings, Shield, LogOut, BookOpen, ChevronRight, Radio } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileMenu({ session }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "intelligence";

  const navLinks = [
    { id: "intelligence", label: "Intelligence", icon: <LayoutDashboard size={18}/> },
    { id: "broadcast", label: "Global Broadcast", icon: <Radio size={18}/> },
    { id: "map", label: "Strategic Map", icon: <MapIcon size={18}/> },
    { id: "roster", label: "Survivor Roster", icon: <Users size={18}/> },
    { id: "alpha", label: "Alpha Protocols", icon: <Crown size={18}/> },
    { id: "manual", label: "System Manual", icon: <BookOpen size={18}/> },
    { id: "settings", label: "Configuration", icon: <Settings size={18}/> },
  ];

  return (
    <>
      {/* MOBILE HEADER BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-cyan-400">
                <Menu size={24} />
            </button>
            <span className="text-sm font-black tracking-tighter text-white uppercase italic">Sentinel</span>
            <ChevronRight size={12} className="text-slate-700" />
            <span className="text-xs font-medium text-cyan-400 capitalize">{activeTab}</span>
        </div>
        <img src={session?.user?.image || ""} className="w-9 h-9 rounded-full border border-white/10" alt="Admin" />
      </div>

      {/* DRAWER SYSTEM */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100]">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.aside 
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-0 left-0 bottom-0 w-80 bg-[#050505] border-r border-white/10 p-8 flex flex-col shadow-2xl"
            >
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <Shield size={22} className="text-cyan-400" />
                        <span className="font-black text-white uppercase italic text-sm">Sentinel_OS</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-slate-500"><X size={24}/></button>
                </div>

                <nav className="space-y-1">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.id} href={`/?tab=${link.id}`} onClick={() => setIsOpen(false)}
                            className={`relative flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-colors duration-300 ${activeTab === link.id ? 'text-black' : 'text-slate-500'}`}
                        >
                            {activeTab === link.id && (
                                <motion.div 
                                    layoutId="active-pill-mobile"
                                    className="absolute inset-0 z-0 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{link.icon}</span>
                            <span className="relative z-10 uppercase tracking-tight italic">{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <Link href="/api/auth/signout" className="flex items-center gap-3 px-6 py-4 text-red-500 text-xs font-black uppercase italic hover:bg-red-500/5 rounded-lg transition-all">
                        <LogOut size={18} /> Terminate_Session
                    </Link>
                </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
