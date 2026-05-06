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

  // Fetch Data
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
      
      {/* 1. SIDEBAR (POLISHED) */}
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

      {/* 2. MOBILE BOTTOM NAV (GOOGLE GLOW STYLE) */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
        <div className="bg-black/60 backdrop-blur-3xl border border-white/[0.08] rounded-[32px] p-2 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={22} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={22} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={22} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={22} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={22} />} active={activeTab === "settings"} />
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full pb-32 lg:pb-12">
        
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

        {activeTab === "roster" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic px-2">Global Roster</h3>
            <div className="bg-[#050505] border border-white/[0.05] rounded-[40px] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.02] font-black text-[10px] uppercase tracking-[0.3em] text-slate-600">
                        <tr><th className="p-8">Identification</th><th className="p-8">Survivor</th><th className="p-8 text-right pr-12">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {registrations.map(reg => (
                            <tr key={reg.id} className="group hover:bg-white/[0.01] transition-colors">
                                <td className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-cyan-500 font-black text-[10px] uppercase">{reg.tribeName.substring(0, 2)}</div>
                                        <span className="font-bold text-sm uppercase text-white tracking-tight">{reg.tribeName}</span>
                                    </div>
                                </td>
                                <td className="p-8"><p className="text-sm font-semibold text-slate-200">{reg.ign}</p><p className="text-[10px] text-cyan-900 font-mono uppercase font-bold">{reg.xboxGamertag}</p></td>
                                <td className="p-8 text-right pr-10">
                                    <form action={wipeSurvivor}><input type="hidden" name="id" value={reg.id} /><button className="p-4 rounded-2xl bg-red-500/[0.02] text-red-500/20 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button></form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

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
                    <ConfigInput label="Master Role" name="role" defaultValue={config?.adminRoleIds || ""} icon={<Lock size={14}/>} />
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

// --- SUBCOMPONENTS (REFINED FOR STEALTH & GLOW) ---

function SidebarLink({ href, icon, label, active = false }: any) {
  return (
    <Link href={href} className={`flex items-center gap-5 px-6 py-4 rounded-[28px] cursor-pointer transition-all duration-500 ${active ? 'bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.1)] translate-x-2' : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'}`}>
      {icon}<span className="text-sm font-black uppercase tracking-tight italic">{label}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon, active = false }: any) {
  return (
    <Link href={href} className="relative group p-4">
      {active && (
        <div className="absolute inset-0 bg-white rounded-full scale-[0.8] blur-xl opacity-20 animate-pulse" />
      )}
      <div className={`relative z-10 p-3 rounded-2xl transition-all duration-500 ${active ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] scale-110' : 'text-slate-600'}`}>
        {icon}
      </div>
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
