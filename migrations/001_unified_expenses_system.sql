-- ==========================================
-- MIGRACIÓN: Sistema Unificado de Gastos
-- ==========================================
-- Fecha: 2026-01-17
-- Descripción: Extender la tabla 'expenses' para soportar cualquier método de pago
--              de forma genérica, incluyendo tarjetas de crédito, débito, cuotas, etc.
--
-- IMPORTANTE: Esta migración NO elimina la tabla credit_card_purchases.
--            Primero ejecuta esta migración, luego ejecuta el script de migración
--            de datos (002_migrate_credit_card_purchases.sql) y finalmente
--            puedes deprecar la tabla antigua.
-- ==========================================

-- 1. Agregar nuevas columnas a la tabla expenses
-- ==========================================

-- payment_method: Método de pago (cash, credit_card, debit_card, etc.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE expenses ADD COLUMN payment_method TEXT DEFAULT 'cash';
        COMMENT ON COLUMN expenses.payment_method IS 'Método de pago: cash, credit_card, debit_card, bank_transfer, crypto, etc.';
    END IF;
END $$;

-- installments: Número total de cuotas (1 = pago único)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'installments'
    ) THEN
        ALTER TABLE expenses ADD COLUMN installments INTEGER DEFAULT 1 CHECK (installments >= 1);
        COMMENT ON COLUMN expenses.installments IS 'Número total de cuotas (1 = pago único, >1 = pago en cuotas)';
    END IF;
END $$;

-- installment_number: Número de cuota actual (1-N)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'installment_number'
    ) THEN
        ALTER TABLE expenses ADD COLUMN installment_number INTEGER DEFAULT 1 CHECK (installment_number >= 1);
        COMMENT ON COLUMN expenses.installment_number IS 'Número de esta cuota (1, 2, 3, etc.). Para gastos sin cuotas = 1';
    END IF;
END $$;

-- parent_expense_id: Referencia al gasto padre (para cuotas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'parent_expense_id'
    ) THEN
        ALTER TABLE expenses ADD COLUMN parent_expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE;
        COMMENT ON COLUMN expenses.parent_expense_id IS 'ID del gasto padre. NULL = gasto padre o sin cuotas. NOT NULL = cuota hija';
    END IF;
END $$;

-- total_amount: Monto total (solo para gasto padre)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE expenses ADD COLUMN total_amount NUMERIC;
        COMMENT ON COLUMN expenses.total_amount IS 'Monto total del gasto (solo para gastos padre con cuotas). NULL = gasto normal';
    END IF;
END $$;

-- is_parent: Flag para identificar gastos padres rápidamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'is_parent'
    ) THEN
        ALTER TABLE expenses ADD COLUMN is_parent BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN expenses.is_parent IS 'TRUE si este gasto tiene cuotas hijas. Optimización para queries';
    END IF;
END $$;

-- payment_status: Estado del pago
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE expenses ADD COLUMN payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'cancelled'));
        COMMENT ON COLUMN expenses.payment_status IS 'Estado: pending (no pagado), paid (pagado), cancelled (cancelado)';
    END IF;
END $$;

-- 2. Crear índices para mejorar performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_parent_expense_id ON expenses(parent_expense_id);
CREATE INDEX IF NOT EXISTS idx_expenses_is_parent ON expenses(is_parent) WHERE is_parent = TRUE;
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status) WHERE payment_status != 'paid';
CREATE INDEX IF NOT EXISTS idx_expenses_credit_card_installments ON expenses(credit_card_id, installment_number) WHERE payment_method = 'credit_card';

-- Índice compuesto para consultas del resumen mensual de tarjeta
CREATE INDEX IF NOT EXISTS idx_expenses_card_date ON expenses(credit_card_id, date) WHERE payment_method = 'credit_card';

-- 3. Actualizar registros existentes
-- ==========================================

-- Marcar gastos existentes como método 'cash' por defecto
UPDATE expenses
SET payment_method = 'cash'
WHERE payment_method IS NULL;

-- Marcar pagos de resumen de tarjeta con método 'credit_card'
UPDATE expenses
SET payment_method = 'credit_card'
WHERE is_credit_card_payment = TRUE;

-- 4. Agregar constraints para validar consistencia
-- ==========================================

-- Un gasto no puede ser padre y cuota al mismo tiempo
ALTER TABLE expenses
ADD CONSTRAINT chk_parent_or_child
CHECK (
    (parent_expense_id IS NULL) OR
    (parent_expense_id IS NOT NULL AND is_parent = FALSE)
);

-- Si es padre, debe tener total_amount
ALTER TABLE expenses
ADD CONSTRAINT chk_parent_has_total
CHECK (
    (is_parent = FALSE) OR
    (is_parent = TRUE AND total_amount IS NOT NULL AND total_amount > 0)
);

-- installment_number no puede ser mayor que installments
ALTER TABLE expenses
ADD CONSTRAINT chk_installment_number_valid
CHECK (installment_number <= installments);

-- 5. Deprecar campos antiguos
-- ==========================================

-- NOTA: Mantenemos is_credit_card_payment por compatibilidad, pero ya no se usa
-- Se puede eliminar en una migración futura después de verificar que todo funciona

COMMENT ON COLUMN expenses.is_credit_card_payment IS 'DEPRECADO: Usar payment_method en su lugar. Se mantiene por compatibilidad';

-- ==========================================
-- FIN DE LA MIGRACIÓN
-- ==========================================

-- Para verificar que la migración se ejecutó correctamente:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'expenses'
-- ORDER BY ordinal_position;
