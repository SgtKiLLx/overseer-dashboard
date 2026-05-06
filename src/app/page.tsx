import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Bell, LayoutDashboard, Map as MapIcon, Settings, Menu } from "lucide-react";
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 flex flex-col lg:flex-row">
      
      {/* 1. DESKTOP SIDEBAR (Visible only on large screens) */}
      <aside className="w-80 border-r border-white/5 bg-[#0A0A0A] hidden lg:flex flex-col p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="text-black" size={20} />
          </div>
          <h1 className="text-xl font-[1000] tracking-tighter uppercase italic">Overseer</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarLink icon={<LayoutDashboard size={20}/>} label="Intelligence" active />
          <SidebarLink icon={<Users size={20}/>} label="Survivors" />
          <SidebarLink icon={<Crown size={20}/>} label="Alpha Claims" />
          <SidebarLink icon={<Settings size={20}/>} label="Protocols" />
        </nav>

        <div className="mt-auto flex items-center gap-4 bg-white/5 p-4 rounded-[24px] border border-white/5">
            <img src={session.user?.image || ""} className="w-10 h-10 rounded-xl border border-white/10" alt="Admin" />
            <div className="leading-none">
                <p className="text-xs font-bold truncate w-32">{session.user?.name}</p>
                <p className="text-[10px] text-cyan-500 font-black uppercase mt-1">Master Admin</p>
            </div>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION (Android 17 Style Pill) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
        <div className="bg-[#121417]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex justify-around items-center shadow-2xl shadow-black">
            <MobileNavLink icon={<LayoutDashboard size={22} />} active />
            <MobileNavLink icon={<MapIcon size={22} />} />
            <MobileNavLink icon={<Users size={22} />} />
            <MobileNavLink icon={<Crown size={22} />} />
            <MobileNavLink icon={<Settings size={22} />} />
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-12 max-w-[1400px] mx-auto w-full pb-32 lg:pb-12">
        
        {/* Header - Mobile Version */}
        <div className="flex justify-between items-center mb-8 lg:mb-12">
           <div className="lg:hidden flex items-center gap-3">
              <div className="w-10 h-10 bg-[#121417] border border-white/10 rounded-2xl flex items-center justify-center">
                <Shield size={20} className="text-cyan-400" />
              </div>
              <span className="font-bold tracking-tight">Overseer</span>
           </div>
           <div className="flex items-center gap-3 ml-auto">
              <button className="p-3 rounded-2xl bg-[#121417] border border-white/5 text-slate-400"><Bell size={20}/></button>
              <img src={session.user?.image || ""} className="lg:hidden w-10 h-10 rounded-2xl border-2 border-white/5" alt="Admin" />
           </div>
        </div>

        {/* Hero Greeting */}
        <header className="mb-10">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight leading-none">
              Welcome, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                {session.user?.name}
              </span>
            </h2>
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Link Active</span>
            </div>
        </header>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[40px] p-3 relative shadow-2xl overflow-hidden group">
                <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <MapIcon size={12} className="text-cyan-400" /> Sector_Fjordur
                </div>
                <div className="relative aspect-square md:aspect-video w-full rounded-[32px] overflow-hidden border border-white/5">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                    {alphaClaims.map(claim => {
                        const pos = parseCoords(claim.coordinates);
                        if (!pos.valid) return null;
                        return (
                            <div key={claim.id} className="absolute" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
                                <div className="w-6 h-6 bg-yellow-400 rounded-full animate-ping absolute opacity-20" />
                                <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-black shadow-lg shadow-yellow-500/50" />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#22d3ee] to-[#6366f1] rounded-[40px] p-8 text-black shadow-2xl flex flex-col justify-between">
                <div>
                   <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">System Load</p>
                   <h3 className="text-7xl font-[1000] tracking-tighter">{tribeCount}</h3>
                   <p className="text-sm font-bold uppercase tracking-tight">Active Tribe Units</p>
                </div>
                <Activity size={40} className="mt-10 opacity-20" />
            </div>
        </div>

        {/* Survivor Database */}
        <section className="space-y-6 mb-12">
            <h3 className="text-xl font-bold tracking-tight px-2 flex items-center gap-2">
                <Users size={20} className="text-cyan-500" /> Survivor Roster
            </h3>
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                <th className="p-6">Tribe Signature</th>
                                <th className="p-6">Survivor</th>
                                <th className="p-6 text-right pr-10">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {registrations.map(reg => (
                                <tr key={reg.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 font-black text-xs">
                                                {reg.tribeName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-sm uppercase tracking-tight">{reg.tribeName}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-semibold">{reg.ign}</p>
                                        <p className="text-[10px] text-cyan-800 font-mono uppercase mt-0.5">{reg.xboxGamertag}</p>
                                    </td>
                                    <td className="p-6 text-right pr-8">
                                        <form action={wipeSurvivor}>
                                            <input type="hidden" name="id" value={reg.id} />
                                            <button className="p-3 rounded-2xl bg-red-500/10 text-red-500 opacity-40 group-hover:opacity-100 transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function SidebarLink({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-[24px] cursor-pointer transition-all ${active ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
      {icon}
      <span className="text-sm font-black uppercase tracking-tight">{label}</span>
    </div>
  );
}

function MobileNavLink({ icon, active = false }: any) {
  return (
    <div className={`p-4 rounded-[24px] transition-all ${active ? 'bg-white text-black' : 'text-slate-500'}`}>
      {icon}
    </div>
  );
}
