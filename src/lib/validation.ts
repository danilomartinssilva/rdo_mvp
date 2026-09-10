import { z } from "zod";

const weather = z.enum(["GOOD", "RAINY", "IMPRACTICABLE"]);
const activity = z.enum(["COMPLETED", "IN_PROGRESS", "STOPPED"]);
const occurrence = z.enum(["STOPPAGE", "ACCIDENT", "SUPPLY_DELAY", "TECHNICAL_VISIT", "OTHER"]);

export const projectSchema = z.object({
  name: z.string().min(2).max(120), address: z.string().min(5).max(250),
  client_name: z.string().min(2).max(120), start_date: z.string().date(),
  due_date: z.string().date().nullable().optional(), technical_lead: z.string().max(120).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  postal_code: z.string().max(12).nullable().optional(), street: z.string().max(150).nullable().optional(),
  address_number: z.string().max(20).nullable().optional(), complement: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(), city: z.string().max(100).nullable().optional(),
  state: z.string().length(2).nullable().optional(), latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const rdoSchema = z.object({
  project_id: z.string().uuid(), date: z.string().date(), weather_morning: weather, weather_afternoon: weather,
  notes: z.string().max(4000).default(""),
  labor: z.array(z.object({ role_name: z.string().min(2).max(80), quantity: z.number().int().positive(), is_outsourced: z.boolean() })).default([]),
  equipment: z.array(z.object({ type_name: z.string().min(2).max(80), quantity: z.number().int().positive() })).default([]),
  activities: z.array(z.object({ description: z.string().min(2).max(1000), status: activity })).default([]),
  occurrences: z.array(z.object({ type: occurrence, description: z.string().min(2).max(1000) })).default([]),
});

export const approvalSchema = z.object({ status: z.enum(["APPROVED", "WITH_NOTES"]), comment: z.string().max(2000).optional() })
  .refine((value) => value.status === "APPROVED" || Boolean(value.comment?.trim()), { message: "Informe uma observação ao devolver o RDO." });
