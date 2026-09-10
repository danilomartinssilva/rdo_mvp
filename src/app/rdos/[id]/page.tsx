"use client";

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  Download,
  HardHat,
  Wrench,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { statusLabel, type RdoStatus } from "@/lib/types";

type RdoDetail = {
  id: string;
  date: string;
  status: RdoStatus;
  notes: string | null;
  weather_morning: string;
  weather_afternoon: string;
  projects: { name: string; address: string; client_name: string; logo_path: string | null };
  users: { name: string } | null;
  rdo_labor: {
    id: string;
    role_name: string;
    quantity: number;
    is_outsourced: boolean;
  }[];
  rdo_equipment: { id: string; type_name: string; quantity: number }[];
  rdo_activities: { id: string; description: string; status: string }[];
  rdo_occurrences: { id: string; type: string; description: string }[];
  rdo_photos: {
    id: string;
    caption: string | null;
    signed_url: string | null;
  }[];
  rdo_approvals: {
    id: string;
    status: RdoStatus;
    comment: string | null;
    created_at: string;
    users: { name: string } | null;
  }[];
};

const statusColor: Record<RdoStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  WITH_NOTES: "bg-red-100 text-red-800",
};
const activityLabel: Record<string, string> = {
  COMPLETED: "Concluído",
  IN_PROGRESS: "Em andamento",
  STOPPED: "Paralisado",
};
const weatherLabel: Record<string, string> = {
  GOOD: "Bom",
  RAINY: "Chuvoso",
  IMPRACTICABLE: "Impraticável",
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-amber-700">{icon}</span>
        <h2 className="font-semibold text-stone-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function RdoDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [rdo, setRdo] = useState<RdoDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/rdos/${params.id}`)
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!response.ok)
          throw new Error(
            (await response.json()).error || "Não foi possível carregar o RDO.",
          );
        return response.json();
      })
      .then((data: RdoDetail | null) => {
        if (data) setRdo(data);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o RDO.",
        ),
      );
  }, [params.id, router]);

  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 p-5">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.back()}
            className="button-secondary mt-4"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  if (!rdo)
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 text-sm text-stone-500">
        Carregando RDO...
      </main>
    );
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
  }).format(new Date(`${rdo.date}T12:00:00`));
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-stone-50 pb-8">
      <header className="border-b border-stone-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Voltar"
            className="grid size-10 place-items-center rounded-full hover:bg-stone-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
              {rdo.projects.name}
            </p>
            <h1 className="text-lg font-bold text-stone-950">
              RDO de {formattedDate}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-14 place-items-center overflow-hidden rounded-lg bg-stone-950 text-center leading-none">
              {rdo.projects.logo_path ? <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/project-logos/${rdo.projects.logo_path}`} alt={`Logo ${rdo.projects.name}`} className="size-full object-contain bg-white" /> : <><span className="text-base font-bold text-amber-400">C</span><span className="text-[7px] font-semibold tracking-[0.12em] text-white">CANTEIRO</span></>}
            </div>
            <a
              href={`/api/rdos/${rdo.id}/pdf`}
              target="_blank"
              className="grid size-10 place-items-center rounded-full bg-stone-950 text-white"
              aria-label="Baixar PDF"
            >
              <Download size={18} />
            </a>
          </div>
        </div>
      </header>
      <div className="space-y-4 px-4 py-5">
        <section className="rounded-2xl bg-stone-950 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-stone-300">
                Registrado por {rdo.users?.name ?? "Usuário da obra"}
              </p>
              <p className="mt-2 text-sm capitalize text-stone-300">
                {formattedDate}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusColor[rdo.status]}`}
            >
              {statusLabel[rdo.status]}
            </span>
          </div>
        </section>
        <Section title="Condições climáticas" icon={<CloudRain size={19} />}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-xl bg-stone-50 p-3">
              <span className="block text-xs text-stone-500">Manhã</span>
              <strong>
                {weatherLabel[rdo.weather_morning] ?? rdo.weather_morning}
              </strong>
            </p>
            <p className="rounded-xl bg-stone-50 p-3">
              <span className="block text-xs text-stone-500">Tarde</span>
              <strong>
                {weatherLabel[rdo.weather_afternoon] ?? rdo.weather_afternoon}
              </strong>
            </p>
          </div>
        </Section>
        <Section title="Mão de obra" icon={<HardHat size={19} />}>
          {rdo.rdo_labor.length ? (
            <div className="space-y-2">
              {rdo.rdo_labor.map((item) => (
                <p
                  key={item.id}
                  className="flex justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm"
                >
                  <span>
                    {item.role_name}
                    {item.is_outsourced && " · Terceirizada"}
                  </span>
                  <strong>{item.quantity}</strong>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Não informada.</p>
          )}
        </Section>
        <Section title="Equipamentos em uso" icon={<Wrench size={19} />}>
          {rdo.rdo_equipment.length ? (
            <div className="space-y-2">
              {rdo.rdo_equipment.map((item) => (
                <p
                  key={item.id}
                  className="flex justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm"
                >
                  <span>{item.type_name}</span>
                  <strong>{item.quantity}</strong>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Não informados.</p>
          )}
        </Section>
        <Section
          title="Atividades realizadas"
          icon={<ClipboardList size={19} />}
        >
          {rdo.rdo_activities.length ? (
            <div className="space-y-3">
              {rdo.rdo_activities.map((item) => (
                <div key={item.id} className="rounded-xl bg-stone-50 p-3">
                  <p className="text-sm text-stone-800">{item.description}</p>
                  <span className="mt-2 inline-block text-xs font-medium text-stone-500">
                    {activityLabel[item.status] ?? item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">
              Nenhuma atividade registrada.
            </p>
          )}
        </Section>
        <Section
          title="Ocorrências e imprevistos"
          icon={<CheckCircle2 size={19} />}
        >
          {rdo.rdo_occurrences.length ? (
            <div className="space-y-3">
              {rdo.rdo_occurrences.map((item) => (
                <div key={item.id} className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase text-amber-800">
                    {item.type}
                  </p>
                  <p className="mt-1 text-sm text-stone-800">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">
              Nenhuma ocorrência registrada.
            </p>
          )}
        </Section>
        <Section title="Registro fotográfico" icon={<Camera size={19} />}>
          {rdo.rdo_photos.length ? (
            <div className="grid grid-cols-2 gap-3">
              {rdo.rdo_photos.map((photo) => (
                <figure key={photo.id}>
                  {photo.signed_url ? (
                    <img
                      src={photo.signed_url}
                      alt={photo.caption ?? "Foto do RDO"}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid aspect-square place-items-center rounded-xl bg-stone-100 text-xs text-stone-500">
                      Foto indisponível
                    </div>
                  )}
                  {photo.caption && (
                    <figcaption className="mt-1 text-xs text-stone-500">
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Nenhuma foto registrada.</p>
          )}
        </Section>
        {rdo.notes && (
          <Section
            title="Observações gerais"
            icon={<ClipboardList size={19} />}
          >
            <p className="whitespace-pre-wrap text-sm text-stone-700">
              {rdo.notes}
            </p>
          </Section>
        )}
        {rdo.rdo_approvals.length > 0 && (
          <Section
            title="Histórico de aprovação"
            icon={<CheckCircle2 size={19} />}
          >
            {rdo.rdo_approvals.map((approval) => (
              <div
                key={approval.id}
                className="border-l-2 border-amber-500 pl-3 text-sm"
              >
                <strong>{statusLabel[approval.status]}</strong>
                <p className="text-stone-600">
                  {approval.users?.name ?? "Fiscal"}
                  {approval.comment && ` · ${approval.comment}`}
                </p>
              </div>
            ))}
          </Section>
        )}
      </div>
    </main>
  );
}
