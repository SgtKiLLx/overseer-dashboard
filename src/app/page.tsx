import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable, guildConfigTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Bell, LayoutDashboard, Map as MapIcon, Settings, Save, Hash, Lock, Coins, Zap, BookOpen } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

const TARGET_GUILD_ID = "1488515896807919667";

// --- BOT MANUAL DATA ---
const overseerData = {
  protocols: {
    public_survivor_commands: [
      { "command": "/register", "description": "Initialize a new tribe signature." },
      { "command": "/join", "parameters": ["tribe_name"], "description": "Sync signature with an existing verified tribe." },
      { "command": "/lft", "description": "Deploy recruitment profile to #recruit-terminal." },
      { "command": "/my-tribe", "description": "View verified signature, Xbox ID, and balance." },
      { "command": "/leave-tribe", "description": "Exit tribe roster and revoke HQ access." },
      { "command": "/bal", "description": "Check Tek Coin holdings." },
      { "command": "/shop", "description": "Browse the active Tek-Market inventory." },
      { "command": "/buy", "parameters": ["item"], "description": "Authorize purchase from market." },
      { "command": "/pay", "parameters": ["target", "amount"], "description": "Transfer Tek Coins." },
      { "command": "/bounty", "parameters": ["tribe", "amount"], "description": "Place reward on a rival tribe." }
    ],
    tribe_hq_buttons: [
      { "id": "raid_alert", "label": "RAID ALERT", "action": "Alert Tribe & Logs" },
      { "id": "view_roster", "label": "Roster", "action": "View Members" },
      { "id": "add_task", "label": "Add Task", "action": "Post mission" },
      { "id": "claim_kit", "label": "Claim Kit", "action": "Kit Request" }
    ],
    staff_restricted_commands: [
      { "command": "/setup", "description": "Master sector configuration.", "parameters": ["role", "logs", "welcome", "rules", "info", "recruitment", "support", "category"] },
      { "command": "/list-tribes", "description": "Audit all signatures and Xbox IDs." },
      { "command": "/kick-member", "parameters": ["target"], "description": "Force signature removal." },
      { "command": "/add-coins", "parameters": ["target", "amount"], "description": "Grant coins." },
      { "command": "/add-item", "parameters": ["name", "price", "category"], "description": "Stock market." },
      { "command": "/remove-item", "parameters": ["item"], "description": "Purge market asset." }
    ]
  }
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const activeTab = searchParams.tab || "intelligence";

  // Fetch Data
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
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="w-24 border-r border-white/[0.03] bg-[#050505] hidden lg:flex flex-col items-center py-8 sticky top-0 h-screen">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mb-12 shadow-lg shadow-cyan-500/20">
             <Shield className="text-black" size={24} />
          </div>
          <nav className="space-y-8">
            <DesktopSidebarLink href="/?tab=intelligence" icon={<LayoutDashboard size={24}/>} active={activeTab === "intelligence"} />
            <DesktopSidebarLink href="/?tab=map" icon={<MapIcon size={24}/>} active={activeTab === "map"} />
            <DesktopSidebarLink href="/?tab=roster" icon={<Users size={24}/>} active={activeTab === "roster"} />
            <DesktopSidebarLink href="/?tab=alpha" icon={<Crown size={24}/>} active={activeTab === "alpha"} />
            <DesktopSidebarLink href="/?tab=manual" icon={<BookOpen size={24}/>} active={activeTab === "manual"} />
            <DesktopSidebarLink href="/?tab=settings" icon={<Settings size={24}/>} active={activeTab === "settings"} />
          </nav>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION (6 TABS VERSION) */}
      <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[96%] max-w-lg">
        <div className="mce-bevel-out bg-[#080808]/90 backdrop-blur-3xl rounded-[36px] overflow-hidden flex justify-around items-center p-1 relative border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            <div className="mce-gloss absolute inset-0 rounded-[36px]" />
            <MobileNavLink href="/?tab=intelligence" icon={<LayoutDashboard size={18} />} active={activeTab === "intelligence"} />
            <MobileNavLink href="/?tab=map" icon={<MapIcon size={18} />} active={activeTab === "map"} />
            <MobileNavLink href="/?tab=roster" icon={<Users size={18} />} active={activeTab === "roster"} />
            <MobileNavLink href="/?tab=alpha" icon={<Crown size={18} />} active={activeTab === "alpha"} />
            <MobileNavLink href="/?tab=manual" icon={<BookOpen size={18} />} active={activeTab === "manual"} />
            <MobileNavLink href="/?tab=settings" icon={<Settings size={18} />} active={activeTab === "settings"} showDivider={false} />
        </div>
      </div>

      {/* 3. MAIN DYNAMIC CONTENT */}
      <main className="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full pt-20 lg:pt-12 transition-all">
        
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

        {activeTab === "map" && (
