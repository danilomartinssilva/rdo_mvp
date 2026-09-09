"use client";

import {
  Camera,
  ChevronLeft,
  CloudRain,
  Copy,
  HardHat,
  Plus,
  Send,
  Trash2,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import type {
  ActivityEntry,
  EquipmentEntry,
  LaborEntry,
  OccurrenceEntry,
  RdoFormData,
  Weather,
} from "@/lib/types";

const weatherOptions: { value: Weather; label: string }[] = [
  { value: "GOOD", label: "Bom" },
  { value: "RAINY", label: "Chuvoso" },
  { value: "IMPRACTICABLE", label: "Impraticável" },
];
const initialRdo: RdoFormData = {
  project_id: "",
  date: new Date().toISOString().slice(0, 10),
  weather_morning: "GOOD",
  weather_afternoon: "GOOD",
  notes: "",
  labor: [],
  equipment: [],
  activities: [],
  occurrences: [],
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
      <div className="mb-4 flex items-center gap-2 text-stone-900">
        {icon}
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function AddButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 py-2.5 text-sm font-medium text-stone-600 hover:border-amber-600 hover:text-amber-700"
    >
      <Plus size={16} />
      {children}
    </button>
  );
}

export function RdoForm({
  projectId = "",
  onBack,
}: {
  projectId?: string;
  onBack?: () => void;
}) {
  const [rdo, setRdo] = useState<RdoFormData>({
    ...initialRdo,
    project_id: projectId,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [copying, setCopying] = useState(false);
  const [copiedPhotoSourceId, setCopiedPhotoSourceId] = useState<string | null>(null);
  const [copiedPhotoPreviews, setCopiedPhotoPreviews] = useState<{ id: string; caption: string | null; signed_url: string | null }[]>([]);
  const change = <K extends keyof RdoFormData>(key: K, value: RdoFormData[K]) =>
    setRdo((current) => ({ ...current, [key]: value }));
  const remove = (
    key: "labor" | "equipment" | "activities" | "occurrences",
    index: number,
  ) =>
    change(
      key,
      rdo[key].filter((_, itemIndex) => itemIndex !== index) as never,
    );
  async function copyPreviousRdo() {
    if (!rdo.project_id) {
      setSaved(false);
      setMessage("Selecione uma obra antes de copiar dados.");
      return;
    }
    const hasData = rdo.labor.length || rdo.equipment.length || rdo.activities.length || rdo.occurrences.length || rdo.notes.trim();
    if (hasData && !window.confirm("Os dados de clima, mão de obra, equipamentos, atividades, ocorrências e observações serão substituídos. Deseja continuar?")) return;
    setCopying(true);
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${rdo.project_id}/rdos/previous?date=${rdo.date}`);
      const result = await response.json() as { source_id: string; source_date: string | null; photos: { id: string; caption: string | null; signed_url: string | null }[]; data: { labor: LaborEntry[]; equipment: EquipmentEntry[]; activities: ActivityEntry[]; occurrences: OccurrenceEntry[]; weather_morning: Weather; weather_afternoon: Weather; notes: string } | null; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível localizar o RDO anterior.");
      if (!result.data || !result.source_date) {
        setSaved(false);
        setMessage("Não há RDO anterior para esta obra.");
        return;
      }
      setRdo((current) => ({ ...current, ...result.data }));
      setCopiedPhotoSourceId(result.photos.length > 0 ? result.source_id : null);
      setCopiedPhotoPreviews(result.photos);
      setSaved(true);
      setMessage(`Dados copiados do RDO de ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${result.source_date}T12:00:00`))}.${result.photos.length ? ` ${result.photos.length} foto(s) estão prontas para revisão e serão copiadas ao salvar.` : ""} Revise antes de salvar.`);
    } catch (error) {
      setSaved(false);
      setMessage(error instanceof Error ? error.message : "Não foi possível copiar os dados.");
    } finally {
      setCopying(false);
    }
  }
  async function save(submit = false) {
    if (!rdo.project_id) {
      setMessage("Selecione uma obra antes de salvar.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        rdo.id ? `/api/rdos/${rdo.id}` : `/api/projects/${rdo.project_id}/rdos`,
        {
          method: rdo.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rdo),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Não foi possível salvar o RDO.");
      if (!rdo.id) setRdo((current) => ({ ...current, id: body.id }));
      const rdoId = body.id ?? rdo.id;
      for (const photo of photos) {
        const form = new FormData();
        form.set("file", photo);
        const upload = await fetch(`/api/rdos/${rdoId}/photos`, { method: "POST", body: form });
        if (!upload.ok) throw new Error((await upload.json()).error || "Não foi possível enviar uma foto.");
      }
      setPhotos([]);
      if (copiedPhotoSourceId) {
        const copied = await fetch(`/api/rdos/${rdoId}/photos/copy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source_rdo_id: copiedPhotoSourceId }),
        });
        if (!copied.ok) throw new Error((await copied.json()).error || "Não foi possível copiar as fotos do RDO anterior.");
        setCopiedPhotoSourceId(null);
        setCopiedPhotoPreviews([]);
      }
      setSaved(true);
      setMessage(copiedPhotoSourceId ? "Rascunho salvo e fotos do RDO anterior copiadas." : "Rascunho salvo com sucesso.");
      if (submit) {
        const sent = await fetch(`/api/rdos/${rdoId}/submit`, {
          method: "POST",
        });
        if (!sent.ok)
          throw new Error(
            (await sent.json()).error || "Não foi possível enviar o RDO.",
          );
        setMessage("RDO enviado para aprovação.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-stone-50 pb-28">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="grid size-10 place-items-center rounded-full hover:bg-stone-200"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
              Diário de obra
            </p>
            <h1 className="text-lg font-bold text-stone-950">Novo RDO</h1>
          </div>
        </div>
      </header>
      <div className="space-y-4 px-4 py-5">
        <Section
          title="Identificação"
          icon={<HardHat size={19} className="text-amber-700" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Data
              <input
                type="date"
                value={rdo.date}
                onChange={(event) => change("date", event.target.value)}
                className="input mt-1"
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Obra
              <input
                value={rdo.project_id}
                onChange={(event) => change("project_id", event.target.value)}
                placeholder="ID da obra selecionada"
                className="input mt-1"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={copyPreviousRdo}
            disabled={copying || !rdo.project_id}
            className="button-secondary mt-4 w-full"
          >
            <Copy size={16} />
            {copying ? "Copiando dados..." : "Copiar dados do dia anterior"}
          </button>
          <p className="mt-2 text-xs text-stone-500">Copia clima, equipe, equipamentos, ocorrências, fotos e observações. Atividades ficam como “Em andamento”.</p>
        </Section>
        <Section
          title="Condições climáticas"
          icon={<CloudRain size={19} className="text-amber-700" />}
        >
          <div className="grid grid-cols-2 gap-3">
            {(["morning", "afternoon"] as const).map((period) => (
              <label
                key={period}
                className="text-sm font-medium text-stone-700"
              >
                {period === "morning" ? "Manhã" : "Tarde"}
                <select
                  value={
                    period === "morning"
                      ? rdo.weather_morning
                      : rdo.weather_afternoon
                  }
                  onChange={(event) =>
                    change(
                      period === "morning"
                        ? "weather_morning"
                        : "weather_afternoon",
                      event.target.value as Weather,
                    )
                  }
                  className="input mt-1"
                >
                  {weatherOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </Section>
        <Section
          title="Mão de obra"
          icon={<HardHat size={19} className="text-amber-700" />}
        >
          {rdo.labor.map((entry, index) => (
            <div
              key={index}
              className="mb-2 grid grid-cols-[1fr_72px_38px] gap-2"
            >
              <input
                className="input"
                placeholder="Função"
                value={entry.role_name}
                onChange={(e) => {
                  const rows = [...rdo.labor];
                  rows[index] = { ...entry, role_name: e.target.value };
                  change("labor", rows);
                }}
              />
              <input
                className="input"
                type="number"
                min="1"
                value={entry.quantity}
                onChange={(e) => {
                  const rows = [...rdo.labor];
                  rows[index] = { ...entry, quantity: Number(e.target.value) };
                  change("labor", rows);
                }}
              />
              <button
                type="button"
                onClick={() => remove("labor", index)}
                className="grid place-items-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={17} />
              </button>
              <label className="col-span-3 flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={entry.is_outsourced}
                  onChange={(e) => {
                    const rows = [...rdo.labor];
                    rows[index] = { ...entry, is_outsourced: e.target.checked };
                    change("labor", rows);
                  }}
                />
                Terceirizada
              </label>
            </div>
          ))}
          <AddButton
            onClick={() =>
              change("labor", [
                ...rdo.labor,
                {
                  role_name: "",
                  quantity: 1,
                  is_outsourced: false,
                } satisfies LaborEntry,
              ])
            }
          >
            Adicionar profissional
          </AddButton>
        </Section>
        <Section
          title="Equipamentos em uso"
          icon={<Wrench size={19} className="text-amber-700" />}
        >
          {rdo.equipment.map((entry, index) => (
            <div
              key={index}
              className="mb-2 grid grid-cols-[1fr_72px_38px] gap-2"
            >
              <input
                className="input"
                placeholder="Ex.: Betoneira"
                value={entry.type_name}
                onChange={(e) => {
                  const rows = [...rdo.equipment];
                  rows[index] = { ...entry, type_name: e.target.value };
                  change("equipment", rows);
                }}
              />
              <input
                className="input"
                type="number"
                min="1"
                value={entry.quantity}
                onChange={(e) => {
                  const rows = [...rdo.equipment];
                  rows[index] = { ...entry, quantity: Number(e.target.value) };
                  change("equipment", rows);
                }}
              />
              <button
                type="button"
                onClick={() => remove("equipment", index)}
                className="grid place-items-center rounded-xl text-stone-400 hover:text-red-600"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <AddButton
            onClick={() =>
              change("equipment", [
                ...rdo.equipment,
                { type_name: "", quantity: 1 } satisfies EquipmentEntry,
              ])
            }
          >
            Adicionar equipamento
          </AddButton>
        </Section>
        <Section
          title="Atividades realizadas"
          icon={<Wrench size={19} className="text-amber-700" />}
        >
          {rdo.activities.map((entry, index) => (
            <div key={index} className="mb-3 rounded-xl bg-stone-50 p-2">
              <div className="flex gap-2">
                <textarea
                  className="input min-h-20 flex-1"
                  placeholder="Descreva a atividade executada"
                  value={entry.description}
                  onChange={(e) => {
                    const rows = [...rdo.activities];
                    rows[index] = { ...entry, description: e.target.value };
                    change("activities", rows);
                  }}
                />
                <button
                  type="button"
                  onClick={() => remove("activities", index)}
                  className="self-start p-2 text-stone-400 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <select
                value={entry.status}
                onChange={(e) => {
                  const rows = [...rdo.activities];
                  rows[index] = {
                    ...entry,
                    status: e.target.value as ActivityEntry["status"],
                  };
                  change("activities", rows);
                }}
                className="input mt-2 text-sm"
              >
                <option value="COMPLETED">Concluído</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="STOPPED">Paralisado</option>
              </select>
            </div>
          ))}
          <AddButton
            onClick={() =>
              change("activities", [
                ...rdo.activities,
                {
                  description: "",
                  status: "IN_PROGRESS",
                } satisfies ActivityEntry,
              ])
            }
          >
            Adicionar atividade
          </AddButton>
        </Section>
        <Section
          title="Ocorrências e imprevistos"
          icon={<CloudRain size={19} className="text-amber-700" />}
        >
          {rdo.occurrences.map((entry, index) => (
            <div key={index} className="mb-3 flex gap-2">
              <textarea
                className="input min-h-20 flex-1"
                placeholder="Descreva a ocorrência"
                value={entry.description}
                onChange={(e) => {
                  const rows = [...rdo.occurrences];
                  rows[index] = { ...entry, description: e.target.value };
                  change("occurrences", rows);
                }}
              />
              <button
                type="button"
                onClick={() => remove("occurrences", index)}
                className="self-start p-2 text-stone-400 hover:text-red-600"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <AddButton
            onClick={() =>
              change("occurrences", [
                ...rdo.occurrences,
                { type: "OTHER", description: "" } satisfies OccurrenceEntry,
              ])
            }
          >
            Registrar ocorrência
          </AddButton>
        </Section>
        <Section
          title="Registro fotográfico"
          icon={<Camera size={19} className="text-amber-700" />}
        >
          <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-4 py-7 text-center text-sm text-stone-600 hover:border-amber-600">
            <Camera className="mb-2 text-amber-700" />
            <span className="font-medium">Adicionar fotos</span>
            <span className="mt-1 text-xs">
              Até 6 imagens, máximo 8 MB cada
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                const valid = selected.filter((file) => file.size <= 8 * 1024 * 1024);
                if (selected.length !== valid.length) setMessage("Cada foto deve ter no máximo 8 MB.");
                setPhotos((current) => [...current, ...valid].slice(0, Math.max(0, 6 - copiedPhotoPreviews.length)));
              }}
            />
          </label>
          {copiedPhotoPreviews.length > 0 && <div className="mt-3"><p className="mb-2 text-xs font-semibold text-amber-800">Fotos copiadas do RDO anterior. Serão duplicadas ao salvar.</p><div className="grid grid-cols-3 gap-2">{copiedPhotoPreviews.map((photo) => photo.signed_url ? <figure key={photo.id}><img src={photo.signed_url} alt={photo.caption ?? "Foto do RDO anterior"} className="aspect-square w-full rounded-lg object-cover" /><figcaption className="mt-1 line-clamp-2 text-xs text-stone-500">{photo.caption}</figcaption></figure> : <div key={photo.id} className="grid aspect-square place-items-center rounded-lg bg-stone-100 text-xs text-stone-500">Foto indisponível</div>)}</div></div>}
          {photos.length > 0 && <p className="mt-2 text-xs font-medium text-stone-600">{photos.length} foto(s) pronta(s) para envio.</p>}
        </Section>
        <Section
          title="Observações gerais"
          icon={<HardHat size={19} className="text-amber-700" />}
        >
          <textarea
            className="input min-h-28"
            value={rdo.notes}
            onChange={(e) => change("notes", e.target.value)}
            placeholder="Informações relevantes do dia"
          />
        </Section>
        {message && (
          <p
            role="status"
            className={
              saved
                ? "rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
                : "rounded-xl bg-red-50 p-3 text-sm text-red-800"
            }
          >
            {message}
          </p>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white p-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button
            disabled={saving}
            onClick={() => save()}
            className="button-secondary flex-1"
          >
            Salvar rascunho
          </button>
          <button
            disabled={saving}
            onClick={() => save(true)}
            className="button-primary flex-1"
          >
            <Send size={16} />
            {saving ? "Salvando" : "Enviar"}
          </button>
        </div>
      </div>
    </main>
  );
}
