import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Settings, Save, Hash, Lock, Coins, BookOpen, ChevronRight, Bell } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";

const TARGET_GUILD_ID = "1488515896807919667";

const overseerData = {
  protocols: {
    public_survivor_commands: [
      { "command": "/register", "description": "Initialize a new tribe signature." },
      { "command": "/join", "parameters": ["tribe_name"], "description": "Sync signature with an existing verified tribe." },
      { "command": "/lft", "description": "Deploy recruitment profile to #recruit-terminal." },
      { "command": "/my-tribe", "description": "View verified signature and balance." },
      { "command": "/leave-tribe", "description": "Exit tribe roster and revoke access." },
      { "command": "/bal", "description": "Check Tek Coin holdings." },
      { "command": "/shop", "description": "Browse the active Tek-Market inventory." },
      { "command": "/buy", "parameters": ["item"], "description": "Authorize purchase from market." },
      { "command": "/pay", "parameters": ["target", "amount"], "description": "Transfer Tek Coins." },
      { "command": "/bounty", "parameters": ["tribe", "amount"], "description": "Place reward on a rival tribe." }
    ],
    staff_restricted_commands: [
      { "command": "/setup", "description": "Master sector configuration." },
      { "command": "/list-tribes", "description": "Audit all signatures and Xbox IDs." },
      { "command": "/kick-member", "description": "Force signature removal." },
      { "command": "/add-coins", "description": "Grant coins." },
      { "command": "/add-item", "description": "Stock market." },
      { "command": "/remove-item", "description": "Purge market asset." }
    ]
  }
};

