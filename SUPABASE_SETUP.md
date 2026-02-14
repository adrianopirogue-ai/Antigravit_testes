# Guia de Configuração do Supabase

## Passo 1: Criar Conta e Projeto

1. Acesse: https://supabase.com/
2. Clique em **"Start your project"**
3. Faça login com GitHub, Google ou email
4. Clique em **"New Project"**
5. Preencha:
   - **Name**: `brasil-mais` (ou seu nome preferido)
   - **Database Password**: Crie uma senha forte (guarde-a!)
   - **Region**: `South America (São Paulo)` (mais próximo do Brasil)
6. Clique em **"Create new project"** (aguarde ~2 minutos para provisionar)

## Passo 2: Obter Credenciais

1. No painel do projeto, vá em **Settings** (ícone de engrenagem) > **API**
2. Copie os seguintes valores:
   - **Project URL**: algo como `https://xxxxxxxxxxx.supabase.co`
   - **anon/public key**: uma chave longa começando com `eyJ...`

## Passo 3: Configurar no Projeto Local

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` e substitua pelos valores copiados:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...sua-chave-aqui
   ```

3. **IMPORTANTE**: O arquivo `.env.local` já está no `.gitignore` (não será enviado ao GitHub)

## Passo 4: Criar Tabelas no Banco

1. No Supabase, vá em **SQL Editor** (ícone de banco de dados)
2. Clique em **"New query"**
3. Cole o SQL que está no arquivo `supabase_schema.sql` (será criado em breve)
4. Clique em **"Run"**
5. Esse script cria também a tabela `customers` e a função `get_email_by_cpf` para login por CPF/CNPJ.

## Passo 5: Storage para imagens

1. No Supabase, va em **Storage** e clique em **Create bucket**
2. Nome do bucket: `medicine-images`
3. Marque como **Public** (recomendado para exibir imagens no catalogo)

Se preferir bucket privado, crie as politicas abaixo no SQL Editor:
```sql
create policy "Public read medicine images"
  on storage.objects for select
  using (bucket_id = 'medicine-images');

create policy "Authenticated upload medicine images"
  on storage.objects for insert
  with check (bucket_id = 'medicine-images' and auth.role() = 'authenticated');
```

## Passo 6: URLs de autenticacao

1. Supabase -> **Authentication** -> **URL Configuration**
2. Configure:
   - **Site URL**: `https://adrianopirogue-ai.github.io/Antigravit_testes`
   - **Additional Redirect URLs**:
     - `https://adrianopirogue-ai.github.io/Antigravit_testes/admin/reset-password`
     - `https://adrianopirogue-ai.github.io/Antigravit_testes/cliente/reset-password`

## Passo 7: Administradores que recebem pedidos

1. No Supabase, vá em **SQL Editor**
2. Insira pelo menos um administrador:
   ```sql
   insert into admins (name, email) values ('Admin', 'admin@exemplo.com');
   ```
   - O email deve existir e estar correto.

## Passo 8: Envio de emails de pedido (Edge Function)

O envio de email usa a função `send-order-email` em `supabase/functions/send-order-email/index.ts`.

1. Instale o Supabase CLI (se ainda não tiver).
2. Faça login: `supabase login`
3. Deploy da função:
   ```bash
   supabase functions deploy send-order-email
   ```
4. Configure as secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=... RESEND_FROM=seu@email.com SERVICE_ROLE_KEY=...
   ```
   - `RESEND_API_KEY`: chave da Resend (https://resend.com)
   - `RESEND_FROM`: email de envio configurado na Resend
   - `SERVICE_ROLE_KEY`: **Service Role Key** do Supabase (necessario para ler pedidos e clientes)

Opcional:
- `ADMIN_EMAILS`: lista separada por virgula para sobrescrever a tabela `admins`.

## Próximos Passos

Após configurar, me envie uma confirmação e eu finalizo a integração:
- Migrar dados mockados para o Supabase
- Implementar autenticação real
- Conectar o catálogo ao banco de dados
