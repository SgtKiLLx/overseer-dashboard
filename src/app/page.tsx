import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Settings, Save, Hash, Lock, Coins, BookOpen, ChevronRight, Bell, LayoutDashboard, Map as MapIcon } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
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

  // Data
  const registrations = await db.select().from(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.guildId, TARGET_GUILD_ID));
  const alphaClaims = await db.select().from(alphaClaimsTable).where(eq(alphaClaimsTable.guildId, TARGET_GUILD_ID));
  const configs = await db.select().from(guildConfigTable).where(eq(guildConfigTable.guildId, TARGET_GUILD_ID));
  const config = configs[0];
  const tribeCount = new Set(registrations.filter(r => r.status === 'verified').map(r => r.tribeName)).size;

  const parseCoords = (c: string) => {
    const p = c.split(/[, ]+/).map(x => parseFloat(x.trim()));
    return { top: `${p[0]}%`, left: `${p[1]}%`, valid: !isNaN(p[0]) && !isNaN(p[1]) };
  };

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

  async function denyAlpha(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
  // This removes the claim from the database entirely
    await db.delete(alphaClaimsTable).where(eq(alphaClaimsTable.id, id));
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
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f0f0f] border-r border-white/10 hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="h-14 flex items-center px-6 border-b border-white/10 gap-3">
          <Shield size={18} className="text-cyan-400" />
          <span className="font-bold text-white text-sm tracking-tight">Overseer</span>
        </div>

        <nav className="p-4 space-y-1">
          <SidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={18}/>} label="Intelligence" active={activeTab === "intelligence"} />
          <SidebarLink href="/?tab=map" icon={<MapIcon size={18}/>} label="Strategic Map" active={activeTab === "map"} />
          <SidebarLink href="/?tab=roster" icon={<Users size={18}/>} label="Survivor Roster" active={activeTab === "roster"} />
          <SidebarLink href="/?tab=alpha" icon={<Crown size={18}/>} label="Alpha Protocols" active={activeTab === "alpha"} />
          <SidebarLink href="/?tab=manual" icon={<BookOpen size={18}/>} label="System Manual" active={activeTab === "manual"} />
          <SidebarLink href="/?tab=settings" icon={<Settings size={18}/>} label="Configuration" active={activeTab === "settings"} />
        </nav>

        <div className="mt-auto p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 px-4 py-3">
            <img src={session.user?.image || ""} className="w-8 h-8 rounded-full border border-white/10" alt="User" />
            <span className="text-xs font-bold text-white truncate">{session.user?.name}</span>
          </div>
        </div>
      </aside>

      <Suspense fallback={<div className="h-14 bg-[#0f0f0f] w-full lg:hidden" />}>
        <MobileMenu session={session} />
      </Suspense>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* TOP BAR */}
        <div className="h-14 border-b border-white/10 bg-[#0f0f0f] px-6 hidden lg:flex items-center justify-between sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 tracking-wide">
                <span>Console</span>
                <ChevronRight size={12} />
                <span className="text-cyan-400 capitalize">{activeTab}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-bold text-green-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    System Active
                </div>
                <Bell size={18} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
            </div>
        </div>

        <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-6xl mx-auto space-y-10">
            
            {/* SECTOR 1: INTELLIGENCE */}
            {activeTab === "intelligence" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
                        Welcome back, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 pr-4">
                            {session.user?.name}
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Verified Tribes" value={tribeCount} icon={<Shield size={20} className="text-cyan-500"/>} />
                        <StatCard label="Total Roster" value={registrations.length} icon={<Users size={20} className="text-blue-500"/>} />
                        <StatCard label="Alpha Entries" value={alphaClaims.length} icon={<Crown size={20} className="text-amber-500"/>} />
                    </div>
                </div>
            )}

            {/* SECTOR 2: STRATEGIC MAP */}
            {activeTab === "map" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Strategic Map</h3>
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                        <div className="relative aspect-square w-full bg-slate-900 rounded-xl overflow-hidden border border-white/5">
                            <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                            {alphaClaims.map(claim => {
                                const pos = parseCoords(claim.coordinates);
                                if (!pos.valid) return null;
                                return (
                                    <div key={claim.id} className="absolute group" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}>
                                        <div className="w-6 h-6 bg-yellow-400 rounded-full animate-ping absolute opacity-20" />
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-black shadow-lg shadow-yellow-500/50" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* SECTOR 3: ROSTER */}
            {activeTab === "roster" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Survivor Database</h3>
                        <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 gap-2">
                            <Search size={14} className="text-slate-500" />
                            <input className="bg-transparent border-none outline-none text-xs w-48" placeholder="Search signatures..." />
                        </div>
                    </div>
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-white/5">
                                <tr><th className="p-4">Tribe</th><th className="p-4">Survivor</th><th className="p-4 text-right">Protocol</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {registrations.map(reg => (
                                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-bold text-white">{reg.tribeName}</td>
                                        <td className="p-4 text-slate-400">{reg.ign} <span className="text-[10px] ml-2 text-cyan-800 font-mono">[{reg.xboxGamertag}]</span></td>
                                        <td className="p-4 text-right">
                                            <form action={wipeSurvivor}><input type="hidden" name="id" value={reg.id}/><button className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16}/></button></form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SECTOR 4: ALPHA CLAIMS */}
            {activeTab === "alpha" && (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    {/* LEFT SIDE: INTELLIGENCE LOGS (2/3) */}
    <div className="xl:col-span-2 space-y-6">
      <h3 className="text-xl font-bold text-white px-2">Intelligence Logs</h3>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-white/5">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Protocol</th>
              <th className="p-4">Subject</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-[12px]">
            {/* Using registrations as a "Recent Activity" log */}
            {registrations.slice(0, 10).map((reg) => (
              <tr key={reg.id} className="hover:bg-white/[0.02]">
                <td className="p-4 text-slate-600">
                  {new Date(reg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-4">
                  <span className="text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                    SIGNATURE_REG
                  </span>
                </td>
                <td className="p-4 text-slate-300">
                  {reg.ign} joined <span className="text-white font-bold">{reg.tribeName}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* RIGHT SIDE: ALPHA CLAIMS (1/3) */}
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white px-2 text-amber-500">Pending Authorization</h3>
      <div className="space-y-4">
        {alphaClaims.length === 0 && (
          <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-slate-600 italic text-sm">
            No active claims in sector.
          </div>
        )}
        
        {alphaClaims.map(claim => (
          <div key={claim.id} className={`bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl space-y-5 transition-all shadow-xl ${claim.status === 'approved' ? 'opacity-40 grayscale' : ''}`}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-lg">{claim.tribeName}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${claim.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {claim.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <p className="text-slate-500 uppercase text-[9px] mb-1">Coords</p>
                <p className="font-bold text-white">{claim.coordinates}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <p className="text-slate-500 uppercase text-[9px] mb-1">Units</p>
                <p className="font-bold text-white">{claim.memberCount}</p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {claim.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <form action={verifyAlpha} className="flex-1">
                  <input type="hidden" name="id" value={claim.id} />
                  <button type="submit" className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-cyan-400 transition text-xs uppercase tracking-wide">
                    Authorize
                  </button>
                </form>

                <form action={denyAlpha}>
                  <input type="hidden" name="id" value={claim.id} />
                  <button type="submit" className="px-4 bg-red-500/10 text-red-500 font-bold py-2.5 rounded-xl hover:bg-red-500 hover:text-white transition text-xs uppercase tracking-wide">
                    Deny
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

  </div>
)}
            )}

            {/* SECTOR 5: MANUAL */}
            {activeTab === "manual" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <h3 className="text-2xl font-bold text-white tracking-tight">System Manual</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {overseerData.protocols.public_survivor_commands.map(cmd => (
                            <div key={cmd.command} className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl group hover:border-cyan-500/30 transition-colors">
                                <code className="text-cyan-400 font-bold text-sm">{cmd.command}</code>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">{cmd.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECTOR 6: CONFIGURATION */}
            {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Configuration</h3>
                    <form action={updateConfig} className="bg-[#0f0f0f] border border-white/10 rounded-xl p-8 space-y-6 max-w-4xl shadow-2xl">
                        <input type="hidden" name="guildId" value={TARGET_GUILD_ID} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ConfigInput label="Staff Log Channel" name="logs" defaultValue={config?.staffLogChannelId || ""} />
                            <ConfigInput label="Recruitment Feed" name="recruitment" defaultValue={config?.recruitmentChannelId || ""} />
                            <ConfigInput label="Welcome Port" name="welcome" defaultValue={config?.welcomeChannelId || ""} />
                            <ConfigInput label="HQ Category" name="category" defaultValue={config?.tribeCategoryId || ""} />
                            <ConfigInput label="Rules Sector" name="rules" defaultValue={config?.rulesChannelId || ""} />
                            <ConfigInput label="Info Sector" name="info" defaultValue={config?.infoChannelId || ""} />
                            <ConfigInput label="Support Terminal" name="support" defaultValue={config?.supportChannelId || ""} />
                            <ConfigInput label="Master Admin Role" name="role" defaultValue={config?.adminRoleIds || ""} />
                        </div>
                        <button type="submit" className="bg-white text-black font-bold px-8 py-3 rounded-lg hover:bg-cyan-400 transition-all text-xs tracking-widest flex items-center gap-2 shadow-lg">
                            <Save size={16} /> Sync Protocols
                        </button>
                    </form>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

// --- UI COMPONENTS ---

function SidebarLink({ href, icon, label, active }: any) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
      {icon} {label}
    </Link>
  );
}

function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-xl space-y-4 hover:border-white/20 transition-all shadow-md">
            <div className="text-slate-500 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">{label} {icon}</div>
            <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
        </div>
    )
}

function ConfigInput({ label, name, defaultValue }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1">{label}</label>
            <input name={name} defaultValue={defaultValue} className="w-full bg-[#161616] border border-white/5 rounded-lg px-4 py-3 text-sm text-cyan-400 font-mono focus:outline-none focus:border-cyan-500/40 transition-all placeholder:text-slate-800 shadow-inner" />
        </div>
    )
}
