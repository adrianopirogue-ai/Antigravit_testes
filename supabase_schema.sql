-- Schema do Banco de Dados - Brasil Mais App
-- Execute este script no SQL Editor do Supabase

-- Tabela de Medicamentos
CREATE TABLE IF NOT EXISTS medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  expiration_date DATE,
  promo_percent DECIMAL(5,2) DEFAULT 0,
  requires_prescription BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar colunas novas caso a tabela ja exista
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiration_date DATE;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS promo_percent DECIMAL(5,2) DEFAULT 0;

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  phone1 TEXT NOT NULL,
  phone2 TEXT,
  cep TEXT NOT NULL,
  address TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_type TEXT NOT NULL,
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Administradores (emails para notificacao de pedidos)
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_medicines_type ON medicines(type);
CREATE INDEX IF NOT EXISTS idx_medicines_requires_prescription ON medicines(requires_prescription);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medicine_id ON order_items(medicine_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS update_medicines_updated_at ON medicines;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Segurança
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Medicamentos são visíveis para todos" ON medicines;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem modificar medicamentos" ON medicines;
DROP POLICY IF EXISTS "Usuários veem apenas seus pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários podem criar pedidos" ON orders;
DROP POLICY IF EXISTS "Acesso a itens via pedido" ON order_items;
DROP POLICY IF EXISTS "Clientes podem ver seu perfil" ON customers;
DROP POLICY IF EXISTS "Clientes podem criar perfil" ON customers;
DROP POLICY IF EXISTS "Clientes podem atualizar perfil" ON customers;
DROP POLICY IF EXISTS "Admins podem ver clientes" ON customers;
DROP POLICY IF EXISTS "Admins podem ler" ON admins;
DROP POLICY IF EXISTS "Admins podem escrever" ON admins;

-- Políticas de Acesso (RLS Policies)

-- Medicamentos: Leitura pública, escrita apenas para autenticados (admin)
CREATE POLICY "Medicamentos são visíveis para todos"
  ON medicines FOR SELECT
  USING (true);

CREATE POLICY "Apenas usuários autenticados podem modificar medicamentos"
  ON medicines FOR ALL
  USING (auth.role() = 'authenticated');

-- Pedidos: Usuários veem apenas seus próprios pedidos
CREATE POLICY "Usuários veem apenas seus pedidos"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar pedidos"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Itens do pedido: Acesso via pedido
CREATE POLICY "Acesso a itens via pedido"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Clientes: acesso apenas ao proprio perfil
CREATE POLICY "Clientes podem ver seu perfil"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clientes podem criar perfil"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clientes podem atualizar perfil"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins: podem ver todos os clientes
CREATE POLICY "Admins podem ver clientes"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (auth.jwt() ->> 'email')
      AND admins.is_active = true
    )
  );

-- Admins: podem ler apenas seu proprio cadastro
CREATE POLICY "Admins podem ler"
  ON admins FOR SELECT
  USING (
    admins.email = (auth.jwt() ->> 'email')
    AND admins.is_active = true
  );

