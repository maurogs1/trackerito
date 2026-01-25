-- ==========================================
-- MIGRACIÓN: Sistema de Ingresos
-- ==========================================
-- Fecha: 2026-01-23
-- Descripción: Agregar tabla de ingresos para calcular balance real
-- ==========================================

-- 1. Crear tabla de ingresos
-- ==========================================
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'salary' CHECK (type IN ('salary', 'freelance', 'bonus', 'investment', 'rental', 'other')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_type ON incomes(type);
CREATE INDEX IF NOT EXISTS idx_incomes_recurring ON incomes(is_recurring) WHERE is_recurring = TRUE;

-- 3. Habilitar RLS (Row Level Security)
-- ==========================================
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios ingresos
CREATE POLICY "Users can view own incomes" ON incomes
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios ingresos
CREATE POLICY "Users can insert own incomes" ON incomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios ingresos
CREATE POLICY "Users can update own incomes" ON incomes
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios ingresos
CREATE POLICY "Users can delete own incomes" ON incomes
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Trigger para updated_at (usando función built-in de Supabase)
-- ==========================================
-- Supabase ya tiene la función moddatetime() disponible
-- Solo necesitamos crear el trigger

CREATE EXTENSION IF NOT EXISTS moddatetime;

DROP TRIGGER IF EXISTS trigger_income_updated_at ON incomes;
CREATE TRIGGER trigger_income_updated_at
    BEFORE UPDATE ON incomes
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- FIN DE LA MIGRACIÓN
-- ==========================================

-- Para verificar:
-- SELECT * FROM incomes WHERE user_id = 'tu-user-id';
