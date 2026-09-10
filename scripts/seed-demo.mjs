import { createClient } from "@supabase/supabase-js";

const required=["NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","DEMO_ADMIN_PASSWORD","DEMO_COMMERCIAL_PASSWORD","DEMO_FIELD_PASSWORD"];
const missing=required.filter(key=>!process.env[key]);
if(missing.length){console.error(`Variáveis ausentes: ${missing.join(', ')}`);process.exit(1)}
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const users=[
  {email:"admin.demo@canteiro.local",name:"Marina Albuquerque",role:"ADMIN",password:process.env.DEMO_ADMIN_PASSWORD},
  {email:"comercial.demo@canteiro.local",name:"Lucas Ferreira",role:"COMMERCIAL",password:process.env.DEMO_COMMERCIAL_PASSWORD},
  {email:"campo.demo@canteiro.local",name:"Rafael Santos",role:"FIELD",password:process.env.DEMO_FIELD_PASSWORD},
];
async function one(table,field,value,payload){const{data}=await db.from(table).select('*').eq(field,value).limit(1).maybeSingle();if(data)return data;const{data:created,error}=await db.from(table).insert(payload).select().single();if(error)throw error;return created}
async function authUser(user){const{data:list,error:listError}=await db.auth.admin.listUsers({perPage:1000});if(listError)throw listError;let account=list.users.find(item=>item.email===user.email);if(!account){const{data,error:createError}=await db.auth.admin.createUser({email:user.email,password:user.password,email_confirm:true,user_metadata:{full_name:user.name}});if(createError)throw createError;account=data.user}const{error:profileError}=await db.from('users').upsert({id:account.id,name:user.name,email:user.email,role:user.role});if(profileError)throw profileError;return account}
async function run(){
  const accounts=Object.fromEntries(await Promise.all(users.map(async user=>[user.role,await authUser(user)])));
  const {data:modules,error:moduleError}=await db.from('modules').select('id,code');if(moduleError)throw moduleError;
  for(const user of users)for(const code of user.role==='FIELD'?['RDO']:['RDO','BUDGET']){const module=modules.find(item=>item.code===code);const{error}=await db.from('user_module_access').upsert({user_id:accounts[user.role].id,module_id:module.id,granted_by:accounts.ADMIN.id});if(error)throw error}
  const acme=await one('clients','name','Construtora Horizonte Ltda',{name:'Construtora Horizonte Ltda',document:'12.345.678/0001-90',email:'contato@horizonte.demo',phone:'(11) 3456-7890'});
  const project=await one('projects','name','DEMO Residencial Parque das Flores',{name:'DEMO Residencial Parque das Flores',address:'Rua das Palmeiras, 450 - Campinas/SP',client_name:acme.name,client_id:acme.id,start_date:'2026-01-15',due_date:'2026-12-20',technical_lead:'Marina Albuquerque',description:'Edifício residencial de médio padrão com 24 unidades.',city:'Campinas',state:'SP',latitude:-22.9056,longitude:-47.0608});
  for(const user of users){const{error}=await db.from('project_users').upsert({project_id:project.id,user_id:accounts[user.role].id,role:user.role});if(error)throw error}
  const catalog=[['MAT-001','Cimento CP II-E 32','MATERIAL','kg',0.72],['MAT-002','Areia média lavada','MATERIAL','m³',165],['MAT-003','Bloco cerâmico 14x19x29','MATERIAL','un',1.45],['MAT-004','Tinta acrílica premium','MATERIAL','L',32],['MO-001','Pedreiro','LABOR','h',28],['MO-002','Servente','LABOR','h',19],['EQ-001','Betoneira 400 L','EQUIPMENT','h',42]];
  const inputs={};for(const[x,name,type,unit,price]of catalog)inputs[x]=await one('inputs','code',x,{code:x,name,type,unit,unit_price:price,source:'DEMO'});
  const alvenaria=await one('compositions','code','DEMO-COMP-001',{code:'DEMO-COMP-001',name:'Alvenaria de vedação em bloco cerâmico 14 cm',unit:'m²',source:'DEMO'});
  for(const[code,coefficient]of [['MAT-003',16.7],['MAT-001',3.2],['MAT-002',0.014],['MO-001',0.8],['MO-002',0.8]])await db.from('composition_inputs').upsert({composition_id:alvenaria.id,input_id:inputs[code].id,coefficient});
  const reference=await one('reference_tables','name','DEMO Custos Referenciais - Setembro/2026',{name:'DEMO Custos Referenciais - Setembro/2026',source:'DEMO',reference_month:'2026-09',created_by:accounts.COMMERCIAL.id});
  for(const[code,description,unit,unit_price]of [['DEMO-001','Bloco cerâmico de vedação 14 cm','un',1.45],['DEMO-002','Pedreiro','h',28],['DEMO-003','Servente','h',19]])await one('reference_items','description',description,{reference_table_id:reference.id,code,description,unit,unit_price});
  const budget=await one('budgets','title','DEMO Orçamento Base - Parque das Flores',{project_id:project.id,version:1,status:'ISSUED',title:'DEMO Orçamento Base - Parque das Flores',bdi_percent:22.5,created_by:accounts.COMMERCIAL.id});
  const wbs=await one('wbs_nodes','code','1.2.1',{budget_id:budget.id,parent_id:null,code:'1.2.1',name:'Vedação em alvenaria',sort_order:1});
  await one('budget_items','description','Alvenaria de vedação - DEMO',{wbs_node_id:wbs.id,composition_id:alvenaria.id,description:'Alvenaria de vedação - DEMO',unit:'m²',quantity:680,unit_cost:69.34});
  const dailyReports=[
    ['2026-09-07','APPROVED','GOOD','Frente de alvenaria avancou conforme planejamento.'],
    ['2026-09-08','PENDING_APPROVAL','RAINY','Chuva leve no periodo da tarde.'],
    ['2026-09-09','DRAFT','GOOD','Continuidade da execucao das vedacoes.'],
  ];
  for(const [date,status,weather,notes] of dailyReports){const{data:existing}=await db.from('rdos').select('id').eq('project_id',project.id).eq('date',date).maybeSingle();let rdo=existing;if(!rdo){const{data,error}=await db.from('rdos').insert({project_id:project.id,date,weather_morning:weather,weather_afternoon:weather,status,notes,created_by:accounts.FIELD.id,submitted_at:status==='DRAFT'?null:`${date}T18:00:00Z`}).select().single();if(error)throw error;rdo=data}await db.from('rdo_labor').delete().eq('rdo_id',rdo.id);await db.from('rdo_labor').insert([{rdo_id:rdo.id,role_name:'Pedreiro',quantity:5,is_outsourced:false},{rdo_id:rdo.id,role_name:'Servente',quantity:3,is_outsourced:false}]);await db.from('rdo_activities').delete().eq('rdo_id',rdo.id);await db.from('rdo_activities').insert({rdo_id:rdo.id,description:'Execucao de alvenaria de vedacao no pavimento terreo.',status:'IN_PROGRESS'})}
  console.log('Carga demonstrativa concluída.');console.log(`Obra: ${project.name}`);console.log('Usuários: admin.demo@canteiro.local, comercial.demo@canteiro.local, campo.demo@canteiro.local');
}
run().catch(error=>{console.error('Falha no seed demo:',error.message??error);process.exit(1)});