-- Funcao para login por CPF/CNPJ (retorna email)
CREATE OR REPLACE FUNCTION public.get_email_by_cpf(p_cpf text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.customers WHERE cpf_cnpj = p_cpf LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_email_by_cpf(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_cpf(text) TO anon, authenticated;

-- Funcao para vincular cadastro existente ao usuario logado
DROP FUNCTION IF EXISTS public.claim_customer_profile(text, text, jsonb);

CREATE OR REPLACE FUNCTION public.claim_customer_profile(p_email text, p_cpf text, p_payload jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_customer_id uuid;
  v_existing_user uuid;
  v_email text := trim(coalesce(p_email, ''));
  v_cpf text := trim(coalesce(p_cpf, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, user_id INTO v_customer_id, v_existing_user
  FROM public.customers
  WHERE email = v_email AND cpf_cnpj = v_cpf
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_existing_user IS NOT NULL AND v_existing_user <> v_uid THEN
    RAISE EXCEPTION 'CPF/CNPJ ja cadastrado em outra conta';
  END IF;

  UPDATE public.customers
  SET
    user_id = v_uid,
    name = COALESCE(NULLIF(trim(p_payload->>'name'), ''), name),
    email = COALESCE(NULLIF(trim(p_payload->>'email'), ''), v_email, email),
    cpf_cnpj = COALESCE(NULLIF(trim(p_payload->>'cpf_cnpj'), ''), v_cpf, cpf_cnpj),
    phone1 = COALESCE(NULLIF(trim(p_payload->>'phone1'), ''), phone1),
    phone2 = NULLIF(trim(coalesce(p_payload->>'phone2', '')), ''),
    cep = COALESCE(NULLIF(trim(p_payload->>'cep'), ''), cep),
    address = COALESCE(NULLIF(trim(p_payload->>'address'), ''), address),
    address_number = COALESCE(NULLIF(trim(p_payload->>'address_number'), ''), address_number),
    address_type = COALESCE(NULLIF(trim(p_payload->>'address_type'), ''), address_type),
    municipio = COALESCE(NULLIF(trim(p_payload->>'municipio'), ''), municipio),
    estado = COALESCE(NULLIF(trim(p_payload->>'estado'), ''), estado),
    reference = NULLIF(trim(coalesce(p_payload->>'reference', '')), ''),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_customer_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_customer_profile(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_customer_profile(text, text, jsonb) TO authenticated;

-- Criar cliente automaticamente apos cadastro (usa metadata do usuario)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_customer();

CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := trim(coalesce(new.raw_user_meta_data->>'name', ''));
  v_cpf_cnpj text := trim(coalesce(new.raw_user_meta_data->>'cpf_cnpj', ''));
  v_phone1 text := trim(coalesce(new.raw_user_meta_data->>'phone1', ''));
  v_phone2 text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone2', '')), '');
  v_cep text := trim(coalesce(new.raw_user_meta_data->>'cep', ''));
  v_address text := trim(coalesce(new.raw_user_meta_data->>'address', ''));
  v_address_number text := trim(coalesce(new.raw_user_meta_data->>'address_number', ''));
  v_address_type text := trim(coalesce(new.raw_user_meta_data->>'address_type', ''));
  v_municipio text := trim(coalesce(new.raw_user_meta_data->>'municipio', ''));
  v_estado text := trim(coalesce(new.raw_user_meta_data->>'estado', ''));
  v_reference text := nullif(trim(coalesce(new.raw_user_meta_data->>'reference', '')), '');
  v_email text := trim(coalesce(new.email, ''));
BEGIN
  IF v_name = '' OR v_email = '' OR v_cpf_cnpj = '' OR v_phone1 = '' OR v_cep = '' OR v_address = '' OR v_address_number = '' OR v_address_type = '' OR v_municipio = '' OR v_estado = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.customers (
    user_id,
    name,
    email,
    cpf_cnpj,
    phone1,
    phone2,
    cep,
    address,
    address_number,
    address_type,
    municipio,
    estado,
    reference
  ) VALUES (
    new.id,
    v_name,
    v_email,
    v_cpf_cnpj,
    v_phone1,
    v_phone2,
    v_cep,
    v_address,
    v_address_number,
    v_address_type,
    v_municipio,
    v_estado,
    v_reference
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();

-- Inserir dados de exemplo (medicamentos do mock atual)
INSERT INTO medicines (name, dosage, price, wholesale_price, type, description, stock, image_url, requires_prescription) VALUES
('Dipirona Sódica', '500mg', 4.50, 2.90, 'Analgesic', 'Analgésico e antitérmico.', 1500, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400', false),
('Amoxicilina', '875mg', 25.90, 18.50, 'Antibiotic', 'Antibiótico de amplo espectro.', 450, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400', true),
('Loratadina', '10mg', 12.00, 8.00, 'Antiallergic', 'Antialérgico para alívio de rinite.', 800, 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&q=80&w=400', false),
('Omeprazol', '20mg', 18.90, 12.50, 'Gastric', 'Para tratamento de úlceras gástricas.', 600, 'https://images.unsplash.com/photo-1585237618992-1c25110f04ca?auto=format&fit=crop&q=80&w=400', false),
('Ibuprofeno', '600mg', 15.50, 10.00, 'Anti-inflammatory', 'Anti-inflamatório não esteroide.', 1200, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400', false),
('Rivotril (Clonazepam)', '2mg', 35.00, 28.00, 'Controlled', 'Ansiolítico e anticonvulsivante.', 200, 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&q=80&w=400', true),
('Paracetamol', '750mg', 5.00, 3.50, 'Analgesic', 'Analgésico e antitérmico seguro.', 2000, 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400', false),
('Losartana Potássica', '50mg', 8.90, 5.50, 'Cardiovascular', 'Para tratamento de pressão alta.', 1000, 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=400', true),
('Simeticona', '125mg', 9.90, 6.90, 'Gastric', 'Alívio de gases e desconforto abdominal.', 500, 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400', false),
('Vitamina C', '1g', 15.00, 11.00, 'Supplement', 'Suplemento vitamínico efervescente.', 300, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=400', false),
('Azitromicina', '500mg', 32.00, 25.00, 'Antibiotic', 'Antibiótico para infecções respiratórias.', 150, 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=400', true),
('Dorflex', '300mg', 18.50, 14.00, 'Analgesic', 'Relaxante muscular e analgésico.', 1200, 'https://images.unsplash.com/photo-1542037941-ab514125749f?auto=format&fit=crop&q=80&w=400', false);
