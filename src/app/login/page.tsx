"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono p-4">
      <div className="border border-cyan-900 p-8 md:p-16 bg-slate-950 rounded-sm text-center shadow-[0_0_50px_rgba(0,255,255,0.1)] max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-cyan-400 text-4xl font-black tracking-tighter italic">OVERSEER</h1>
          <p className="text-cyan-800 text-[10px] uppercase tracking-[0.3em] mt-2">Authentication Required</p>
        </div>
        
        <div className="space-y-4">
          <p className="text-cyan-600 text-xs leading-relaxed italic">"System analysis suggests unauthorized access will be terminated. Please initialize survivor signature."</p>
          <button 
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            className="w-full bg-cyan-500 text-black py-3 font-black hover:bg-cyan-400 transition-all uppercase text-sm italic shadow-[0_0_15px_rgba(0,255,255,0.3)]"
          >
            Connect Discord
          </button>
        </div>
      </div>
    </div>
  );
}
