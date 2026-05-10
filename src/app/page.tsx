import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Settings, Save, Hash, Lock, Coins, Zap, BookOpen, Bell, LayoutDashboard, Map as MapIcon, XCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

const TARGET_GUILD_ID = "1488515896807919667";

// --- MASTER SYSTEM MANUAL DATA ---
const overseerData = {
  protocols: {
    public_survivor_commands: [
      { "command": "/register", "description": "Initialize a new tribe signature. Processed via the Gatekeeper protocol." },
      { "command": "/join", "parameters": ["tribe_name"], "description": "Sync signature with an existing verified tribe." },
      { "command": "/lft", "description": "Deploy a recruitment resume to the server recruitment feed." },
      { "command": "/my-tribe", "description": "Access your verified signature, Xbox credentials, and balance." },
      { "command": "/leave-tribe", "description": "Permanently exit your current tribe roster and revoke HQ access." },
      { "command": "/bal", "description": "Check Tek Coin holdings (passive activity rewards active)." },
      { "command": "/shop", "description": "Browse the active Tek-Market inventory of assets and kits." },
      { "command": "/buy", "parameters": ["item"], "description": "Authorize a market purchase and notify staff for delivery." },
      { "command": "/pay", "parameters": ["target", "amount"], "description": "Transfer Tek Coins between survivor signatures." },
      { "command": "/bounty", "parameters": ["tribe", "amount"], "description": "Place a coin reward on a rival tribe signature." },
      { "command": "/help", "description": "Display the technical manual for all Overseer systems." }
    ],
    staff_restricted_commands: [
      { "command": "/setup", "description": "Master sector configuration (Logs, Welcome, Rules, Recruitment, etc)." },
      { "command": "/list-tribes", "description": "Generate a server-wide audit of all signatures and Xbox IDs." },
      { "command": "/kick-member", "parameters": ["target"], "description": "Force signature removal and revoke HQ permissions." },
      { "command": "/add-coins", "parameters": ["target", "amount"], "description": "Administratively grant Tek Coins for rewards or compensation." },
      { "command": "/add-item", "parameters": ["name", "price", "category"], "description": "Register a new asset in the Tek-Market inventory." },
      { "command": "/remove-item", "parameters": ["item"], "description": "Purge an asset signature from the market database." },
      { "command": "/post-info", "description": "Deploy the primary Tribe Registration terminal." },
      { "command": "/post-support", "description": "Deploy the SOS Support SOS terminal." },
      { "command": "/post-alpha-terminal", "description": "Deploy the Alpha Status claim terminal." },
      { "command": "/post-recruitment", "description": "Deploy the LFT matchmaking terminal." },
      { "command": "/post-shop", "description": "Deploy the Tek-Market terminal." }
    ]
  }
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string; view?: string };
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const activeTab = searchParams.tab || "intelligence";

  // --- DATABASE QUERIES ---
  const registrations = await db.select().from(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.guildId, TARGET_GUILD_ID)).orderBy(desc(tribeRegistrationsTable.createdAt));
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

  async function denyAlpha(formData: FormData) {
    "use server";
    await db.delete(alphaClaimsTable).where(eq(alphaClaimsTable.id, Number(formData.get("id"))));
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
    <div className="min-h-screen bg-[#020202] text-slate-300 font-sans flex flex-col lg:flex-row pb-32 lg:pb-0">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="w-64 bg-[#080808] border-r border-white/5 hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
          <Shield size={20} className="text-cyan-400" />
          <span className="font-bold text-white text-sm tracking-tight uppercase italic">Overseer OS</span>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          <SidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={18}/>} label="Intelligence" active={activeTab === "intelligence"} />
          <SidebarLink href="/?tab=map" icon={<MapIcon size={18}/>} label="Strategic Map" active={activeTab === "map"} />
          <SidebarLink href="/?tab=roster" icon={<Users size={18}/>} label="Survivor Roster" active={activeTab === "roster"} />
          <SidebarLink href="/?tab=alpha" icon={<Crown size={18}/>} label="Alpha Protocols" active={activeTab === "alpha"} />
          <SidebarLink href="/?tab=manual" icon={<BookOpen size={18}/>} label="System Manual" active={activeTab === "manual"} />
          <SidebarLink href="/?tab=settings" icon={<Settings size={18}/>} label="Configuration" active={activeTab === "settings"} />
        </nav>
        <div className="mt-auto p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg">
            <img src={session.user?.image || ""} className="w-8 h-8 rounded-full border border-white/10" alt="U" />
            <span className="text-xs font-bold text-white truncate">{session.user?.name}</span>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION (FULL GLOW + DIVIDERS) */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[88%] max-w-sm">
        <div className="mce-bevel-out bg-[#050505]/90 backdrop-blur-3xl border border-white/[0.05] rounded-[32px] overflow-hidden flex justify-between items-center h-16 shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
            <div className="mce-gloss absolute inset-0 rounded-[32px]" />
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={18} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={18} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={18} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={18} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=manual" icon={<BookOpen size={18} />} active={activeTab === "manual"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={18} />} active={activeTab === "settings"} showDivider={false} />
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full pt-14 lg:pt-12 transition-all">
        
        {/* TAB 1: INTELLIGENCE */}
        {activeTab === "intelligence" && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tight leading-none mb-4">Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">{session.user?.name}</span></h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_cyan]" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{tribeCount} Verified Tribes</span>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StatCardBig label="Database Load" value={tribeCount} unit="Verified Tribes" gradient="from-cyan-500 to-blue-600" />
                <StatCardBig label="Survivor Pop" value={registrations.length} unit="Total Roster" gradient="from-slate-900 to-black" border />
            </div>
          </div>
        )}

        {/* TAB 2: STRATEGIC MAP */}
        {activeTab === "map" && (
           <div className="space-y-6 animate-in fade-in duration-500">
             <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">Strategic Map: Fjordur</h3>
             <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-3 shadow-2xl relative">
                <div className="relative aspect-square w-full rounded-[32px] overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                    {alphaClaims.filter(c => c.status === 'approved').map(claim => {
                        const pos = parseCoords(claim.coordinates);
                        if (!pos.valid) return null;
                        return <div key={claim.id} className="absolute" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}><div className="w-8 h-8 bg-cyan-400 rounded-full animate-ping absolute opacity-20" /><div className="w-4 h-4 bg-cyan-400 rounded-full border-2 border-black shadow-lg" /></div>
                    })}
                </div>
             </div>
           </div>
        )}

        {/* TAB 3: ROSTER */}
        {activeTab === "roster" && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">Survivor Signatures</h3>
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                 <div className="overflow-x-auto touch-pan-x">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-white/5 font-black text-[9px] uppercase tracking-widest text-slate-500">
                            <tr><th className="p-6">Identification</th><th className="p-6">Survivor</th><th className="p-6">Wealth</th><th className="p-6">Status</th><th className="p-6 text-right pr-12">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {registrations.map(reg => (
                                <tr key={reg.id} className="group hover:bg-white/[0.01]">
                                    <td className="p-6"><div className="flex items-center gap-4 font-bold text-sm uppercase text-white">{reg.tribeName}</div></td>
                                    <td className="p-6"><p className="text-sm font-semibold">{reg.ign}</p><p className="text-[10px] text-cyan-800 font-mono">{reg.xboxGamertag}</p></td>
                                    <td className="p-6 text-cyan-400 font-bold"><Coins size={14} className="inline mr-1" />{reg.tekCoins}</td>
                                    <td className="p-6"><span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${reg.status === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{reg.status}</span></td>
                                    <td className="p-6 text-right pr-10">
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

        {/* TAB 4: ALPHA SECTOR (WITH LOGS AND DENY) */}
        {activeTab === "alpha" && (
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
              <div className="xl:col-span-2 space-y-6">
                  <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Intelligence Logs</h3>
                  <div className="bg-[#050505] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 text-[9px] uppercase font-bold text-slate-500 tracking-widest border-b border-white/5">
                              <tr><th className="p-4">Protocol</th><th className="p-4">Subject</th><th className="p-4">Timestamp</th></tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.02] font-mono">
                              {registrations.slice(0, 10).map(reg => (
                                  <tr key={reg.id} className="hover:bg-white/[0.01]">
                                      <td className="p-4 text-cyan-500 font-bold">SIGNATURE_REG</td>
                                      <td className="p-4 text-slate-300">{reg.ign} synced with {reg.tribeName}</td>
                                      <td className="p-4 text-slate-600">{new Date(reg.createdAt).toLocaleTimeString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
              <div className="space-y-6">
                  <h3 className="text-xl font-bold text-amber-500 uppercase italic tracking-tight">Pending Alpha</h3>
                  {alphaClaims.map(claim => (
                    <div key={claim.id} className={`bg-[#0A0A0A] border border-white/5 p-6 rounded-[32px] space-y-4 ${claim.status === 'approved' ? 'opacity-40 grayscale' : ''}`}>
                        <div className="flex justify-between items-center"><h4 className="font-bold text-white uppercase">{claim.tribeName}</h4><span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${claim.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{claim.status}</span></div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/5 p-3 rounded-2xl"><div>Coords: {claim.coordinates}</div><div>Units: {claim.memberCount}</div></div>
                        {claim.status === 'pending' && <div className="flex gap-2"><form action={verifyAlpha} className="flex-1"><input type="hidden" name="id" value={claim.id}/><button className="w-full bg-white text-black font-bold py-2 rounded-xl text-[10px] uppercase transition-all active:scale-95">Authorize</button></form><form action={denyAlpha}><input type="hidden" name="id" value={claim.id}/><button className="px-4 bg-red-500/10 text-red-500 font-bold py-2 rounded-xl text-[10px] uppercase transition-all active:scale-95">Deny</button></form></div>}
                    </div>
                  ))}
              </div>
           </div>
        )}

        {/* TAB 5: SYSTEM MANUAL */}
        {activeTab === "manual" && (
           <div className="space-y-12 animate-in fade-in duration-500 pb-20">
              <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic">System Manual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {overseerData.protocols.public_survivor_commands.map(cmd => (
                    <div key={cmd.command} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] transition-all hover:border-cyan-500/20">
                        <code className="text-cyan-400 font-bold text-base uppercase tracking-tight">{cmd.command}</code>
                        <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">{cmd.description}</p>
                    </div>
                 ))}
              </div>
              <div className="bg-[#050505] border border-white/5 rounded-[40px] overflow-hidden">
                <div className="p-6 bg-white/5 border-b border-white/5"><h4 className="text-red-500 text-xs font-black uppercase tracking-[0.4em]">Authorized_Staff_Protocols</h4></div>
                <table className="w-full text-left text-sm"><tbody>
                    {overseerData.protocols.staff_restricted_commands.map(cmd => (
                        <tr key={cmd.command} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01]">
                            <td className="p-6"><code className="text-red-400 font-bold text-xs uppercase">{cmd.command}</code><p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tight">{cmd.description}</p></td>
                        </tr>
                    ))}
                </tbody></table>
              </div>
           </div>
        )}

        {/* TAB 6: SYSTEM CONFIG */}
        {activeTab === "settings" && (
           <div className="space-y-6 animate-in fade-in duration-500 pb-20">
             <h3 className="text-3xl font-black uppercase text-white tracking-tighter italic">Configuration</h3>
             <form action={updateConfig} className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-10">
                <input type="hidden" name="guildId" value={TARGET_GUILD_ID} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ConfigInput label="Staff Log ID" name="logs" defaultValue={config?.staffLogChannelId || ""} />
                    <ConfigInput label="Welcome Port" name="welcome" defaultValue={config?.welcomeChannelId || ""} />
                    <ConfigInput label="Recruitment Feed" name="recruitment" defaultValue={config?.recruitmentChannelId || ""} />
                    <ConfigInput label="Support Terminal" name="support" defaultValue={config?.supportChannelId || ""} />
                    <ConfigInput label="Rules Sector" name="rules" defaultValue={config?.rulesChannelId || ""} />
                    <ConfigInput label="Info Sector" name="info" defaultValue={config?.infoChannelId || ""} />
                    <ConfigInput label="HQ Category" name="category" defaultValue={config?.tribeCategoryId || ""} />
                    <ConfigInput label="Master Role(s)" name="role" defaultValue={config?.adminRoleIds || ""} />
                </div>
                <div className="flex justify-end pt-6 border-t border-white/5"><button type="submit" className="bg-white text-black font-black px-10 py-4 rounded-2xl hover:bg-cyan-400 transition-all text-xs uppercase italic flex items-center gap-2 shadow-xl"><Save size={18}/> Sync Protocols</button></div>
             </form>
           </div>
        )}

      </main>
    </div>
  );
}

// --- UI COMPONENTS ---

function SidebarLink({ href, icon, label, active }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
      {icon} {label}
    </Link>
  );
}

function MobileNavLink({ href, icon, active = false, showDivider = true }: any) {
  return (
    <Link href={href} className="relative flex-1 flex flex-col justify-center items-center py-5 transition-all duration-500">
      {active && (
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)] blur-lg" />
            <div className="absolute inset-0 flex justify-center items-center"><div className="w-16 h-10 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]" /></div>
        </div>
      )}
      <div className={`relative z-10 transition-all duration-500 ${active ? 'text-black scale-110' : 'text-slate-500'}`}>{icon}</div>
      {showDivider && !active && <div className="absolute right-0 h-6 w-[1px] bg-white/[0.05] rounded-full" />}
    </Link>
  );
}

function StatCardBig({ label, value, unit, gradient, border }: any) {
    return (
        <div className={`bg-gradient-to-br ${gradient} ${border ? 'border border-white/5' : ''} rounded-[40px] p-10 shadow-2xl flex flex-col justify-between min-h-[260px]`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{label}</p>
              <h3 className={`text-8xl font-black tracking-tighter my-2 ${border ? 'text-white' : 'text-black'}`}>{value}</h3>
              <p className={`text-xs font-black uppercase tracking-widest ${border ? 'text-cyan-800' : 'text-black/60'}`}>{unit}</p>
            </div>
        </div>
    )
}

function ConfigInput({ label, name, defaultValue }: any) {
    return (
        <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-600 uppercase ml-4 italic tracking-widest">{label}</label>
            <input name={name} defaultValue={defaultValue} className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500/30 transition-all shadow-inner" />
        </div>
    )
}
