# Seed de desenvolvimento

Defina estas variáveis em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
SEED_USER_EMAIL=teste@canteiro.local
SEED_USER_PASSWORD=uma-senha-temporaria-segura
SEED_USER_NAME=Usuario de Teste
SEED_PROJECT_NAME=Obra de Teste
```

Execute:

```bash
npm run seed
```

O script cria ou atualiza o usuário administrador, o perfil público, a obra e o vínculo entre ambos. Nunca use a chave secreta em variáveis `NEXT_PUBLIC_*`.
