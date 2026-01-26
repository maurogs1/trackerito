-- Migración: Crear tabla de Grupos de Pago
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de grupos de pago
CREATE TABLE IF NOT EXISTS payment_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'card',
    color VARCHAR(20) DEFAULT '#1976D2',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar columna payment_group_id a expenses
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS payment_group_id UUID REFERENCES payment_groups(id) ON DELETE SET NULL;

-- 3. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_payment_groups_user_id ON payment_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_group_id ON expenses(payment_group_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE payment_groups ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad
CREATE POLICY "Users can view own payment groups" ON payment_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment groups" ON payment_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment groups" ON payment_groups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment groups" ON payment_groups
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payment_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_groups_updated_at
    BEFORE UPDATE ON payment_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_groups_updated_at();