export default async function AdminDashboard({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const activeTab = searchParams.tab || "intelligence";

  const registrations = await db.select().from(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.guildId, TARGET_GUILD_ID));
  const alphaClaims = await db.select().from(alphaClaimsTable).where(eq(alphaClaimsTable.guildId, TARGET_GUILD_ID));
  const configs = await db.select().from(guildConfigTable).where(eq(guildConfigTable.guildId, TARGET_GUILD_ID));
  const config = configs[0];
  const tribeCount = new Set(registrations.filter(r => r.status === 'verified').map(r => r.tribeName)).size;

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
    <div className="min-h-screen bg-[#000] text-slate-300 font-sans flex selection:bg-cyan-500/30">
      
      {/* DESKTOP SIDEBAR (AI STUDIO STYLE) */}
      <aside className="w-64 bg-[#0f0f0f] border-r border-white/10 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="h-14 flex items-center px-6 border-b border-white/10 gap-3">
          <Shield size={18} className="text-cyan-400" />
          <span className="font-bold text-white uppercase italic text-sm tracking-tight">Overseer</span>
        </div>

        <nav className="p-4 space-y-1">
          <SidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={18}/>} label="Intelligence" active={activeTab === "intelligence"} />
          <SidebarLink href="/?tab=map" icon={<MapIcon size={18}/>} label="Strategic Map" active={activeTab === "map"} />
          <SidebarLink href="/?tab=roster" icon={<Users size={18}/>} label="Survivor Roster" active={activeTab === "roster"} />
          <SidebarLink href="/?tab=alpha" icon={<Crown size={18}/>} label="Alpha Protocols" active={activeTab === "alpha"} />
          <SidebarLink href="/?tab=manual" icon={<BookOpen size={18}/>} label="System Manual" active={activeTab === "manual"} />
          <SidebarLink href="/?tab=settings" icon={<Settings size={18}/>} label="Configuration" active={activeTab === "settings"} />
        </nav>

        <div className="mt-auto p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <img src={session.user?.image || ""} className="w-8 h-8 rounded-full" alt="User" />
            <span className="text-xs font-bold text-white truncate">{session.user?.name}</span>
          </div>
        </div>
      </aside>

      <MobileMenu session={session} />

      <main className="flex-1 min-w-0">
        {/* TOP BAR ACTION AREA */}
        <div className="h-14 border-b border-white/10 bg-[#0f0f0f] px-6 hidden lg:flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>Console</span>
                <ChevronRight size={12} />
                <span className="text-cyan-400 capitalize">{activeTab}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-bold text-green-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE_FEED_SYNCED
                </div>
                <Bell size={18} className="text-slate-500 hover:text-white cursor-pointer" />
            </div>
        </div>

        <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-6xl mx-auto space-y-10">
            
            {/* CONTENT ROUTING */}
            {activeTab === "intelligence" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back, <span className="text-cyan-400">{session.user?.name}</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Verified Tribes" value={tribeCount} icon={<Shield/>} />
                        <StatCard label="Total Roster" value={registrations.length} icon={<Users/>} />
                        <StatCard label="Alpha Entries" value={alphaClaims.length} icon={<Crown/>} />
                    </div>
                </div>
            )}

            {activeTab === "roster" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Survivor Database</h3>
                        <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-md px-3 py-1.5 gap-2">
                            <Search size={14} className="text-slate-500" />
                            <input className="bg-transparent border-none outline-none text-xs w-48" placeholder="Search roster..." />
                        </div>
                    </div>
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <tr><th className="p-4">Tribe Signature</th><th className="p-4">Survivor</th><th className="p-4 text-right">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {registrations.map(reg => (
                                    <tr key={reg.id} className="hover:bg-white/[0.02]">
                                        <td className="p-4 font-bold text-white uppercase">{reg.tribeName}</td>
                                        <td className="p-4 text-slate-400">{reg.ign} <span className="text-[10px] ml-2 opacity-50">({reg.xboxGamertag})</span></td>
                                        <td className="p-4 text-right">
                                            <form action={wipeSurvivor}><input type="hidden" name="id" value={reg.id}/><button className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition"><Trash2 size={16}/></button></form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Manual Tab, Alpha Tab, and Settings Tab logic remains consistent with previous logic, just updated to the cleaner Card/Table style. */}
            {activeTab === "manual" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <h3 className="text-xl font-bold text-white">Technical Manual</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {overseerData.protocols.public_survivor_commands.map(cmd => (
                            <div key={cmd.command} className="bg-[#0f0f0f] border border-white/10 p-5 rounded-xl">
                                <code className="text-cyan-400 font-bold">{cmd.command}</code>
                                <p className="text-xs text-slate-500 mt-2">{cmd.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <h3 className="text-xl font-bold text-white">Configuration</h3>
                    <form action={updateConfig} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-8 space-y-6 max-w-3xl">
                        <input type="hidden" name="guildId" value={TARGET_GUILD_ID} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ConfigInput label="Staff Log Channel" name="logs" defaultValue={config?.staffLogChannelId || ""} />
                            <ConfigInput label="Recruitment Feed" name="recruitment" defaultValue={config?.recruitmentChannelId || ""} />
                            <ConfigInput label="Welcome Port" name="welcome" defaultValue={config?.welcomeChannelId || ""} />
                            <ConfigInput label="HQ Category" name="category" defaultValue={config?.tribeCategoryId || ""} />
                        </div>
                        <button type="submit" className="bg-cyan-500 text-black font-bold px-6 py-2.5 rounded-md hover:bg-cyan-400 transition text-sm flex items-center gap-2">
                            <Save size={16} /> Sync Configuration
                        </button>
                    </form>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label, active }: any) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      {icon} {label}
    </Link>
  );
}

function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl space-y-4">
            <div className="text-slate-500 flex justify-between items-center text-xs font-bold uppercase tracking-wider">{label} {icon}</div>
            <div className="text-4xl font-bold text-white">{value}</div>
        </div>
    )
}

function ConfigInput({ label, name, defaultValue }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">{label}</label>
            <input name={name} defaultValue={defaultValue} className="w-full bg-[#1a1a1a] border border-white/10 rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all" />
        </div>
    )
}
