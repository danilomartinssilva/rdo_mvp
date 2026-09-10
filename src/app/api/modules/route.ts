import { requireUser } from "@/lib/supabase/server";
export async function GET(){const a=await requireUser();if('error'in a)return a.error;const{data,error}=await a.supabase.from('modules').select('code,name,description,route,icon').eq('is_active',true).order('sort_order');return error?Response.json({error:error.message},{status:400}):Response.json(data)}
