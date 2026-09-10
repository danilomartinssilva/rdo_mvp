import Link from "next/link";
import { Calculator, ClipboardList, HardHat } from "lucide-react";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-950 p-5">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-amber-500 text-stone-950">
            <HardHat size={30} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
            Canteiro
          </p>
          <h1 className="mt-2 text-3xl font-bold">Gestão integrada de obras</h1>
          <p className="mt-3 text-stone-300">
            Escolha o módulo que deseja utilizar.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/rdo"
            className="group rounded-3xl bg-white p-6 shadow-xl transition hover:-translate-y-1"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <ClipboardList size={24} />
            </div>
            <h2 className="mt-6 text-xl font-bold text-stone-950">
              RDO Digital
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Registre clima, equipe, atividades, fotos e ocorrências do
              canteiro.
            </p>
            <span className="mt-6 inline-block text-sm font-semibold text-amber-700">
              Acessar RDO →
            </span>
          </Link>
          <Link
            href="/orcamentos"
            className="group rounded-3xl bg-white p-6 shadow-xl transition hover:-translate-y-1"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Calculator size={24} />
            </div>
            <h2 className="mt-6 text-xl font-bold text-stone-950">
              Orçamentos
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Estruture EAP, composições de custo e propostas comerciais.
            </p>
            <span className="mt-6 inline-block text-sm font-semibold text-emerald-700">
              Acessar Orçamentos →
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
