import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Bell, LayoutDashboard, Map as MapIcon, Settings, Zap } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Determine active tab (default to intelligence)
  const activeTab = searchParams.tab || "intelligence";

  // Fetch Data
  const registrations = await db.select().from(tribeRegistrationsTable);
  const alphaClaims = await db.select().from(alphaClaimsTable);
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

  const parseCoords = (coordStr: string) => {
    const parts = coordStr.split(/[, ]+/).map(c => parseFloat(c.trim()));
    if (parts.length < 2 || isNaN(parts[0])) return { top: '0%', left: '0%', valid: false };
    return { top: `${parts[0]}%`, left: `${parts[1]}%`, valid: true };
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 flex flex-col lg:flex-row">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="w-80 border-r border-white/5 bg-[#080808] hidden lg:flex flex-col p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="text-black" size={20} />
          </div>
          <h1 className="text-xl font-[1000] tracking-tighter uppercase italic">Overseer</h1>
        </div>

        <nav className="space-y-3 flex-1">
          <SidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={20}/>} label="Intelligence" active={activeTab === "intelligence"} />
          <SidebarLink href="/?tab=map" icon={<MapIcon size={20}/>} label="Strategic Map" active={activeTab === "map"} />
          <SidebarLink href="/?tab=roster" icon={<Users size={20}/>} label="Survivor Roster" active={activeTab === "roster"} />
          <SidebarLink href="/?tab=alpha" icon={<Crown size={20}/>} label="Alpha Protocols" active={activeTab === "alpha"} />
          <SidebarLink href="/?tab=settings" icon={<Settings size={20}/>} label="System Config" active={activeTab === "settings"} />
        </nav>

        <div className="mt-auto flex items-center gap-4 bg-white/5 p-4 rounded-[28px] border border-white/5">
            <img src={session.user?.image || ""} className="w-10 h-10 rounded-xl border border-white/10" alt="Admin" />
            <div className="leading-none overflow-hidden">
                <p className="text-xs font-bold truncate text-white uppercase italic">{session.user?.name}</p>
                <p className="text-[9px] text-cyan-500 font-black uppercase mt-1 tracking-widest">Master_Admin</p>
            </div>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md">
        <div className="bg-[#111111]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={22} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={22} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={22} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={22} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={22} />} active={activeTab === "settings"} />
        </div>
      </div>

      {/* 3. MAIN DYNAMIC CONTENT */}
      <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full pb-32 lg:pb-12 transition-all">
        
        {/* TAB 1: INTELLIGENCE (OVERVIEW) */}
        {activeTab === "intelligence" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none">
                  Hello, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                    {session.user?.name}
                  </span>
                </h2>
                <div className="inline-flex items-center gap-2 mt-6 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Network Secure</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#22d3ee] to-[#3b82f6] rounded-[40px] p-10 text-black shadow-2xl flex flex-col justify-between min-h-[240px]">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Database Load</p>
                      <h3 className="text-8xl font-[1000] tracking-tighter">{tribeCount}</h3>
                      <p className="text-sm font-bold uppercase tracking-tight">Active Tribe Units</p>
                    </div>
                    <Activity size={40} className="opacity-20" />
                </div>
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-10 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Survivor Population</p>
                      <h3 className="text-8xl font-[1000] tracking-tighter text-white">{registrations.length}</h3>
                      <p className="text-sm font-bold uppercase tracking-tight text-slate-400">Registered Signatures</p>
                    </div>
                    <Users size={40} className="text-cyan-900 opacity-20" />
                </div>
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGIC MAP */}
        {activeTab === "map" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Strategic Map</h3>
                <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">LIVE_PINS: {alphaClaims.length}</span>
             </div>
             <div className="bg-[#0A0A0A] border border-white/5 rounded-[48px] p-3 shadow-2xl relative">
                <div className="relative aspect-square w-full rounded-[38px] overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                    <div className="absolute inset-0 bg-cyan-900/10 mix-blend-overlay" />
                    {alphaClaims.map(claim => {
                        const pos = parseCoords(claim.coordinates);
                        if (!pos.valid) return null;
                        return (
                            <div key={claim.id} className="absolute" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
                                <div className="w-8 h-8 bg-yellow-400 rounded-full animate-ping absolute opacity-20" />
                                <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-black shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            </div>
                        );
                    })}
                </div>
             </div>
          </div>
        )}

        {/* TAB 3: ROSTER */}
        {activeTab === "roster" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter px-2">Global Roster</h3>
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                            <th className="p-6">Identification</th>
                            <th className="p-6">Survivor</th>
                            <th className="p-6 text-right pr-10">Delete</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {registrations.map(reg => (
                            <tr key={reg.id} className="group hover:bg-white/[0.01] transition-all">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 font-black text-xs uppercase italic">{reg.tribeName.substring(0, 2)}</div>
                                        <span className="font-bold text-sm uppercase tracking-tight text-white">{reg.tribeName}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <p className="text-sm font-semibold text-slate-200">{reg.ign}</p>
                                    <p className="text-[10px] text-cyan-700 font-mono uppercase">{reg.xboxGamertag}</p>
                                </td>
                                <td className="p-6 text-right pr-8">
                                    <form action={wipeSurvivor}>
                                        <input type="hidden" name="id" value={reg.id} />
                                        <button className="p-3 rounded-2xl bg-red-500/10 text-red-500 opacity-40 group-hover:opacity-100 transition-all">
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
        )}

        {/* TAB 4: ALPHA CLAIMS */}
        {activeTab === "alpha" && (
           <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <h3 className="text-3xl font-black italic uppercase tracking-tighter px-2">Alpha Protocols</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {alphaClaims.map(claim => (
                    <div key={claim.id} className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[40px] hover:border-yellow-500/30 transition-all shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">{claim.tribeName}</h4>
                            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${claim.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {claim.status}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                             <div className="bg-white/5 rounded-3xl p-5 border border-white/5 text-center">
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Grid_Loc</span>
                                <span className="text-lg font-bold">{claim.coordinates}</span>
                             </div>
                             <div className="bg-white/5 rounded-3xl p-5 border border-white/5 text-center">
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Units</span>
                                <span className="text-lg font-bold">{claim.memberCount}</span>
                             </div>
                        </div>
                        {claim.status === 'pending' && (
                            <form action={verifyAlpha}>
                                <input type="hidden" name="id" value={claim.id} />
                                <button type="submit" className="w-full bg-white text-black font-[1000] py-5 rounded-[24px] hover:bg-yellow-400 transition-all text-sm uppercase italic tracking-widest shadow-xl shadow-white/5">
                                    Authorize Authority
                                </button>
                            </form>
                        )}
                    </div>
                ))}
             </div>
           </div>
        )}

      </main>
    </div>
  );
}

// --- SHARED COMPONENTS ---

function SidebarLink({ href, icon, label, active = false }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-6 py-4 rounded-[24px] cursor-pointer transition-all duration-300 ${active ? 'bg-white text-black shadow-2xl shadow-white/10 translate-x-2' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
      {icon}
      <span className="text-sm font-black uppercase tracking-tight italic">{label}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon, active = false }: any) {
  return (
    <Link href={href} className={`p-4 rounded-[22px] transition-all duration-300 ${active ? 'bg-white text-black scale-110 shadow-lg shadow-white/10' : 'text-slate-600'}`}>
      {icon}
    </Link>
  );
}
