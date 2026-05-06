import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle, Search, Menu, Bell } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function AdminDashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const registrations = await db.select().from(tribeRegistrationsTable);
  const alphaClaims = await db.select().from(alphaClaimsTable);

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
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="text-black" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white">Overseer</h1>
            <p className="text-[10px] text-cyan-400 font-medium uppercase tracking-[0.2em]">Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-white/5 rounded-2xl px-4 py-2 items-center gap-2 border border-white/10">
             <Search size={16} className="text-slate-500" />
             <input type="text" placeholder="Search survivors..." className="bg-transparent border-none outline-none text-sm w-48" />
          </div>
          <button className="p-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <Bell size={20} />
          </button>
          <img src={session.user?.image || ""} className="w-10 h-10 rounded-2xl border-2 border-cyan-500/20 object-cover" alt="Admin" />
        </div>
      </nav>

      <main className="p-6 max-w-[1600px] mx-auto space-y-8">
        
        {/* Modern Greeting */}
        <header className="py-4">
          <h2 className="text-3xl font-semibold text-white">Hello, {session.user?.name?.split(' ')[0]}</h2>
          <p className="text-slate-400">Everything is running smoothly. 24 tribes active.</p>
        </header>

        {/* Quick Stats Grid - Android 16 Card Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Shield className="text-cyan-400" />} label="Active Tribes" value={new Set(registrations.map(r => r.tribeName)).size} />
          <StatCard icon={<Users className="text-blue-400" />} label="Registered Survivors" value={registrations.length} />
          <StatCard icon={<Crown className="text-amber-400" />} label="Alpha Claims" value={alphaClaims.length} />
          <StatCard icon={<Activity className="text-emerald-400" />} label="Overseer" value="Online" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Survivor Table - Modern Clean Look */}
          <div className="xl:col-span-2 bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-sm">
            <div className="p-6 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-semibold text-lg text-white">Survivor Database</h3>
              <button className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-4 py-2 rounded-full hover:bg-cyan-400 hover:text-black transition">EXPORT DATA</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                    <th className="p-6">Tribe Name</th>
                    <th className="p-6">In-Game Name</th>
                    <th className="p-6">Xbox ID</th>
                    <th className="p-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="p-6 font-semibold text-white uppercase tracking-tight">{reg.tribeName}</td>
                      <td className="p-6 text-slate-300">{reg.ign}</td>
                      <td className="p-6 text-slate-400 font-mono text-xs italic">{reg.xboxGamertag}</td>
                      <td className="p-6 text-right">
                        <form action={wipeSurvivor}>
                          <input type="hidden" name="id" value={reg.id} />
                          <button type="submit" className="p-3 rounded-2xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={18} />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alpha Claims - "Dynamic Island" style cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-semibold text-lg text-white">Pending Claims</h3>
              <span className="bg-amber-500/20 text-amber-500 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter">Requires Action</span>
            </div>
            
            <div className="space-y-4">
              {alphaClaims.length === 0 && (
                <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-8 text-center text-slate-500 text-sm italic">
                  No active alpha protocols detected.
                </div>
              )}
              {alphaClaims.map(claim => (
                <div key={claim.id} className={`bg-white/[0.03] border border-white/10 p-6 rounded-[32px] transition-all hover:border-amber-500/30 ${claim.status === 'approved' ? 'grayscale opacity-50' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-lg font-bold text-white uppercase tracking-tighter">{claim.tribeName}</p>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${claim.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400 mb-6">
                    <div className="bg-white/5 rounded-xl p-2 px-3 border border-white/5">
                      <span className="block text-[9px] uppercase text-slate-500 font-bold">Coords</span>
                      {claim.coordinates}
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 px-3 border border-white/5">
                      <span className="block text-[9px] uppercase text-slate-500 font-bold">Members</span>
                      {claim.memberCount}
                    </div>
                  </div>
                  
                  {claim.status === 'pending' && (
                    <form action={verifyAlpha}>
                      <input type="hidden" name="id" value={claim.id} />
                      <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-2xl hover:bg-cyan-400 transition flex items-center justify-center gap-2 text-sm uppercase italic">
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
