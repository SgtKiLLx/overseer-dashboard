import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Bell, LayoutDashboard, Map as MapIcon, Settings, Zap, Save, Hash, Lock } from "lucide-react";
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

  const activeTab = searchParams.tab || "intelligence";

  // Fetch Live Data
  const registrations = await db.select().from(tribeRegistrationsTable);
  const alphaClaims = await db.select().from(alphaClaimsTable);
  const configs = await db.select().from(guildConfigTable);
  const config = configs[0];
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

  async function updateConfig(formData: FormData) {
    "use server";
    const guildId = formData.get("guildId") as string;
    if (!guildId) return;

    await db.insert(guildConfigTable).values({
      guildId: guildId,
      staffLogChannelId: formData.get("logs") as string,
      welcomeChannelId: formData.get("welcome") as string,
      rulesChannelId: formData.get("rules") as string,
      infoChannelId: formData.get("info") as string,
      recruitmentChannelId: formData.get("recruitment") as string,
      supportChannelId: formData.get("support") as string,
      tribeCategoryId: formData.get("category") as string,
      adminRoleIds: formData.get("role") as string,
    }).onConflictDoUpdate({
      target: guildConfigTable.guildId,
      set: {
        staffLogChannelId: formData.get("logs") as string,
        welcomeChannelId: formData.get("welcome") as string,
        rulesChannelId: formData.get("rules") as string,
        infoChannelId: formData.get("info") as string,
        recruitmentChannelId: formData.get("recruitment") as string,
        supportChannelId: formData.get("support") as string,
        tribeCategoryId: formData.get("category") as string,
        adminRoleIds: formData.get("role") as string,
        updatedAt: new Date(),
      }
    });
    revalidatePath("/");
  }

  const parseCoords = (coordStr: string) => {
    const parts = coordStr.split(/[, ]+/).map(c => parseFloat(c.trim()));
    if (parts.length < 2 || isNaN(parts[0])) return { top: '0%', left: '0%', valid: false };
    return { top: `${parts[0]}%`, left: `${parts[1]}%`, valid: true };
  };

  return (
    <div className="min-h-screen bg-[#020202] text-slate-300 font-sans selection:bg-cyan-500/30 flex flex-col lg:flex-row">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="w-80 border-r border-white/[0.03] bg-[#050505] hidden lg:flex flex-col p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-900/20">
            <Shield className="text-black" size={20} />
          </div>
          <h1 className="text-xl font-[1000] tracking-tighter uppercase text-white italic">Overseer</h1>
        </div>
        <nav className="space-y-4 flex-1">
          <SidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={20}/>} label="Intelligence" active={activeTab === "intelligence"} />
          <SidebarLink href="/?tab=map" icon={<MapIcon size={20}/>} label="Strategic Map" active={activeTab === "map"} />
          <SidebarLink href="/?tab=roster" icon={<Users size={20}/>} label="Survivor Roster" active={activeTab === "roster"} />
          <SidebarLink href="/?tab=alpha" icon={<Crown size={20}/>} label="Alpha Protocols" active={activeTab === "alpha"} />
          <SidebarLink href="/?tab=settings" icon={<Settings size={20}/>} label="System Config" active={activeTab === "settings"} />
        </nav>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION (FULL GLOW EDITION) */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md">
        <div className="bg-[#050505]/80 backdrop-blur-3xl border border-white/[0.05] rounded-[32px] overflow-hidden flex justify-between items-center shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={20} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={20} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={20} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={20} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={20} />} active={activeTab === "settings"} showDivider={false} />
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full pb-32 lg:pb-12">
        
        {/* SECTOR 1: INTELLIGENCE */}
        {activeTab === "intelligence" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <header>
                <p className="text-cyan-600 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Master Admin Interface</p>
                <h2 className="text-5xl lg:text-8xl font-[1000] text-white tracking-tighter leading-[0.85]">Hello,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">{session.user?.name}</span></h2>
                <div className="inline-flex items-center gap-2 mt-10 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Link: Stable</span>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StatCardBig label="Network Load" value={tribeCount} unit="Active Tribes" gradient="from-cyan-500 to-blue-600" />
                <StatCardBig label="Survivor Pop" value={registrations.length} unit="Signatures" gradient="from-[#0A0A0A] to-[#020202]" border />
            </div>
          </div>
        )}

        {/* SECTOR 2: STRATEGIC MAP */}
        {activeTab === "map" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-end px-2">
                <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic">Strategic Map</h3>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Sector: Fjordur</span>
             </div>
             <div className="bg-[#050505] border border-white/[0.05] rounded-[48px] p-3 shadow-2xl relative">
                <div className="relative aspect-square w-full rounded-[38px] overflow-hidden border border-white/5 group">
                    <div className="absolute inset-0 bg-cover bg-center grayscale-[0.2] opacity-80 transition-transform duration-[2s] group-hover:scale-105" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                    <div className="absolute inset-0 bg-black/20" />
                    {alphaClaims.map(claim => {
                        const pos = parseCoords(claim.coordinates);
                        if (!pos.valid) return null;
                        return (
                            <div key={claim.id} className="absolute" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
                                <div className="w-8 h-8 bg-cyan-400 rounded-full animate-ping absolute opacity-20" />
                                <div className="w-4 h-4 bg-cyan-400 rounded-full border-2 border-black shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                            </div>
                        );
                    })}
                </div>
             </div>
           </div>
        )}

        {/* TAB 3: ROSTER (SCROLL FIX EDITION) */}
        {activeTab === "roster" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter px-2">Global Roster</h3>
            
            {/* Wrapper that allows sliding */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto touch-pan-x">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="bg-white/5">
                            <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                <th className="p-6 whitespace-nowrap">Tribe Signature</th>
                                <th className="p-6 whitespace-nowrap">Survivor</th>
                                <th className="p-6 text-right pr-10 whitespace-nowrap">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {registrations.map(reg => (
                                <tr key={reg.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="p-6 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 font-black text-xs uppercase italic">
                                                {reg.tribeName.substring(0, 2)}
                                            </div>
                                            <span className="font-bold text-sm uppercase tracking-tight text-white">{reg.tribeName}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 whitespace-nowrap">
                                        <p className="text-sm font-semibold">{reg.ign}</p>
                                        <p className="text-[10px] text-cyan-700 font-mono uppercase">{reg.xboxGamertag}</p>
                                    </td>
                                    <td className="p-6 text-right pr-8">
                                        <form action={wipeSurvivor}>
                                            <input type="hidden" name="id" value={reg.id} />
                                            <button className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
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
        )}

        {/* SECTOR 4: ALPHA PROTOCOLS (Missing Section Restored) */}
        {activeTab === "alpha" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="px-2 flex justify-between items-center">
                <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic">Alpha Protocols</h3>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Link Status: Encrypted</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {alphaClaims.length === 0 && (
                   <div className="md:col-span-2 bg-white/[0.02] border border-dashed border-white/10 rounded-[48px] p-20 text-center">
                      <p className="text-slate-600 text-sm font-black uppercase tracking-[0.4em] italic">No pending authorization requests detected</p>
                   </div>
                )}
                {alphaClaims.map(claim => (
                    <div key={claim.id} className={`bg-[#050505] border border-white/[0.05] p-8 rounded-[48px] shadow-2xl group transition-all hover:border-amber-500/30 ${claim.status === 'approved' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center mb-10">
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">{claim.tribeName}</h4>
                            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${claim.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {claim.status}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-10">
                             <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05] text-center">
                                <span className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Grid_Loc</span>
                                <span className="text-lg font-bold text-white tracking-tight">{claim.coordinates}</span>
                             </div>
                             <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05] text-center">
                                <span className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Roster</span>
                                <span className="text-lg font-bold text-white tracking-tight">{claim.memberCount} Units</span>
                             </div>
                        </div>
                        {claim.status === 'pending' && (
                            <form action={verifyAlpha}>
                                <input type="hidden" name="id" value={claim.id} />
                                <button type="submit" className="w-full bg-white text-black font-[1000] py-5 rounded-[28px] hover:bg-yellow-400 transition-all text-xs uppercase italic tracking-[0.2em] shadow-2xl">
                                    Authorize Authority
                                </button>
                            </form>
                        )}
                    </div>
                ))}
             </div>
           </div>
        )}

        {/* SECTOR 5: SYSTEM CONFIG */}
        {activeTab === "settings" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="px-2">
                <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic">System Protocols</h3>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Direct Neural override // Auth: Admin</p>
             </div>
             
             <form action={updateConfig} className="bg-[#050505] border border-white/[0.05] rounded-[48px] p-8 md:p-16 shadow-2xl space-y-12">
                <input type="hidden" name="guildId" value={config?.guildId || ""} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ConfigInput label="Staff Log Channel" name="logs" defaultValue={config?.staffLogChannelId || ""} icon={<Hash size={14}/>} />
                    <ConfigInput label="Recruitment Feed" name="recruitment" defaultValue={config?.recruitmentChannelId || ""} icon={<Hash size={14}/>} />
                    <ConfigInput label="Welcome Port" name="welcome" defaultValue={config?.welcomeChannelId || ""} icon={<Hash size={14}/>} />
                    <ConfigInput label="Support Terminal" name="support" defaultValue={config?.supportChannelId || ""} icon={<Hash size={14}/>} />
                    <ConfigInput label="Rules Sector" name="rules" defaultValue={config?.rulesChannelId || ""} icon={<Hash size={14}/>} />
                    <ConfigInput label="Info Sector" name="info" defaultValue={config?.infoChannelId || ""} icon={<Hash size={14}/>} />
                    <ConfigInput label="HQ Category" name="category" defaultValue={config?.tribeCategoryId || ""} icon={<Hash size={14}/>} />
                    <ConfigInput label="Master Role ID(s)" name="role" defaultValue={config?.adminRoleIds || ""} icon={<Lock size={14}/>} />
                </div>
            
                <div className="pt-10 border-t border-white/[0.03] flex justify-end">
                    <button type="submit" className="bg-white text-black font-[1000] px-12 py-5 rounded-[28px] hover:bg-cyan-400 transition-all text-xs uppercase italic flex items-center gap-3 shadow-xl">
                        <Save size={18} /> Update Protocols
                    </button>
                </div>
             </form>
           </div>
        )}

      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function SidebarLink({ href, icon, label, active = false }: any) {
  return (
    <Link href={href} className={`flex items-center gap-5 px-6 py-4 rounded-[28px] cursor-pointer transition-all duration-500 ${active ? 'bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.1)] translate-x-2' : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'}`}>
      {icon}<span className="text-sm font-black uppercase tracking-tight italic">{label}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon, active = false, showDivider = true }: any) {
  return (
    <Link href={href} className="relative flex-1 flex flex-col justify-center items-center py-5 transition-all duration-500">
      {/* 1. THE FULL SECTION GLOW */}
      {active && (
        <div className="absolute inset-0 overflow-hidden">
            {/* Background soft fill */}
            <div className="absolute inset-0 bg-white/[0.03]" />
            
            {/* The vertical "Beam" of light */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            
            {/* The soft radial glow filling the cell */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)] blur-lg" />
            
            {/* The Google-style white capsule for the icon */}
            <div className="absolute inset-0 flex justify-center items-center">
                <div className="w-16 h-10 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
            </div>
        </div>
      )}
      
      {/* 2. THE ICON */}
      <div className={`relative z-10 transition-all duration-500 ${active ? 'text-black scale-110' : 'text-slate-500'}`}>
        {icon}
      </div>

      {/* 3. THE DIVIDER (Adjusted for full glow) */}
      {showDivider && !active && (
        <div className="absolute right-0 h-6 w-[1px] bg-white/[0.05] rounded-full" />
      )}
    </Link>
  );
}

function StatCardBig({ label, value, unit, gradient, border }: any) {
    return (
        <div className={`bg-gradient-to-br ${gradient} ${border ? 'border border-white/[0.03]' : ''} rounded-[48px] p-12 shadow-2xl flex flex-col justify-between min-h-[300px] group transition-all hover:scale-[1.01]`}>
            <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${border ? 'text-slate-600' : 'text-black/40'}`}>{label}</p>
                <h3 className={`text-9xl font-[1000] tracking-tighter leading-none my-4 ${border ? 'text-white' : 'text-black'}`}>{value}</h3>
                <p className={`text-sm font-black uppercase tracking-widest ${border ? 'text-cyan-800' : 'text-black/60'}`}>{unit}</p>
            </div>
        </div>
    )
}

function ConfigInput({ label, name, defaultValue, icon }: any) {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-4 flex items-center gap-2 italic">
                {icon} {label}
            </label>
            <input 
                name={name}
                defaultValue={defaultValue}
                className="w-full bg-[#080808] border border-white/[0.05] rounded-[28px] px-8 py-5 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500/30 transition-all placeholder:text-slate-900 shadow-inner"
                placeholder="NOT_SET"
            />
        </div>
    )
}
