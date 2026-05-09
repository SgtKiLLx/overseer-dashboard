"use client";

import { useState } from "react";
import { Menu, X, LayoutDashboard, Map as MapIcon, Users, Crown, Settings, Shield, LogOut } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function MobileMenu({ session, tribeCount, survivorCount }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "intelligence";

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { id: "intelligence", label: "Intelligence", icon: <LayoutDashboard size={20}/> },
    { id: "map", label: "Strategic Map", icon: <MapIcon size={20}/> },
    { id: "roster", label: "Survivor Roster", icon: <Users size={20}/> },
    { id: "alpha", label: "Alpha Protocols", icon: <Crown size={20}/> },
    { id: "settings", label: "System Config", icon: <Settings size={20}/> },
    { id: "manual", label: "Bot Manual", icon: <BookOpen size={20}/> },
  ];

  return (
    <>
      {/* TOP BAR FOR MOBILE */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-black/60 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/20">
                <Shield className="text-black" size={18} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase italic">Overseer</span>
        </div>
        <button onClick={toggleMenu} className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-cyan-400">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* THE SIDEBAR DRAWER */}
      <div className={`fixed inset-0 z-[70] transition-all duration-500 ${isOpen ? "visible" : "invisible pointer-events-none"}`}>
        {/* Backdrop */}
        <div 
            className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`} 
            onClick={toggleMenu} 
        />
        
        {/* Sidebar Panel */}
        <aside className={`absolute top-0 left-0 bottom-0 w-80 bg-[#050505] border-r border-white/[0.05] p-8 flex flex-col transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                    <img src="/icon.png" className="w-6 h-6 object-contain" alt="Overseer" />
                </div>
                <h1 className="text-xl font-[1000] tracking-tighter uppercase text-white italic">Overseer</h1>
            </div>

            <nav className="space-y-3">
                {navLinks.map((link) => (
                    <Link 
                        key={link.id}
                        href={`/?tab=${link.id}`} 
                        onClick={() => setIsOpen(false)}
                        className={`relative flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all duration-500 overflow-hidden group ${activeTab === link.id ? 'text-black' : 'text-slate-500 hover:text-white'}`}
                    >
                        {activeTab === link.id && (
                            <div className="absolute inset-0 z-0">
                                <div className="absolute inset-0 bg-white" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_100%)] blur-xl" />
                            </div>
                        )}
                        <span className="relative z-10">{link.icon}</span>
                        <span className="relative z-10 text-sm font-black uppercase tracking-tight italic">{link.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Bottom Profile Info */}
            <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3 bg-white/[0.02] p-4 rounded-3xl border border-white/[0.05]">
                    <img src={session?.user?.image || ""} className="w-10 h-10 rounded-xl border border-white/10" alt="Admin" />
                    <div className="leading-none overflow-hidden">
                        <p className="text-xs font-bold truncate text-white uppercase italic">{session?.user?.name}</p>
                        <p className="text-[9px] text-cyan-500 font-black uppercase mt-1">Master_Admin</p>
                    </div>
                </div>
                <Link href="/api/auth/signout" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all text-xs font-black uppercase italic">
                    <LogOut size={18} /> De-Authorize Session
                </Link>
            </div>
        </aside>
      </div>
    </>
  );
}
