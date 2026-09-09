import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SEED_USER_PASSWORD",
];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Variáveis ausentes em .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const email = process.env.SEED_USER_EMAIL ?? "teste@canteiro.local";
const password = process.env.SEED_USER_PASSWORD;
const name = process.env.SEED_USER_NAME ?? "Usuário de Teste";
const projectName = process.env.SEED_PROJECT_NAME ?? "Obra de Teste";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function getOrCreateAuthUser() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Não foi possível criar o usuário de teste.");
  return data.user;
}

try {
  const authUser = await getOrCreateAuthUser();
  const { error: profileError } = await supabase.from("users").upsert({
    id: authUser.id,
    name,
    email,
    role: "ADMIN",
  });
  if (profileError) throw profileError;

  const { data: existingProject, error: projectLookupError } = await supabase
    .from("projects")
    .select("id")
    .eq("name", projectName)
    .limit(1)
    .maybeSingle();
  if (projectLookupError) throw projectLookupError;

  let project = existingProject;
  if (!project) {
    const { data, error } = await supabase.from("projects").insert({
      name: projectName,
      address: "Av. Exemplo, 1000 - São Paulo/SP",
      client_name: "Cliente de Teste",
      start_date: new Date().toISOString().slice(0, 10),
      technical_lead: name,
    }).select("id").single();
    if (error) throw error;
    project = data;
  }

  const { error: membershipError } = await supabase.from("project_users").upsert({
    project_id: project.id,
    user_id: authUser.id,
    role: "ADMIN",
  });
  if (membershipError) throw membershipError;

  console.log("Seed concluído.");
  console.log(`Usuário: ${email} (${authUser.id})`);
  console.log(`Obra: ${projectName} (${project.id})`);
} catch (error) {
  console.error("Falha ao executar seed:", error.message ?? error);
  process.exit(1);
}
