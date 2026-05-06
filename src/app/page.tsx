import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Bell } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function AdminDashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Fetch Live Data
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

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30 pb-20">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#22d3ee] to-[#6366f1] rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="text-black" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white">Overseer</h1>
            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em]">OS Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <Bell size={20} className="text-slate-400" />
          </button>
          <img src={session.user?.image || ""} className="w-10 h-10 rounded-2xl border-2 border-white/10 object-cover shadow-xl" alt="Admin" />
        </div>
      </nav>

      <main className="p-6 max-w-[1600px] mx-auto space-y-10">
        
        {/* Modern Android 17 Style Hero Section */}
        <header className="relative overflow-hidden rounded-[48px] bg-[#0A0A0A] border border-white/[0.06] p-8 md:p-14 shadow-2xl transition-all hover:border-white/[0.1]">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-cyan-500/[0.04] blur-[130px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-6">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2.5 bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/[0.05]">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">System Link: Stable</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-slate-500 text-lg font-medium tracking-tight ml-1">Welcome back,</p>
                <h2 className="text-6xl md:text-8xl font-[1000] text-white tracking-tighter leading-[0.9]">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#6366f1]">
                    {session.user?.name}
                  </span>
                </h2>
              </div>
            </div>

            {/* Dynamic Tribe Widget */}
            <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] p-8 rounded-[40px] min-w-[260px] flex flex-col items-center justify-center text-center shadow-2xl relative">
               <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.25em] mb-2">Network Capacity</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-7xl font-[1000] text-white tracking-tighter">
                   {tribeCount}
                 </span>
                 <div className="flex flex-col items-start leading-none">
                    <span className="text-cyan-500 font-black text-xl uppercase tracking-tighter">Active</span>
                    <span className="text-cyan-800 font-bold text-xs uppercase tracking-tighter">Tribes</span>
                 </div>
               </div>
               <div className="mt-6 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
               <p className="mt-4 text-green-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                 <Activity size={10} /> Syncing Protocols
               </p>
            </div>
          </div>
        </header>

        {/* Action Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Survivor Database - Modern Sheet Look */}
          <div className="xl:col-span-2 bg-[#0A0A0A] border border-white/[0.06] rounded-[48px] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-8 border-b border-white/[0.04] bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Survivor Database
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Global Registry Access</p>
              </div>
              
              <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-2xl flex items-center gap-3 w-full md:w-64">
                <Search size={14} className="text-slate-500" />
                <input type="text" placeholder="Search signatures..." className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-600 w-full" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2 px-6 pb-10">
                <thead>
                  <tr className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
                    <th className="p-4 pl-6">Signature / Tribe</th>
                    <th className="p-4">Survivor IGN</th>
                    <th className="p-4">Xbox ID</th>
                    <th className="p-4 text-right pr-8">Protocol</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="group">
                      <td className="p-4 pl-6 bg-white/[0.02] rounded-l-[24px] border-y border-l border-white/[0.03] group-hover:bg-white/[0.05] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-[10px] border border-cyan-500/20">
                            {reg.tribeName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-white uppercase tracking-tight text-sm">{reg.tribeName}</span>
                        </div>
                      </td>
                      <td className="p-4 bg-white/[0.02] border-y border-white/[0.03] group-hover:bg-white/[0.05]">
                        <span className="text-slate-300 text-sm font-semibold">{reg.ign}</span>
                      </td>
                      <td className="p-4 bg-white/[0.02] border-y border-white/[0.03] group-hover:bg-white/[0.05]">
                        <span className="text-cyan-600 font-mono text-xs">{reg.xboxGamertag}</span>
                      </td>
                      <td className="p-4 text-right pr-8 bg-white/[0.02] rounded-r-[24px] border-y border-r border-white/[0.03] group-hover:bg-white/[0.05]">
                        <form action={wipeSurvivor} className="inline">
                          <input type="hidden" name="id" value={reg.id} />
                          <button type="submit" className="p-2.5 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all transform active:scale-95">
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

          {/* Alpha Claims - "Interactive Card" Column */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-bold text-white tracking-tight flex items-center gap-2 text-lg">
                 Alpha Protocols
              </h3>
              <span className="bg-amber-500/10 text-amber-500 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-amber-500/20">Action Required</span>
            </div>
            
            <div className="space-y-4">
              {alphaClaims.length === 0 && (
                <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[40px] p-12 text-center">
                  <p className="text-slate-600 text-xs font-bold uppercase tracking-widest italic">No pending requests</p>
                </div>
              )}
              
              {alphaClaims.map(claim => (
                <div key={claim.id} className={`relative overflow-hidden bg-[#0A0A0A] border border-white/[0.06] p-7 rounded-[48px] shadow-xl group transition-all hover:border-amber-500/30 ${claim.status === 'approved' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-xl font-black text-white uppercase tracking-tighter italic">{claim.tribeName}</p>
                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${claim.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {claim.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white/[0.03] p-4 rounded-3xl border border-white/[0.05]">
                      <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Coordinates</span>
                      <span className="text-sm font-bold text-white tracking-tight">{claim.coordinates}</span>
                    </div>
                    <div className="bg-white/[0.03] p-4 rounded-3xl border border-white/[0.05]">
                      <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Roster</span>
                      <span className="text-sm font-bold text-white tracking-tight">{claim.memberCount} Members</span>
                    </div>
                  </div>
                  
                  {claim.status === 'pending' && (
                    <form action={verifyAlpha}>
                      <input type="hidden" name="id" value={claim.id} />
                      <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-[28px] hover:bg-[#22d3ee] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-[0.1em]">
                        <CheckCircle size={16} /> Finalize Authority
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[40px] hover:bg-white/[0.05] transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
      <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
    </div>
  );
}
