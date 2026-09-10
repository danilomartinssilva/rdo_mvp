import { requireUser } from "@/lib/supabase/server";
import { z } from "zod";
const schema=z.object({code:z.string().max(40).optional(),name:z.string().min(2),unit:z.string().min(1).max(12),source:z.string().default('OWN')});
export async function GET(){const a=await requireUser();if('error'in a)return a.error;const{data,error}=await a.supabase.from('compositions').select('*, composition_inputs(coefficient, inputs(name,unit,unit_price))').order('name');return error?Response.json({error:error.message},{status:400}):Response.json(data)}
export async function POST(r:Request){const a=await requireUser();if('error'in a)return a.error;const p=schema.safeParse(await r.json());if(!p.success)return Response.json({error:'Composição inválida.'},{status:422});const{data,error}=await a.supabase.from('compositions').insert(p.data).select().single();return error?Response.json({error:error.message},{status:400}):Response.json(data,{status:201})}
