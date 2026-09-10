"use client";

import {
  Building2,
  Calculator,
  Layers3,
  Package,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  {
    href: "/orcamentos",
    label: "Orçamentos",
    icon: Calculator,
    available: true,
  },
  { href: "/clientes", label: "Clientes", icon: Users, available: true },
  { href: "/insumos", label: "Insumos", icon: Package, available: true },
  {
    href: "/composicoes",
    label: "Composições",
    icon: Layers3,
    available: true,
  },
  {
    href: "/referencias",
    label: "Importar tabelas",
    icon: Upload,
    available: true,
  },
];

export function BudgetNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed,setAllowed]=useState<boolean|null>(null);
  useEffect(()=>{fetch('/api/modules').then(async response=>{const modules=response.ok?await response.json():[];const canAccess=modules.some((module:{code:string})=>module.code==='BUDGET');setAllowed(canAccess);if(!canAccess)router.replace('/')})},[router]);
  if(allowed!==true)return null;
  return (
    <nav
      aria-label="Navegação de Orçamentos"
      className="border-b border-stone-200 bg-white"
    >
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2">
        {items.map(({ href, label, icon: Icon, available }) =>
          available ? (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${pathname === href ? "bg-emerald-100 text-emerald-900" : "text-stone-600 hover:bg-stone-100"}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ) : (
            <span
              key={href}
              title="Em breve"
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-400"
            >
              <Icon size={16} />
              {label}
              <small className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px]">
                Em breve
              </small>
            </span>
          ),
        )}
      </div>
    </nav>
  );
}
