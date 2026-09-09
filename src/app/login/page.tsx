"use client";

import { HardHat } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function login(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!isSupabaseConfigured()) { setError("Configure as variáveis do Supabase para entrar."); return; } setLoading(true); setError(""); const { error: authError } = await createClient().auth.signInWithPassword({ email, password }); if (authError) setError(authError.message); else router.push("/"); setLoading(false); }
  return <main className="grid min-h-screen place-items-center bg-stone-950 p-5"><form onSubmit={login} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-8"><div className="mb-4 grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><HardHat size={25} /></div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Canteiro</p><h1 className="mt-1 text-2xl font-bold text-stone-950">Acesse seu RDO</h1><p className="mt-2 text-sm text-stone-500">Registre o dia da sua obra em poucos minutos.</p></div><label className="block text-sm font-medium text-stone-700">E-mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" /></label><label className="mt-4 block text-sm font-medium text-stone-700">Senha<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" /></label>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="button-primary mt-6 w-full py-3">{loading ? "Entrando..." : "Entrar"}</button></form></main>;
}
