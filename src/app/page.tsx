import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Settings, Bell, LayoutDashboard, Map as MapIcon, MapPin, Zap } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function AdminDashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Fetch Live Data from Neon
  const registrations = await db.select().from(tribeRegistrationsTable);
  const alphaClaims = await db.select().from(alphaClaimsTable);
  const config = await db.select().from(guildConfigTable).limit(1);
  const tribeCount = new Set(registrations.map(r => r.tribeName)).size;

  // --- SERVER ACTIONS ---
  async function wipeSurvivor(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await db.delete(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.id, id));
    revalidatePath("/");
  }

  async function verifyAlpha(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await db.update(alphaClaimsTable).set({ status: "approved" }).where(eq(alphaClaimsTable.id, id));
    revalidatePath("/");
  }

  // Coordinate Parser (Lat/Lon to CSS %)
  // Maps Ark Coordinates (0-100) to Style Positions
  const parseCoords = (coordStr: string) => {
    if (!coordStr) return { top: '0%', left: '0%', valid: false };
    const parts = coordStr.split(/[, ]+/).map(c => parseFloat(c.trim()));
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return { top: '0%', left: '0%', valid: false };
    // Ark Lat is Y-axis (Top), Lon is X-axis (Left)
    return { top: `${parts[0]}%`, left: `${parts[1]}%`, valid: true };
  };

  return (
    <div className="min-h-screen bg-[#020202] text-slate-200 font-sans flex selection:bg-cyan-500/30">
      
      {/* 1. SIDEBAR (ANDROID 17 STYLE) */}
      <aside className="w-72 border-r border-white/[0.05] bg-black/40 backdrop-blur-3xl hidden lg:flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[#22d3ee] to-[#6366f1] rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="text-black" size={18} />
          </div>
          <h1 className="text-xl font-[1000] tracking-tighter text-white uppercase italic">Overseer</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarLink icon={<LayoutDashboard size={20}/>} label="Intelligence" active />
          <SidebarLink icon={<MapIcon size={20}/>} label="Strategic Map" />
          <SidebarLink icon={<Users size={20}/>} label="Survivor Roster" />
          <SidebarLink icon={<Crown size={20}/>} label="Alpha Protocols" />
          <SidebarLink icon={<Settings size={20}/>} label="System Config" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/[0.05]">
           <div className="flex items-center gap-3 px-2">
              <img src={session.user?.image || ""} className="w-11 h-11 rounded-2xl border border-white/10 shadow-xl" alt="Admin" />
              <div className="leading-none">
                <p className="text-sm font-bold text-white tracking-tight">{session.user?.name}</p>
                <p className="text-[10px] text-cyan-500 font-black uppercase mt-1 tracking-widest">Master Admin</p>
              </div>
           </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto">
        
        {/* Top Header Actions */}
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Link Status: Secure</span>
           </div>
           <div className="flex items-center gap-3">
              <button className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition text-slate-400"><Bell size={20}/></button>
           </div>
        </div>

        {/* 3. HERO GREETING */}
        <header className="mb-12 space-y-2">
            <h2 className="text-5xl md:text-7xl font-[1000] text-white tracking-tighter leading-none">
              Welcome back,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#6366f1]">
                {session.user?.name}
              </span>
            </h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em] pt-2 italic opacity-50">Overseer Intelligence Protocol V1.2</p>
        </header>

        {/* 4. STRATEGIC MAP & INTEL FEED */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          
          {/* THE MAP (FJORDUR) */}
          <div className="xl:col-span-2 bg-[#0A0A0A] border border-white/[0.08] rounded-[48px] p-3 overflow-hidden shadow-2xl relative group">
            <div className="absolute top-8 left-8 z-10">
               <h3 className="text-xs font-black text-white tracking-[0.3em] uppercase bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-2xl">
                 Live_Map: Fjordur
               </h3>
            </div>
            
            {/* Map Container */}
            <div className="relative aspect-square w-full bg-slate-900 rounded-[40px] overflow-hidden border border-white/5 shadow-inner">
                {/* Fjordur Base Image */}
                <div 
                    className="absolute inset-0 opacity-90 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.02]" 
                    style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} 
                />

                {/* Tactical Grid Overlay */}
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none">
                    {[...Array(100)].map((_, i) => (
                        <div key={i} className="border-[0.5px] border-white/[0.07]" />
                    ))}
                </div>

                {/* Interactive Tribe Pins */}
                {alphaClaims.map(claim => {
                    const pos = parseCoords(claim.coordinates);
                    if (!pos.valid) return null;
                    return (
                        <div 
                            key={claim.id} 
                            className="absolute group/pin z-20 cursor-help" 
                            style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="w-6 h-6 bg-yellow-500 rounded-full animate-ping absolute opacity-20" />
                            <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-black shadow-[0_0_15px_rgba(250,204,21,0.8)] relative z-30 transition-transform group-hover/pin:scale-125" />
                            
                            {/* Floating Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/pin:block bg-black/90 border border-yellow-500/30 p-4 rounded-2xl backdrop-blur-xl w-40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
                                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Tribe Alpha</p>
                                <p className="text-sm font-bold text-white truncate">{claim.tribeName}</p>
                                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-500">
                                    <span>{claim.coordinates}</span>
                                    <span>{claim.memberCount} Members</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>

          {/* RIGHT SIDEBAR: RECENT ACTIVITY */}
          <div className="flex flex-col gap-6">
             <div className="bg-white/[0.02] border border-white/[0.06] rounded-[40px] p-8 flex-1 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-cyan-500"><Zap size={80}/></div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">System_Activity_Log</h3>
                <div className="space-y-8">
                    {alphaClaims.slice(0, 3).map(claim => (
                        <div key={claim.id} className="flex gap-4 items-start border-l-2 border-yellow-500 pl-5 py-1">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-yellow-600 uppercase mb-1">Alpha Claim</p>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{claim.tribeName}</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">Authorized at {claim.coordinates}</p>
                            </div>
                        </div>
                    ))}
                    {registrations.slice(0, 3).map(reg => (
                        <div key={reg.id} className="flex gap-4 items-start border-l-2 border-cyan-500 pl-5 py-1">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-cyan-600 uppercase mb-1">New Signature</p>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{reg.ign}</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-1">Joined {reg.tribeName}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
             
             {/* QUICK STATS WIDGET */}
             <div className="bg-gradient-to-br from-[#22d3ee] to-[#3b82f6] rounded-[40px] p-8 text-black shadow-2xl shadow-cyan-500/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Network Capacity</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-[1000] tracking-tighter">{tribeCount}</span>
                    <span className="text-sm font-bold uppercase tracking-tighter">Active Tribes</span>
                </div>
             </div>
          </div>
        </div>

        {/* 5. SURVIVOR DATABASE */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <h3 className="text-2xl font-[1000] text-white tracking-tighter uppercase italic">Survivor Signatures</h3>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Entries: {registrations.length}</span>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-[48px] overflow-hidden shadow-2xl backdrop-blur-md">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] border-b border-white/5">
                      <th className="p-8">Identification</th>
                      <th className="p-8">In-Game Name</th>
                      <th className="p-4">Xbox ID</th>
                      <th className="p-8 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="group hover:bg-white/[0.02] transition-all">
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[18px] bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-cyan-400 font-black text-sm group-hover:border-cyan-500 transition-all">
                              {reg.tribeName.substring(0,1).toUpperCase()}
                            </div>
                            <span className="font-bold text-white uppercase tracking-tight text-lg">{reg.tribeName}</span>
                          </div>
                        </td>
                        <td className="p-8">
                            <span className="text-slate-300 font-semibold text-base">{reg.ign}</span>
                        </td>
                        <td className="p-4">
                            <span className="text-cyan-800 font-mono text-xs uppercase tracking-widest">{reg.xboxGamertag}</span>
                        </td>
                        <td className="p-8 text-right">
                          <form action={wipeSurvivor}>
                            <input type="hidden" name="id" value={reg.id} />
                            <button className="p-4 rounded-2xl bg-red-500/5 text-red-500/20 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 transform active:scale-90 shadow-lg">
                              <Trash2 size={20} />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        </div>

      </main>
    </div>
  );
}

// --- SHARED UI COMPONENTS ---

function SidebarLink({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-5 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 ${active ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)]' : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'}`}>
      {icon}
      <span className="text-sm font-black uppercase tracking-tight">{label}</span>
    </div>
  );
}
