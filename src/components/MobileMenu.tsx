"use client";

import { useState } from "react";
import { Menu, X, LayoutDashboard, Map as MapIcon, Users, Crown, Settings, Shield, LogOut, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function MobileMenu({ session }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "intelligence";

  const navLinks = [
    { id: "intelligence", label: "Intelligence", icon: <LayoutDashboard size={18}/> },
    { id: "map", label: "Strategic Map", icon: <MapIcon size={18}/> },
    { id: "roster", label: "Survivor Roster", icon: <Users size={18}/> },
    { id: "alpha", label: "Alpha Protocols", icon: <Crown size={18}/> },
    { id: "manual", label: "System Manual", icon: <BookOpen size={18}/> },
    { id: "settings", label: "Configuration", icon: <Settings size={18}/> },
  ];

  return (
    <>
      {/* AI Studio Style Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-[#0f0f0f] border-b border-white/10 px-4 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                <Menu size={20} />
            </button>
            <span className="text-sm font-bold tracking-tight text-white uppercase italic">Overseer</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="text-xs font-medium text-cyan-400 capitalize">{activeTab}</span>
        </div>
        <img src={session?.user?.image || ""} className="w-8 h-8 rounded-full border border-white/10" alt="Admin" />
      </div>

      {/* The Sidebar Drawer */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isOpen ? "visible" : "invisible"}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setIsOpen(false)} />
        
        <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-[#0f0f0f] shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Shield size={18} className="text-cyan-400" />
                    <span className="font-bold text-white uppercase italic text-sm">Overseer OS</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500"><X size={20}/></button>
            </div>

            <nav className="p-4 space-y-1">
                {navLinks.map((link) => (
                    <Link 
                        key={link.id}
                        href={`/?tab=${link.id}`} 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === link.id ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        {link.icon}
                        {link.label}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto p-4 border-t border-white/5">
                <Link href="/api/auth/signout" className="flex items-center gap-3 px-4 py-3 text-red-400 text-sm font-medium hover:bg-red-500/5 rounded-lg">
                    <LogOut size={18} /> Logout
                </Link>
            </div>
        </aside>
      </div>
    </>
  );
}
