-- ==========================================
-- MIGRACION: Frecuencia de ingresos recurrentes
-- ==========================================
-- Fecha: 2026-02-05
-- Descripcion: Agregar columna recurring_frequency para soportar
--              ingresos semanales, quincenales y mensuales
-- ==========================================

-- Agregar columna de frecuencia (default 'monthly' para compatibilidad)
ALTER TABLE incomes
ADD COLUMN IF NOT EXISTS recurring_frequency TEXT DEFAULT 'monthly'
CHECK (recurring_frequency IN ('monthly', 'biweekly', 'weekly'));

-- ==========================================
-- FIN DE LA MIGRACION
-- ==========================================
