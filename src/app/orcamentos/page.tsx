"use client";
import Link from "next/link";
import { ArrowLeft, Calculator, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { BudgetNav } from "@/components/budget-nav";
type Project = { id: string; name: string };
type Budget = {
  id: string;
  title: string;
  version: number;
  status: string;
  bdi_percent: number;
  projects: { name: string };
};
export default function BudgetsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [bdi, setBdi] = useState("20");
  const [message, setMessage] = useState("");
  async function load() {
    const [projectResponse, budgetResponse] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/budgets"),
    ]);
    if (projectResponse.ok) {
      const data = await projectResponse.json();
      setProjects(data);
      setProjectId((value) => value || data[0]?.id || "");
    }
    if (budgetResponse.ok) setBudgets(await budgetResponse.json());
  }
  useEffect(() => {
    Promise.all([fetch("/api/projects"), fetch("/api/budgets")]).then(
      async ([projectResponse, budgetResponse]) => {
        if (projectResponse.ok) {
          const data = await projectResponse.json();
          setProjects(data);
          setProjectId((value) => value || data[0]?.id || "");
        }
        if (budgetResponse.ok) setBudgets(await budgetResponse.json());
      },
    );
  }, []);
  async function create() {
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        title,
        bdi_percent: Number(bdi),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Não foi possível criar o orçamento.");
      return;
    }
    setTitle("");
    setMessage("Orçamento criado em rascunho.");
    await load();
  }
  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-stone-50 pb-10">
      <header className="border-b border-stone-200 bg-white p-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            href="/"
            className="grid size-10 place-items-center rounded-full hover:bg-stone-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Planejamento
            </p>
            <h1 className="text-xl font-bold">Orçamentos</h1>
          </div>
        </div>
      </header>
      <BudgetNav />
      <div className="mx-auto max-w-5xl space-y-6 p-4">
        <section className="rounded-2xl bg-stone-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <Calculator className="text-amber-400" />
            <div>
              <h2 className="font-bold">Novo orçamento</h2>
              <p className="text-sm text-stone-300">
                Crie uma versão inicial para estruturar EAP e composições.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input"
            >
              <option value="">Selecione a obra</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Ex.: Orçamento base"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={bdi}
              onChange={(e) => setBdi(e.target.value)}
              className="input"
              placeholder="BDI (%)"
            />
          </div>
          <button
            onClick={create}
            disabled={!projectId || !title}
            className="button-primary mt-3"
          >
            <Plus size={17} />
            Criar orçamento
          </button>
          {message && <p className="mt-3 text-sm text-amber-300">{message}</p>}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Orçamentos recentes</h2>
          <div className="space-y-2">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <strong>{budget.title}</strong>
                    <p className="mt-1 text-sm text-stone-500">
                      {budget.projects?.name} · Versão {budget.version} · BDI{" "}
                      {budget.bdi_percent}%
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">
                    {budget.status}
                  </span>
                </div>
              </div>
            ))}
            {budgets.length === 0 && (
              <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                Nenhum orçamento criado.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
