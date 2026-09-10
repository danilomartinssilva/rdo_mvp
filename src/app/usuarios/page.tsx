"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  user_module_access: { module: string }[];
};
export default function Users() {
  const [list, setList] = useState<User[]>([]);
  async function load() {
    const r = await fetch("/api/users");
    if (r.ok) setList(await r.json());
  }
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, []);
  async function toggle(user: User) {
    const active =
      user.role === "ADMIN" ||
      user.user_module_access.some((x) => x.module === "BUDGET");
    if (user.role === "ADMIN") return;
    await fetch(`/api/users/${user.id}/modules`, {
      method: active ? "DELETE" : "POST",
    });
    load();
  }
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b bg-white p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Usuários e acessos</h1>
      </header>
      <div className="mx-auto max-w-4xl space-y-2 p-4">
        {list.map((user) => {
          const active =
            user.role === "ADMIN" ||
            user.user_module_access.some((x) => x.module === "BUDGET");
          return (
            <div
              className="flex items-center justify-between rounded-xl bg-white p-4"
              key={user.id}
            >
              <div>
                <strong>{user.name}</strong>
                <p className="text-sm text-stone-500">
                  {user.email} · {user.role}
                </p>
              </div>
              <button
                onClick={() => toggle(user)}
                disabled={user.role === "ADMIN"}
                className={active ? "button-primary" : "button-secondary"}
              >
                {active ? "Orçamentos liberado" : "Liberar Orçamentos"}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
