export type Weather = "GOOD" | "RAINY" | "IMPRACTICABLE";
export type RdoStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "WITH_NOTES";
export type ActivityStatus = "COMPLETED" | "IN_PROGRESS" | "STOPPED";

export type LaborEntry = { id?: string; role_name: string; quantity: number; is_outsourced: boolean };
export type EquipmentEntry = { id?: string; type_name: string; quantity: number };
export type ActivityEntry = { id?: string; description: string; status: ActivityStatus };
export type OccurrenceEntry = { id?: string; type: string; description: string };
export type PhotoEntry = { id?: string; path: string; caption: string | null; position: number };

export type RdoFormData = {
  id?: string;
  project_id: string;
  date: string;
  weather_morning: Weather;
  weather_afternoon: Weather;
  notes: string;
  labor: LaborEntry[];
  equipment: EquipmentEntry[];
  activities: ActivityEntry[];
  occurrences: OccurrenceEntry[];
  photos?: PhotoEntry[];
};

export const statusLabel: Record<RdoStatus, string> = {
  DRAFT: "Rascunho",
  PENDING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  WITH_NOTES: "Com observações",
};
