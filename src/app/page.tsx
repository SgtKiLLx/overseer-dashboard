import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Bell, LayoutGrid, Map as MapIcon } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function AdminDashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const registrations = await db.select().from(tribeRegistrationsTable);
  const alphaClaims = await db.select().from(alphaClaimsTable);
  const tribeCount = new Set(registrations.map(r => r.tribeName)).size;

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

  const parseCoords = (coordStr: string) => {
    const parts = coordStr.split(/[, ]+/).map(c => parseFloat(c.trim()));
    if (parts.length < 2 || isNaN(parts[0])) return { top: '0%', left: '0%', valid: false };
    return { top: `${parts[0]}%`, left: `${parts[1]}%`, valid: true };
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-cyan-500/30 pb-24">
      
      {/* 1. TOP NAV - ANDROID PILL STYLE */}
      <nav className="p-6 flex justify-between items-center max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1A1C1E] border border-white/10 rounded-[18px] flex items-center justify-center">
            <Shield className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Overseer</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button className="w-12 h-12 rounded-[18px] bg-[#1A1C1E] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
                <Bell size={20} />
            </button>
            <img src={session.user?.image || ""} className="w-12 h-12 rounded-[18px] border-2 border-white/5 shadow-lg" alt="Admin" />
        </div>
      </nav>

      <main className="px-6 max-w-[1400px] mx-auto">
        
        {/* 2. MODERN GREETING SECTION */}
        <header className="py-8">
            <h2 className="text-4xl font-bold tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{session.user?.name}</span>
            </h2>
            <div className="flex items-center gap-2 mt-2">
                <div className="bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">System Link Active</span>
                </div>
            </div>
        </header>

        {/* 3. WIDGET GRID (MODERN MOBILE STYLE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            
            {/* BIG MAP WIDGET */}
            <div className="md:col-span-2 bg-[#121417] border border-white/5 rounded-[32px] overflow-hidden p-2 relative shadow-2xl">
                <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
                    <MapIcon size={12} className="text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sector_Fjordur</span>
                </div>
                
                <div className="relative aspect-square md:aspect-video w-full rounded-[24px] overflow-hidden border border-white/5">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                    <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none border border-white/5 opacity-20">
                        {[...Array(100)].map((_, i) => <div key={i} className="border-[0.5px] border-white/20" />)}
                    </div>
                    {alphaClaims.map(claim => {
                        const pos = parseCoords(claim.coordinates);
                        if (!pos.valid) return null;
                        return (
                            <div key={claim.id} className="absolute group z-20" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
                                <div className="w-6 h-6 bg-yellow-400 rounded-full animate-ping absolute opacity-20" />
                                <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-black shadow-lg shadow-yellow-500/50" />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CAPACITY WIDGET */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[32px] p-8 text-black flex flex-col justify-between h-full shadow-xl">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Network Load</p>
                   <h3 className="text-6xl font-black tracking-tighter">{tribeCount}</h3>
                   <p className="text-sm font-bold uppercase tracking-tight">Active Tribe Units</p>
                </div>
                <Activity size={32} className="mt-8 opacity-20" />
            </div>
        </div>

        {/* 4. SURVIVOR DATABASE SECTION */}
        <div className="space-y-6 mb-12">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold tracking-tight">Survivor Roster</h3>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entries: {registrations.length}</span>
            </div>

            <div className="bg-[#121417] border border-white/5 rounded-[32px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                <th className="p-6">Tribe Signature</th>
                                <th className="p-6">Survivor</th>
                                <th className="p-6 text-right pr-10">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {registrations.map(reg => (
                                <tr key={reg.id} className="hover:bg-white/[0.01] transition-all">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-[10px]">
                                                {reg.tribeName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-sm uppercase tracking-tight">{reg.tribeName}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-medium text-slate-200">{reg.ign}</p>
                                        <p className="text-[10px] text-cyan-700 font-mono uppercase">{reg.xboxGamertag}</p>
                                    </td>
                                    <td className="p-6 text-right pr-8">
                                        <form action={wipeSurvivor}>
                                            <input type="hidden" name="id" value={reg.id} />
                                            <button className="p-3 rounded-2xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* 5. ALPHA CLAIMS SECTION */}
        <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-tight px-2">Pending Protocols</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {alphaClaims.map(claim => (
                    <div key={claim.id} className="bg-[#121417] border border-white/5 p-6 rounded-[32px] hover:border-yellow-500/30 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-black uppercase italic tracking-tighter">{claim.tribeName}</h4>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${claim.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {claim.status}
                            </div>
                        </div>
                        <div className="flex gap-4 mb-8">
                             <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Grid</span>
                                <span className="text-sm font-bold">{claim.coordinates}</span>
                             </div>
                             <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Units</span>
                                <span className="text-sm font-bold">{claim.memberCount}</span>
                             </div>
                        </div>
                        {claim.status === 'pending' && (
                            <form action={verifyAlpha}>
                                <input type="hidden" name="id" value={claim.id} />
                                <button className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all text-xs uppercase italic tracking-widest">
                                    Authorize Access
                                </button>
                            </form>
                        )}
                    </div>
                ))}
            </div>
        </div>

      </main>
    </div>
  );
}
