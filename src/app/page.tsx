import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Settings, Save, Hash, Lock, Coins, Zap, BookOpen, Bell, LayoutDashboard, Map as MapIcon, Radio } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import PageAnimate from "../components/PageAnimate";

const TARGET_GUILD_ID = "1488515896807919667";

const overseerData = {
  protocols: {
    public: [
      { "c": "/register", "d": "Initialize new tribe signature." },
      { "c": "/join", "d": "Sync with verified tribe signature." },
      { "c": "/lft", "d": "Deploy recruitment resume to feed." },
      { "c": "/my-tribe", "d": "View signature and balance." },
      { "c": "/bal", "d": "Check Tek Coin holdings." },
      { "c": "/shop", "d": "Browse Tek-Market inventory." },
      { "c": "/buy", "d": "Authorize market purchase." },
      { "c": "/bounty", "d": "Place reward on rival tribe." }
    ],
    staff: [
      { "c": "/setup", "d": "Master sector configuration." },
      { "c": "/list-tribes", "d": "Full server-wide signature audit." },
      { "c": "/kick-member", "d": "Force signature removal." },
      { "c": "/add-coins", "d": "Administratively grant coins." },
      { "c": "/add-item", "d": "Stock market inventory." }
    ]
  }
};

export default async function AdminDashboard({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const activeTab = searchParams.tab || "intelligence";

  // Data Fetching
  const registrations = await db.select().from(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.guildId, TARGET_GUILD_ID)).orderBy(desc(tribeRegistrationsTable.createdAt));
  const alphaClaims = await db.select().from(alphaClaimsTable).where(eq(alphaClaimsTable.guildId, TARGET_GUILD_ID));
  const configs = await db.select().from(guildConfigTable).where(eq(guildConfigTable.guildId, TARGET_GUILD_ID));
  const config = configs[0];
  const tribeCount = new Set(registrations.filter(r => r.status === 'verified').map(r => r.tribeName)).size;

  const parseCoords = (c: string) => {
    if (!c) return { top: '0%', left: '0%', valid: false };
    const p = c.split(/[, ]+/).map(x => parseFloat(x.trim()));
    return { top: `${p[0]}%`, left: `${p[1]}%`, valid: !isNaN(p[0]) && !isNaN(p[1]) };
  };

  // --- SERVER ACTIONS ---
  async function broadcastAlert(formData: FormData) {
    "use server";
    await fetch("https://tribe-register-discord-bot.onrender.com/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: process.env.BROADCAST_KEY, message: formData.get("message"), guildId: TARGET_GUILD_ID })
    });
  }

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
    await db.insert(guildConfigTable).values({ guildId: gId, staffLogChannelId: formData.get("logs") as string, welcomeChannelId: formData.get("welcome") as string, rulesChannelId: formData.get("rules") as string, infoChannelId: formData.get("info") as string, recruitmentChannelId: formData.get("recruitment") as string, supportChannelId: formData.get("support") as string, tribeCategoryId: formData.get("category") as string, adminRoleIds: formData.get("role") as string, newsChannelId: formData.get("news") as string }).onConflictDoUpdate({ target: guildConfigTable.guildId, set: { staffLogChannelId: formData.get("logs") as string, welcomeChannelId: formData.get("welcome") as string, rulesChannelId: formData.get("rules") as string, infoChannelId: formData.get("info") as string, recruitmentChannelId: formData.get("recruitment") as string, supportChannelId: formData.get("support") as string, tribeCategoryId: formData.get("category") as string, adminRoleIds: formData.get("role") as string, newsChannelId: formData.get("news") as string, updatedAt: new Date() } });
    revalidatePath("/");
  }

  return (
    <div className="min-h-screen bg-[#020202] text-slate-300 font-sans flex flex-col lg:flex-row pb-32 lg:pb-0 selection:bg-cyan-500/30">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="w-80 border-r border-white/5 bg-[#080808] hidden lg:flex flex-col p-8 sticky top-0 h-screen shadow-2xl">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
            <img src="/icon.png" className="w-7 h-7 object-contain" alt="O" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white italic uppercase">Sentinel</h1>
        </div>
        <nav className="space-y-3 flex-1">
          <SidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={18}/>} label="Intelligence" active={activeTab === "intelligence"} />
          <SidebarLink href="/?tab=broadcast" icon={<Radio size={18}/>} label="Global Broadcast" active={activeTab === "broadcast"} />
          <SidebarLink href="/?tab=map" icon={<MapIcon size={18}/>} label="Strategic Map" active={activeTab === "map"} />
          <SidebarLink href="/?tab=roster" icon={<Users size={18}/>} label="Survivor Roster" active={activeTab === "roster"} />
          <SidebarLink href="/?tab=alpha" icon={<Crown size={18}/>} label="Alpha Protocols" active={activeTab === "alpha"} />
          <SidebarLink href="/?tab=manual" icon={<BookOpen size={18}/>} label="System Manual" active={activeTab === "manual"} />
          <SidebarLink href="/?tab=settings" icon={<Settings size={18}/>} label="Configuration" active={activeTab === "settings"} />
        </nav>
      </aside>

      {/* 2. MOBILE BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-lg">
        <div className="bg-black border border-white/10 rounded-[36px] overflow-hidden flex justify-around items-center p-1 shadow-2xl">
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={20} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=broadcast" icon={<Radio size={20} />} active={activeTab === "broadcast"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={20} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={20} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={20} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={20} />} active={activeTab === "settings"} showDivider={false} />
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full pt-16 lg:pt-12 transition-all">
        
        {activeTab === "intelligence" && (
          <PageAnimate id="intelligence">
            <header className="mb-12">
                <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight leading-none mb-4 uppercase">
                    Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 pr-4">{session.user?.name}</span>
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Protocol Active</span>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
                <StatCardBig label="Network Load" value={tribeCount} unit="Verified Tribes" gradient="from-cyan-500 to-blue-600" />
                <StatCardBig label="Survivor Population" value={registrations.length} unit="Total Signatures" gradient="from-slate-900 to-black" border />
            </div>
          </PageAnimate>
        )}

        {activeTab === "broadcast" && (
          <PageAnimate id="broadcast">
             <h3 className="text-2xl font-bold text-white mb-8 italic uppercase tracking-tighter">Global Broadcast</h3>
             <form action={broadcastAlert} className="bg-[#050505] border border-white/5 rounded-[40px] p-8 md:p-16 space-y-8 shadow-2xl">
                <textarea name="message" className="w-full bg-black border border-white/10 rounded-2xl px-8 py-6 text-sm text-cyan-400 focus:outline-none min-h-[250px]" placeholder="Enter system announcement..." />
                <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-red-500 transition-all text-xs uppercase italic flex items-center justify-center gap-3">
                    <Zap size={18} /> Initialize Global Blast
                </button>
             </form>
          </PageAnimate>
        )}

        {activeTab === "map" && (
          <PageAnimate id="map">
             <h3 className="text-2xl font-bold text-white mb-8 italic uppercase tracking-tighter">Strategic Map</h3>
             <div className="bg-[#050505] border border-white/5 rounded-[48px] p-3 shadow-2xl relative">
                <div className="relative aspect-square w-full rounded-[38px] overflow-hidden border border-white/10">
                    <div className="absolute inset-0 bg-cover bg-center grayscale-[0.2] opacity-80" style={{ backgroundImage: "url('https://ark.wiki.gg/images/c/cc/Fjordur_Topographic_Map.jpg')" }} />
                    {alphaClaims.filter(c => c.status === 'approved').map(claim => {
                        const pos = parseCoords(claim.coordinates);
                        if (!pos.valid) return null;
                        return <div key={claim.id} className="absolute" style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}><div className="w-8 h-8 bg-cyan-400 rounded-full animate-ping absolute opacity-20" /><div className="w-4 h-4 bg-cyan-400 rounded-full border-2 border-black shadow-[0_0_15px_rgba(34,211,238,0.8)]" /></div>
                    })}
                </div>
             </div>
          </PageAnimate>
        )}

        {activeTab === "roster" && (
          <PageAnimate id="roster">
            <h3 className="text-2xl font-bold text-white mb-8 italic uppercase tracking-tighter px-2">Survivor Roster</h3>
            <div className="bg-[#050505] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto touch-pan-x">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-white/5 font-black text-[9px] uppercase tracking-widest text-slate-500">
                            <tr><th className="p-6">Identification</th><th className="p-6">Survivor</th><th className="p-6 text-right pr-12">Wipe</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {registrations.map(reg => (
                                <tr key={reg.id} className="group hover:bg-white/[0.01]">
                                    <td className="p-6 font-bold text-sm uppercase text-white tracking-tight">{reg.tribeName}</td>
                                    <td className="p-6"><p className="text-sm font-semibold">{reg.ign}</p><p className="text-[10px] text-slate-600 uppercase italic tracking-widest">{reg.xboxGamertag}</p></td>
                                    <td className="p-6 text-right pr-10">
                                        <form action={wipeSurvivor}><input type="hidden" name="id" value={reg.id} /><button className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all transform active:scale-90"><Trash2 size={16} /></button></form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </PageAnimate>
        )}

        {activeTab === "alpha" && (
           <PageAnimate id="alpha">
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Intelligence Logs</h3>
                    <div className="bg-[#050505] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-[11px]">
                            <tbody className="divide-y divide-white/[0.02] font-mono">
                                {registrations.slice(0, 10).map(reg => (
                                    <tr key={reg.id} className="hover:bg-white/[0.01]">
                                        <td className="p-6 text-slate-400 uppercase">{reg.ign} initialized to {reg.tribeName}</td>
                                        <td className="p-6 text-slate-600">{new Date(reg.createdAt).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-amber-500 uppercase italic tracking-tight">Pending Alpha</h3>
                    {alphaClaims.map(claim => (
                        <div key={claim.id} className={`bg-[#0A0A0A] border border-white/5 p-8 rounded-[40px] space-y-6 ${claim.status === 'approved' ? 'opacity-40 grayscale' : ''}`}>
                            <h4 className="text-xl font-black text-white uppercase">{claim.tribeName}</h4>
                            <div className="flex gap-2">
                                <form action={verifyAlpha} className="flex-1"><input type="hidden" name="id" value={claim.id}/><button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl text-[10px] uppercase">Authorize</button></form>
                                <form action={denyAlpha}><input type="hidden" name="id" value={claim.id}/><button type="submit" className="px-4 bg-red-500/10 text-red-500 font-bold py-4 rounded-2xl text-[10px] uppercase">Deny</button></form>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
           </PageAnimate>
        )}

        {activeTab === "manual" && (
           <PageAnimate id="manual">
              <h3 className="text-2xl font-bold text-white mb-8 italic uppercase tracking-tighter">System Manual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {overseerData.protocols.public.map(cmd => (
                    <div key={cmd.c} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px]">
                        <code className="text-cyan-400 font-bold text-sm uppercase">{cmd.c}</code>
                        <p className="text-slate-500 text-xs mt-1">{cmd.d}</p>
                    </div>
                 ))}
              </div>
           </PageAnimate>
        )}

        {activeTab === "settings" && (
           <PageAnimate id="settings">
             <h3 className="text-2xl font-bold text-white mb-8 italic uppercase tracking-tighter px-2">Configuration</h3>
             <form action={updateConfig} className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-8 md:p-12 space-y-10 shadow-2xl">
                <input type="hidden" name="guildId" value={TARGET_GUILD_ID} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ConfigInput label="Logs ID" name="logs" defaultValue={config?.staffLogChannelId || ""} />
                    <ConfigInput label="Recruit ID" name="recruitment" defaultValue={config?.recruitmentChannelId || ""} />
                    <ConfigInput label="Welcome ID" name="welcome" defaultValue={config?.welcomeChannelId || ""} />
                    <ConfigInput label="Support ID" name="support" defaultValue={config?.supportChannelId || ""} />
                    <ConfigInput label="News ID" name="news" defaultValue={config?.newsChannelId || ""} />
                    <ConfigInput label="Admin ID" name="role" defaultValue={config?.adminRoleIds || ""} />
                </div>
                <div className="flex justify-end pt-6 border-t border-white/5"><button type="submit" className="bg-white text-black font-black px-10 py-4 rounded-2xl hover:bg-cyan-400 transition-all text-xs uppercase italic flex items-center gap-2 shadow-xl"><Save size={18}/> Sync Protocols</button></div>
             </form>
           </PageAnimate>
        )}
      </main>
    </div>
  );
}

function SidebarLink({ href, icon, label, active = false }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-6 py-4 rounded-[28px] transition-all duration-500 ${active ? 'bg-white text-black shadow-2xl translate-x-2' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
      {icon}<span className="text-sm font-black uppercase tracking-tight italic">{label}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon, active = false, showDivider = true }: any) {
  return (
    <Link href={href} className="relative flex-1 flex flex-col justify-center items-center py-6 transition-all duration-500">
      {active && (
        <div className="absolute inset-0 flex justify-center items-center">
            <div className="absolute inset-y-0 w-full bg-gradient-to-b from-white/[0.02] via-white/[0.1] to-transparent" />
            <div className="w-14 h-8 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] absolute z-10" />
            <div className="absolute top-0 w-10 h-[3px] bg-cyan-400 rounded-full shadow-[0_0_15px_#00ffff]" />
        </div>
      )}
      <div className={`relative z-10 transition-all duration-500 ${active ? 'text-black scale-110' : 'text-slate-500'}`}>{icon}</div>
      {showDivider && !active && <div className="absolute right-0 h-6 w-[1px] bg-white/[0.05] rounded-full" />}
    </Link>
  );
}

function StatCardBig({ label, value, unit, gradient, border }: any) {
    const borderClass = border ? "border border-white/5" : "";
    return (
        <div className={`bg-gradient-to-br ${gradient} ${borderClass} rounded-[48px] p-12 shadow-2xl flex flex-col justify-between min-h-[300px]`}>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{label}</p>
                <h3 className="text-9xl font-[1000] tracking-tighter leading-none my-4">{value}</h3>
                <p className="text-sm font-black uppercase tracking-widest opacity-60">{unit}</p>
            </div>
        </div>
    )
}

function ConfigInput({ label, name, defaultValue }: any) {
    return (
        <div className="space-y-4"><label className="text-[10px] font-black text-slate-600 uppercase tracking-
