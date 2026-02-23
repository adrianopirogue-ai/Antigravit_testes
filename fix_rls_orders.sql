-- ============================================================
-- BRASIL MAIS - SCRIPT DE CORRECAO COMPLETO
-- Execute TODO este script no Supabase SQL Editor
-- Acesse: https://supabase.com/dashboard -> seu projeto -> SQL Editor
-- ============================================================

-- 1. ADICIONAR COLUNA EXPIRATION_DATE (se nao existir)
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiration_date DATE;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS promo_percent DECIMAL(5,2) DEFAULT 0;

-- ============================================================
-- 2. CORRIGIR POLITICAS RLS PARA TABELA ORDERS
-- ============================================================

-- Remover politicas antigas para evitar conflitos
DROP POLICY IF EXISTS "Usuários veem apenas seus pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários podem criar pedidos" ON orders;
DROP POLICY IF EXISTS "Admins podem ver todos os pedidos" ON orders;
DROP POLICY IF EXISTS "Admins podem atualizar todos os pedidos" ON orders;
DROP POLICY IF EXISTS "Admins podem remover pedidos" ON orders;

-- Permitir que usuarios vejam APENAS seus proprios pedidos
CREATE POLICY "Usuarios veem apenas seus pedidos"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir que usuarios criem pedidos
CREATE POLICY "Usuarios podem criar pedidos"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir que ADMINS vejam TODOS os pedidos
CREATE POLICY "Admins podem ver todos os pedidos"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (auth.jwt() ->> 'email')
      AND admins.is_active = true
    )
  );

-- Permitir que ADMINS atualizem TODOS os pedidos (Confirmar / Cancelar)
CREATE POLICY "Admins podem atualizar todos os pedidos"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (auth.jwt() ->> 'email')
      AND admins.is_active = true
    )
  );

-- Permitir que ADMINS removam pedidos
CREATE POLICY "Admins podem remover pedidos"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (auth.jwt() ->> 'email')
      AND admins.is_active = true
    )
  );

-- ============================================================
-- 3. GARANTIR QUE SEU EMAIL ESTA CADASTRADO NA TABELA ADMINS
-- Substitua 'seu-email@exemplo.com' pelo email com que voce faz login
-- ============================================================

INSERT INTO admins (email, is_active)
VALUES ('adriano_2@msn.com', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- ============================================================
-- 4. VERIFICAR SE FUNCIONOU
-- ============================================================
-- Deve retornar 1 linha com seu email
SELECT * FROM admins WHERE email = 'adriano_2@msn.com';
