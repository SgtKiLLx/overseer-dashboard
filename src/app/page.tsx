import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Bell, LayoutDashboard, Map as MapIcon, Settings, Save, Hash, Lock, Coins, Zap } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

const TARGET_GUILD_ID = "1488515896807919667";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const activeTab = searchParams.tab || "intelligence";

  // Fetch Live Data
  const registrations = await db.select().from(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.guildId, TARGET_GUILD_ID));
  const alphaClaims = await db.select().from(alphaClaimsTable).where(eq(alphaClaimsTable.guildId, TARGET_GUILD_ID));
  const configs = await db.select().from(guildConfigTable).where(eq(guildConfigTable.guildId, TARGET_GUILD_ID));
  const config = configs[0];
  const tribeCount = new Set(registrations.filter(r => r.status === 'verified').map(r => r.tribeName)).size;

  // --- SERVER ACTIONS ---
  async function wipeSurvivor(formData: FormData) {
    "use server";
    await db.delete(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.id, Number(formData.get("id"))));
    revalidatePath("/");
  }

  async function verifyAlpha(formData: FormData) {
    "use server";
    await db.update(alphaClaimsTable).set({ status: "approved" }).where(eq(alphaClaimsTable.id, Number(formData.get("id"))));
    revalidatePath("/");
  }

  async function updateConfig(formData: FormData) {
    "use server";
    const gId = formData.get("guildId") as string;
    await db.insert(guildConfigTable).values({ guildId: gId, staffLogChannelId: formData.get("logs") as string, welcomeChannelId: formData.get("welcome") as string, rulesChannelId: formData.get("rules") as string, infoChannelId: formData.get("info") as string, recruitmentChannelId: formData.get("recruitment") as string, supportChannelId: formData.get("support") as string, tribeCategoryId: formData.get("category") as string, adminRoleIds: formData.get("role") as string }).onConflictDoUpdate({ target: guildConfigTable.guildId, set: { staffLogChannelId: formData.get("logs") as string, welcomeChannelId: formData.get("welcome") as string, rulesChannelId: formData.get("rules") as string, infoChannelId: formData.get("info") as string, recruitmentChannelId: formData.get("recruitment") as string, supportChannelId: formData.get("support") as string, tribeCategoryId: formData.get("category") as string, adminRoleIds: formData.get("role") as string, updatedAt: new Date() } });
    revalidatePath("/");
  }

  const parseCoords = (c: string) => {
    const p = c.split(/[, ]+/).map(x => parseFloat(x.trim()));
    return { top: `${p[0]}%`, left: `${p[1]}%`, valid: !isNaN(p[0]) };
  };

  return (
    <div className="min-h-screen bg-[#020202] text-slate-300 font-sans flex flex-col lg:flex-row pb-32">
      
      {/* 1. DESKTOP SIDEBAR (SLIM ICON STRIP) */}
      <aside className="w-24 border-r border-white/[0.03] bg-[#050505] hidden lg:flex flex-col items-center py-8 sticky top-0 h-screen">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-cyan-500/20">
             <Shield className="text-black" size={24} />
          </div>
          <nav className="space-y-8">
            <DesktopSidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={24}/>} active={activeTab === "intelligence"} />
            <DesktopSidebarLink href="/?tab=map" icon={<MapIcon size={24}/>} active={activeTab === "map"} />
            <DesktopSidebarLink href="/?tab=roster" icon={<Users size={24}/>} active={activeTab === "roster"} />
            <DesktopSidebarLink href="/?tab=alpha" icon={<Crown size={24}/>} active={activeTab === "alpha"} />
            <DesktopSidebarLink href="/?tab=settings" icon={<Settings size={24}/>} active={activeTab === "settings"} />
          </nav>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION (FULL WIDTH + GLOW + DIVIDERS) */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md">
        <div className="mce-bevel-out bg-[#080808]/90 backdrop-blur-3xl rounded-[36px] overflow-hidden flex justify-around items-center p-1 relative border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            <div className="mce-gloss absolute inset-0 rounded-[36px]" />
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={20} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={20} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={20} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={20} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={20} />} active={activeTab === "settings"} showDivider={false} />
        </div>
      </div>

      {/* 3. MAIN DYNAMIC CONTENT */}
      <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full pt-20 lg:pt-12 transition-all">
        
        {/* HERO GREETING (INTELLIGENCE) */}
        {activeTab === "intelligence" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <header>
                <p className="text-cyan-600 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Master Admin Terminal</p>
                <h2 className="text-4xl lg:text-7xl font-[1000] text-white tracking-tighter leading-none">Hello,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">{session.user?.name}</span></h2>
                <div className="inline-flex items-center gap-2 mt-8 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-2xl mce-bevel-out">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Link: Online</span>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StatCardBig label="Network Load" value={tribeCount} unit="Active Tribes" gradient="from-cyan-500 to-blue-600" />
                <StatCardBig label="Survivor Pop" value={registrations.length} unit="Signatures" gradient="from-[#0A0A0A] to-[#020202]" border />
            </div>
          </div>
        )}

        {/* STRATEGIC MAP (FJORDUR) */}
        {activeTab === "map" && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic">Strategic Map</h3>
             <div className="bg-[#050505] border border-white/[0.05] rounded-[48px] p-3 shadow-2xl relative">
                <div className="relative aspect-square w-full rounded-[38px] overflow-hidden border border-white/5">
                    <div className="absolute inset-0 bg-cover bg-center grayscale-[0.2] opacity-80" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                    <div className="absolute inset-0 bg-black/20" />
                    {alphaClaims.map(claim => {
                        const pos = parseCoords(claim.coordinates);
                        if (!pos.valid) return null;
                        return <div key={claim.id} className="absolute" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}><div className="w-8 h-8 bg-cyan-400 rounded-full animate-ping absolute opacity-20" /><div className="w-4 h-4 bg-cyan-400 rounded-full border-2 border-black shadow-[0_0_15px_rgba(34,211,238,0.8)]" /></div>
                    })}
                </div>
             </div>
           </div>
        )}

        {/* GLOBAL ROSTER (TABLE) */}
        {activeTab === "roster" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic px-2">Global Roster</h3>
            <div className="bg-[#050505] border border-white/[0.05] rounded-[40px] overflow-hidden shadow-2xl shadow-black">
                <div className="overflow-x-auto touch-pan-x">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-white/[0.02] font-black text-[10px] uppercase tracking-[0.3em] text-slate-600">
                            <tr><th className="p-8">Identification</th><th className="p-8">Survivor</th><th className="p-8 text-right pr-12">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {registrations.map(reg => (
                                <tr key={reg.id} className="group hover:bg-white/[0.01]">
                                    <td className="p-8"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-500 font-black text-[10px]">{reg.tribeName.substring(0, 2)}</div><span className="font-bold text-sm uppercase text-white tracking-tight">{reg.tribeName}</span></div></td>
                                    <td className="p-8"><p className="text-sm font-semibold text-slate-200">{reg.ign}</p><p className="text-[10px] text-cyan-900 font-mono uppercase font-bold">{reg.xboxGamertag}</p></td>
                                    <td className="p-8 text-right pr-10"><form action={wipeSurvivor}><input type="hidden" name="id" value={reg.id} /><button className="p-4 rounded-2xl bg-red-500/[0.02] text-red-500/20 hover:bg-red-500 hover:text-white transition-all transform active:scale-90"><Trash2 size={18} /></button></form></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {/* ALPHA CLAIMS */}
        {activeTab === "alpha" && (
           <div className="space-y-8 animate-in fade-in duration-500">
             <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic">Alpha Protocols</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {alphaClaims.length === 0 && <div className="md:col-span-2 bg-white/[0.02] border border-dashed border-white/10 rounded-[48px] p-20 text-center text-slate-700 uppercase font-black text-xs tracking-widest italic">No pending requests</div>}
                {alphaClaims.map(claim => (
                    <div key={claim.id} className={`bg-[#050505] border border-white/[0.05] p-8 rounded-[48px] shadow-2xl transition-all hover:border-amber-500/30 ${claim.status === 'approved' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center mb-10 text-white font-black italic uppercase text-2xl">{claim.tribeName}</div>
                        <div className="grid grid-cols-2 gap-4 mb-10"><div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05] text-center text-lg font-bold">{claim.coordinates}</div><div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05] text-center text-lg font-bold">{claim.memberCount} Units</div></div>{claim.status === 'pending' && <form action={verifyAlpha}><input type="hidden" name="id" value={claim.id} /><button type="submit" className="w-full bg-white text-black font-[1000] py-5 rounded-[28px] hover:bg-yellow-400 transition-all text-sm uppercase italic tracking-[0.2em]">Authorize Authority</button></form>}</div>
                ))}
             </div>
           </div>
        )}

        {/* SYSTEM CONFIG */}
        {activeTab === "settings" && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic px-2">System Protocols</h3>
             <form action={updateConfig} className="bg-[#050505] border border-white/[0.05] rounded-[48px] p-8 md:p-16 shadow-2xl space-y-12">
                <input type="hidden" name="guildId" value={TARGET_GUILD_ID} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <ConfigInput label="Staff Log Channel" name="logs" defaultValue={config?.staffLogChannelId || ""} />
                    <ConfigInput label="Recruitment Feed" name="recruitment" defaultValue={config?.recruitmentChannelId || ""} />
                    <ConfigInput label="Welcome Port" name="welcome" defaultValue={config?.welcomeChannelId || ""} />
                    <ConfigInput label="Support Terminal" name="support" defaultValue={config?.supportChannelId || ""} />
                    <ConfigInput label="Rules Sector" name="rules" defaultValue={config?.rulesChannelId || ""} />
                    <ConfigInput label="Info Sector" name="info" defaultValue={config?.infoChannelId || ""} />
                    <ConfigInput label="HQ Category" name="category" defaultValue={config?.tribeCategoryId || ""} />
                    <ConfigInput label="Master Role(s)" name="role" defaultValue={config?.adminRoleIds || ""} />
                </div>
                <div className="pt-10 border-t border-white/[0.03] flex justify-end"><button type="submit" className="bg-white text-black font-[1000] px-12 py-5 rounded-[28px] hover:bg-cyan-400 transition-all text-xs uppercase italic flex items-center gap-3 shadow-xl"><Save size={18} /> Update Protocols</button></div>
             </form>
           </div>
        )}

      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function DesktopSidebarLink({ href, icon, active = false }: any) {
  return (
    <Link href={href} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-400 ${active ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] scale-110' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
      {icon}
    </Link>
  );
}

function MobileNavLink({ href, icon, active = false, showDivider = true }: any) {
  return (
    <Link href={href} className="relative flex-1 flex flex-col justify-center items-center py-5 transition-all duration-500 overflow-hidden">
      {active && (
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)] blur-lg" />
            <div className="absolute inset-0 flex justify-center items-center">
                <div className="w-16 h-10 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
            </div>
        </div>
      )}
      <div className={`relative z-10 transition-all duration-500 ${active ? 'text-black scale-110' : 'text-slate-500'}`}>
        {icon}
      </div>
      {showDivider && !active && (
        <div className="absolute right-0 h-6 w-[1px] bg-white/[0.05] rounded-full" />
      )}
    </Link>
  );
}

function StatCardBig({ label, value, unit, gradient, border }: any) {
    return (
        <div className={`bg-gradient-to-br ${gradient} ${border ? 'border border-white/[0.03]' : ''} rounded-[48px] p-12 shadow-2xl flex flex-col justify-between min-h-[300px]`}>
            <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${border ? 'text-slate-600' : 'text-black/40'}`}>{label}</p>
                <h3 className={`text-9xl font-[1000] tracking-tighter leading-none my-4 ${border ? 'text-white' : 'text-black'}`}>{value}</h3>
                <p className={`text-sm font-black uppercase tracking-widest ${border ? 'text-cyan-800' : 'text-black/60'}`}>{unit}</p>
            </div>
        </div>
    )
}

function ConfigInput({ label, name, defaultValue }: any) {
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-4 flex items-center gap-2 italic">{label}</label>
            <input name={name} defaultValue={defaultValue} className="w-full bg-[#080808] border border-white/[0.05] rounded-[28px] px-8 py-5 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500/30 transition-all shadow-inner" placeholder="NOT_SET" />
        </div>
    )
}
