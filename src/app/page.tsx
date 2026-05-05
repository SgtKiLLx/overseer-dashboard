import { db } from "@/lib/db";
import { tribeRegistrationsTable, alphaClaimsTable } from "@/lib/db/schema";
import { Users, Shield, Crown, Activity, Trash2, CheckCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function AdminDashboard() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Fetch Data
  const registrations = await db.select().from(tribeRegistrationsTable);
  const alphaClaims = await db.select().from(alphaClaimsTable);

  // --- SERVER ACTIONS (The logic behind the buttons) ---
  
  async function wipeSurvivor(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await db.delete(tribeRegistrationsTable).where(eq(tribeRegistrationsTable.id, id));
    revalidatePath("/"); // Refreshes the page instantly
  }

  async function verifyAlpha(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    await db.update(alphaClaimsTable).set({ status: "approved" }).where(eq(alphaClaimsTable.id, id));
    revalidatePath("/");
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4 md:p-12">
      {/* Header */}
      <div className="border-b border-cyan-900 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tighter italic text-white uppercase">Overseer <span className="text-cyan-500">Cmd</span></h1>
          <p className="text-xs text-cyan-800 uppercase tracking-widest mt-1 italic">Authorized Admin: {session.user?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-cyan-900 font-bold">LINK_STATUS: ENCRYPTED</p>
            <span className="text-green-500 text-sm animate-pulse font-bold tracking-tighter">● SYSTEM_LIVE</span>
          </div>
          <img src={session.user?.image || ""} className="w-10 h-10 border border-cyan-500 rounded-sm shadow-[0_0_10px_rgba(0,255,255,0.3)]" alt="Admin" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox icon={<Shield size={16}/>} label="Total Tribes" value={new Set(registrations.map(r => r.tribeName)).size} />
        <StatBox icon={<Users size={16}/>} label="Survivors" value={registrations.length} />
        <StatBox icon={<Crown size={16}/>} label="Alpha Claims" value={alphaClaims.length} />
        <StatBox icon={<Activity size={16}/>} label="Latency" value="12ms" color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Survivor List */}
        <div className="xl:col-span-2 bg-slate-950 border border-cyan-900/50 rounded-sm overflow-hidden">
          <div className="p-4 bg-cyan-950/20 border-b border-cyan-900 text-sm font-bold uppercase tracking-tighter flex justify-between items-center">
            <span>Global_Survivor_Database</span>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="sticky top-0 bg-slate-950 z-10">
                <tr className="text-cyan-700 uppercase border-b border-cyan-900/30">
                  <th className="p-4">Tribe</th>
                  <th className="p-4">Survivor</th>
                  <th className="p-4">Xbox ID</th>
                  <th className="p-4 text-right">Protocol</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-cyan-900/10 hover:bg-cyan-500/5 transition">
                    <td className="p-4 font-bold text-white uppercase">{reg.tribeName}</td>
                    <td className="p-4">{reg.ign}</td>
                    <td className="p-4 text-cyan-600 font-bold">{reg.xboxGamertag}</td>
                    <td className="p-4 text-right">
                      <form action={wipeSurvivor}>
                        <input type="hidden" name="id" value={reg.id} />
                        <button type="submit" className="text-red-900 hover:text-red-500 transition-colors">
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

        {/* Alpha Claims Sidebar */}
        <div className="bg-slate-950 border border-yellow-900/50 rounded-sm h-fit">
          <div className="p-4 bg-yellow-950/20 border-b border-yellow-900 text-sm font-bold uppercase text-yellow-500 italic flex items-center gap-2">
            <Crown size={14} /> Pending_Alpha_Claims
          </div>
          <div className="p-4 space-y-4">
            {alphaClaims.length === 0 && <p className="text-xs text-yellow-900 italic">No active claims detected.</p>}
            {alphaClaims.map(claim => (
              <div key={claim.id} className={`border border-yellow-900/30 p-4 bg-black/40 rounded-sm ${claim.status === 'approved' ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-black text-yellow-500 uppercase">{claim.tribeName}</p>
                  <span className={`text-[9px] px-1 uppercase ${claim.status === 'approved' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}`}>
                    {claim.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-yellow-800">
                  <p>COORDS: <span className="text-white">{claim.coordinates}</span></p>
                  <p>SIZE: <span className="text-white">{claim.memberCount} Members</span></p>
                </div>
                
                {claim.status === 'pending' && (
                  <form action={verifyAlpha}>
                    <input type="hidden" name="id" value={claim.id} />
                    <button type="submit" className="w-full mt-3 border border-yellow-600/50 py-1 text-[10px] text-yellow-600 hover:bg-yellow-600 hover:text-black transition flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> INITIALIZE_VERIFICATION
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color = "text-cyan-400" }: any) {
  return (
    <div className="bg-slate-900/30 border border-cyan-900/50 p-6 rounded-sm relative overflow-hidden group hover:border-cyan-500 transition-all">
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-900 group-hover:bg-cyan-500"></div>
      <div className="flex items-center gap-2 text-cyan-700 mb-1">
        {icon} <span className="text-[10px] uppercase font-black tracking-widest">{label}</span>
      </div>
      <div className={`text-3xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}
