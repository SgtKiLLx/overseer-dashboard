import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Bell, LayoutDashboard, Map as MapIcon, Settings, Save, Hash, Lock, Coins } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";

const TARGET_GUILD_ID = "1488515896807919667";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const activeTab = searchParams.tab || "intelligence";

  // Data Fetching
  const registrations = await db.select().from(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.guildId, TARGET_GUILD_ID));
  const alphaClaims = await db.select().from(alphaClaimsTable).where(eq(alphaClaimsTable.guildId, TARGET_GUILD_ID));
  const configs = await db.select().from(guildConfigTable).where(eq(guildConfigTable.guildId, TARGET_GUILD_ID));
  const config = configs[0];
  const tribeCount = new Set(registrations.filter(r => r.status === 'verified').map(r => r.tribeName)).size;

  // Actions
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

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans flex flex-col lg:flex-row pb-32">
      
      {/* DESKTOP SIDEBAR (SLIM) */}
      <aside className="w-20 border-r border-white/5 bg-[#050505] hidden lg:flex flex-col items-center py-8 sticky top-0 h-screen">
          <div className="w-10 h-10 mce-active-pill rounded-xl flex items-center justify-center mb-10 shadow-lg">
             <Shield className="text-white" size={20} />
          </div>
          <nav className="space-y-6">
            <SidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={22}/>} active={activeTab === "intelligence"} />
            <SidebarLink href="/?tab=map" icon={<MapIcon size={22}/>} active={activeTab === "map"} />
            <SidebarLink href="/?tab=roster" icon={<Users size={22}/>} active={activeTab === "roster"} />
            <SidebarLink href="/?tab=alpha" icon={<Crown size={22}/>} active={activeTab === "alpha"} />
            <SidebarLink href="/?tab=settings" icon={<Settings size={22}/>} active={activeTab === "settings"} />
          </nav>
      </aside>

      {/* MOBILE NAV (SLIM MCE EDITION) */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[320px]">
        <div className="mce-bevel-out bg-[#080808]/90 backdrop-blur-2xl rounded-[32px] overflow-hidden flex justify-around items-center p-1 relative border border-white/10">
            <div className="mce-gloss absolute inset-0 rounded-[32px]" />
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={18} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={18} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={18} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={18} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={18} />} active={activeTab === "settings"} showDivider={false} />
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full pt-16 lg:pt-12 transition-all">
        
        {/* HERO SECTION - SLIMMER */}
        <header className="mb-12">
            <p className="text-cyan-500 text-[9px] font-black uppercase tracking-[0.4em] mb-3 ml-1">Protocol: Command</p>
            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-none mb-4">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 pr-4">{session.user?.name}</span>
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-xl mce-bevel-out">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_cyan]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tribeCount} Tribes Active</span>
            </div>
        </header>

        {/* CONTENT SECTORS */}
        <div className="max-w-2xl mx-auto">
          {activeTab === "intelligence" && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
                <StatCard label="Network Load" value={tribeCount} unit="Verified Tribes" color="from-cyan-500 to-blue-600" />
                <StatCard label="Survivor Signatures" value={registrations.length} unit="Total Users" color="from-slate-800 to-black" />
            </div>
          )}

          {activeTab === "roster" && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <h3 className="text-xl font-black uppercase text-white tracking-tighter ml-2">Global Roster</h3>
               <div className="mce-bevel-out bg-[#050505] rounded-[32px] overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto touch-pan-x">
                      <table className="w-full text-left min-w-[500px]">
                          <thead className="bg-white/[0.02] border-b border-white/5 font-black text-[9px] uppercase tracking-widest text-slate-600">
                              <tr><th className="p-6">Tribe</th><th className="p-6">Survivor</th><th className="p-6 text-right pr-10">Delete</th></tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.02]">
                              {registrations.map(reg => (
                                  <tr key={reg.id} className="group transition-all">
                                      <td className="p-6"><span className="font-bold text-sm uppercase text-white">{reg.tribeName}</span></td>
                                      <td className="p-6 text-sm font-medium text-slate-400">{reg.ign}</td>
                                      <td className="p-6 text-right pr-8">
                                          <form action={wipeSurvivor}><input type="hidden" name="id" value={reg.id} /><button className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all transform active:scale-90"><Trash2 size={16} /></button></form>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
               </div>
            </div>
          )}

          {/* Settings Tab - Slim MCE Form */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
               <h3 className="text-xl font-black uppercase text-white tracking-tighter ml-2">Configuration</h3>
               <form action={updateConfig} className="mce-bevel-out bg-[#050505] rounded-[40px] p-8 md:p-10 space-y-8">
                  <input type="hidden" name="guildId" value={TARGET_GUILD_ID} />
                  <div className="grid grid-cols-1 gap-6">
                      <ConfigInput label="Staff Log ID" name="logs" defaultValue={config?.staffLogChannelId || ""} />
                      <ConfigInput label="Recruitment ID" name="recruitment" defaultValue={config?.recruitmentChannelId || ""} />
                      <ConfigInput label="Welcome ID" name="welcome" defaultValue={config?.welcomeChannelId || ""} />
                      <ConfigInput label="Support ID" name="support" defaultValue={config?.supportChannelId || ""} />
                  </div>
                  <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all text-xs uppercase italic flex justify-center items-center gap-2 shadow-xl">
                      <Save size={18} /> Sync Protocols
                  </button>
               </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function SidebarLink({ href, icon, active = false }: any) {
  return (
    <Link href={href} className={`p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-white text-black shadow-lg scale-110' : 'text-slate-600 hover:text-white'}`}>
      {icon}
    </Link>
  );
}

function MobileNavLink({ href, icon, active = false, showDivider = true }: any) {
  return (
    <Link href={href} className="relative flex-1 flex flex-col justify-center items-center py-5 transition-all">
      {active && (
        <div className="absolute inset-0 flex justify-center items-center z-0">
            <div className="w-12 h-12 bg-white rounded-full blur-xl opacity-10 absolute" />
            <div className="w-14 h-8 bg-white rounded-full absolute shadow-[0_2px_10px_rgba(255,255,255,0.4)]" />
        </div>
      )}
      <div className={`relative z-10 transition-all duration-500 ${active ? 'text-black scale-110' : 'text-slate-500'}`}>{icon}</div>
      {showDivider && !active && <div className="absolute right-0 h-6 w-[1px] bg-white/[0.05] rounded-full" />}
    </Link>
  );
}

function StatCard({ label, value, unit, color }: any) {
    return (
        <div className={`bg-gradient-to-br ${color} mce-bevel-out rounded-[40px] p-8 shadow-2xl flex flex-col justify-between min-h-[220px]`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{label}</p>
              <h3 className="text-7xl font-black tracking-tighter my-2">{value}</h3>
              <p className="text-xs font-black uppercase tracking-widest opacity-60">{unit}</p>
            </div>
        </div>
    )
}

function ConfigInput({ label, name, defaultValue }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4 italic">{label}</label>
            <input name={name} defaultValue={defaultValue} className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500/30 transition-all shadow-inner" />
        </div>
    )
              }
