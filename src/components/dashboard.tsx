"use client";

import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FilePlus2,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RdoForm } from "@/components/rdo/rdo-form";
import { createClient } from "@/lib/supabase/client";
import { statusLabel, type RdoStatus } from "@/lib/types";

const colors: Record<RdoStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  WITH_NOTES: "bg-red-100 text-red-800",
};
type Project = { id: string; name: string };
type RdoListItem = {
  id: string;
  date: string;
  status: RdoStatus;
  rdo_activities: { description: string }[];
};

export function Dashboard() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [rdos, setRdos] = useState<RdoListItem[]>([]);
  const [rdoError, setRdoError] = useState("");

  async function signOut() {
    await createClient().auth.signOut();
    setProjects([]);
    setRdos([]);
    router.replace("/login");
  }

  useEffect(() => {
    fetch("/api/me").then(async (response) => {
      if (response.status === 401) {
        router.push("/login");
        return null;
      }
      return response.ok ? response.json() : null;
    }).then((profile: { name: string } | null) => setName(profile?.name ?? ""));

    fetch("/api/projects")
      .then(async (response) => response.ok ? response.json() : [])
      .then((data: Project[]) => {
        setProjects(data);
        setProjectId(data[0]?.id ?? "");
      })
      .finally(() => setLoadingProjects(false));
  }, [router]);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/rdos`)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error || "Não foi possível carregar os relatórios.");
        return response.json();
      })
      .then((data: RdoListItem[]) => {
        setRdos(data);
        setRdoError("");
      })
      .catch((error) => setRdoError(error instanceof Error ? error.message : "Não foi possível carregar os relatórios."))
  }, [projectId]);

  if (editing) return <RdoForm projectId={projectId} onBack={() => setEditing(false)} />;
  const approved = rdos.filter((rdo) => rdo.status === "APPROVED").length;
  const pending = rdos.filter((rdo) => rdo.status === "PENDING_APPROVAL").length;
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-stone-50 pb-8">
      <header className="bg-stone-950 px-5 pb-7 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Canteiro
            </p>
            <h1 className="mt-1 text-2xl font-bold">Olá{name ? `, ${name}` : ""}</h1>
          </div>
          <button onClick={signOut} aria-label="Sair" className="rounded-full bg-white/10 p-2.5">
            <LogOut size={18} />
          </button>
        </div>
        <label className="mt-6 block rounded-xl bg-white/10 px-4 py-3 text-left">
          <span>
            <span className="block text-xs text-stone-300">Obra atual</span>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              disabled={loadingProjects || projects.length === 0}
              className="mt-1 w-full bg-transparent font-semibold text-white outline-none disabled:text-stone-400"
            >
              {loadingProjects && <option>Carregando obras...</option>}
              {!loadingProjects && projects.length === 0 && <option>Nenhuma obra vinculada</option>}
              {projects.map((project) => <option key={project.id} value={project.id} className="text-stone-950">{project.name}</option>)}
            </select>
          </span>
        </label>
      </header>
      <div className="px-4">
        <section className="-mt-3 grid grid-cols-3 rounded-2xl bg-white p-3 shadow-sm">
          <div className="border-r border-stone-100 text-center">
            <strong className="block text-xl">{rdos.length}</strong>
            <span className="text-xs text-stone-500">Na obra</span>
          </div>
          <div className="border-r border-stone-100 text-center">
            <strong className="block text-xl text-amber-700">{pending}</strong>
            <span className="text-xs text-stone-500">Pendentes</span>
          </div>
          <div className="text-center">
            <strong className="block text-xl text-emerald-700">{approved}</strong>
            <span className="text-xs text-stone-500">Aprovados</span>
          </div>
        </section>
        <button
          onClick={() => setEditing(true)}
          disabled={!projectId}
          className="button-primary mt-5 w-full py-3.5"
        >
          <FilePlus2 size={18} />
          Criar RDO de hoje
        </button>
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-950">
              Relatórios recentes
            </h2>
            <button className="text-sm font-semibold text-amber-700">
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {rdoError && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{rdoError}</p>}
            {!rdoError && rdos.length === 0 && <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">Nenhum RDO registrado para esta obra.</p>}
            {rdos.map((record) => (
              <button
                key={record.id}
                onClick={() => router.push(`/rdos/${record.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm hover:border-amber-300"
              >
                <div className="rounded-xl bg-stone-100 p-2.5 text-stone-700">
                  <ClipboardList size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-stone-900">
                      {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${record.date}T12:00:00`))}
                    </strong>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${colors[record.status]}`}
                    >
                      {statusLabel[record.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-stone-500">
                    {record.rdo_activities[0]?.description ?? "Sem atividades registradas"}
                  </p>
                </div>
                <ChevronRight size={18} className="text-stone-400" />
              </button>
            ))}
          </div>
        </section>
        <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <CalendarDays className="mt-0.5 text-amber-700" size={20} />
            <div>
              <h2 className="font-semibold text-amber-950">Próxima etapa</h2>
              <p className="mt-1 text-sm text-amber-900">
                Concretagem da laje prevista para sexta-feira.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
