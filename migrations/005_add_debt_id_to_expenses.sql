-- ==========================================
-- MIGRACIÓN: Agregar debt_id a expenses
-- ==========================================
-- Fecha: 2026-01-23
-- Descripción: Agregar columna debt_id para vincular pagos de deudas con gastos
-- ==========================================

-- 1. Agregar columna debt_id a expenses
-- ==========================================
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS debt_id UUID REFERENCES debts(id) ON DELETE SET NULL;

-- 2. Crear índice para debt_id
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_expenses_debt_id ON expenses(debt_id) WHERE debt_id IS NOT NULL;

-- ==========================================
-- FIN DE LA MIGRACIÓN
-- ==========================================

-- Para verificar:
-- SELECT * FROM expenses WHERE debt_id IS NOT NULL;
