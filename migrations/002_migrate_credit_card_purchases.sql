-- ==========================================
-- MIGRACIÓN DE DATOS: Credit Card Purchases → Expenses
-- ==========================================
-- Fecha: 2026-01-17
-- Descripción: Migra los datos de credit_card_purchases a la tabla expenses unificada
--
-- IMPORTANTE:
-- 1. Ejecutar DESPUÉS de 001_unified_expenses_system.sql
-- 2. Este script es IDEMPOTENTE (se puede ejecutar varias veces)
-- 3. NO elimina la tabla credit_card_purchases (hazlo manualmente después de verificar)
-- 4. Crea un gasto PADRE por cada purchase + N gastos HIJO (cuotas)
-- ==========================================

DO $$
DECLARE
    purchase_record RECORD;
    parent_expense_id UUID;
    installment_date DATE;
    installment_amount NUMERIC;
    i INTEGER;
BEGIN
    -- Iterar sobre cada purchase en credit_card_purchases
    FOR purchase_record IN
        SELECT
            ccp.id,
            ccp.user_id,
            ccp.credit_card_id,
            ccp.description,
            ccp.total_amount,
            ccp.installments,
            ccp.first_installment_date,
            ccp.created_at,
            -- Obtener las categorías asociadas
            ARRAY_AGG(ccpc.category_id) AS category_ids
        FROM credit_card_purchases ccp
        LEFT JOIN credit_card_purchase_categories ccpc ON ccp.id = ccpc.purchase_id
        GROUP BY ccp.id, ccp.user_id, ccp.credit_card_id, ccp.description,
                 ccp.total_amount, ccp.installments, ccp.first_installment_date, ccp.created_at
    LOOP
        -- Verificar si ya fue migrado (evitar duplicados)
        IF EXISTS (
            SELECT 1 FROM expenses
            WHERE description = purchase_record.description
              AND credit_card_id = purchase_record.credit_card_id
              AND total_amount = purchase_record.total_amount
              AND is_parent = TRUE
        ) THEN
            RAISE NOTICE 'Purchase % ya fue migrado, saltando...', purchase_record.id;
            CONTINUE;
        END IF;

        RAISE NOTICE 'Migrando purchase %: % (% cuotas)', purchase_record.id, purchase_record.description, purchase_record.installments;

        -- Calcular monto por cuota
        installment_amount := purchase_record.total_amount / purchase_record.installments;

        -- 1. Crear gasto PADRE (metadata, no aparece en el dashboard)
        INSERT INTO expenses (
            user_id,
            amount,
            description,
            date,
            created_at,
            payment_method,
            payment_status,
            installments,
            installment_number,
            total_amount,
            is_parent,
            credit_card_id
        ) VALUES (
            purchase_record.user_id,
            0, -- El padre tiene amount = 0 (es solo metadata)
            purchase_record.description,
            purchase_record.first_installment_date, -- Fecha de la primera cuota
            purchase_record.created_at,
            'credit_card',
            'paid', -- El padre se marca como pagado
            purchase_record.installments,
            1,
            purchase_record.total_amount,
            TRUE, -- is_parent
            purchase_record.credit_card_id
        ) RETURNING id INTO parent_expense_id;

        RAISE NOTICE 'Gasto padre creado con ID: %', parent_expense_id;

        -- 2. Asociar categorías al gasto padre
        IF purchase_record.category_ids IS NOT NULL AND array_length(purchase_record.category_ids, 1) > 0 THEN
            FOR i IN 1..array_length(purchase_record.category_ids, 1) LOOP
                IF purchase_record.category_ids[i] IS NOT NULL THEN
                    INSERT INTO expense_categories (expense_id, category_id)
                    VALUES (parent_expense_id, purchase_record.category_ids[i])
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;

        -- 3. Crear gastos HIJO (cuotas individuales)
        FOR i IN 1..purchase_record.installments LOOP
            -- Calcular fecha de cada cuota (sumar meses)
            installment_date := purchase_record.first_installment_date + INTERVAL '1 month' * (i - 1);

            INSERT INTO expenses (
                user_id,
                amount,
                description,
                date,
                created_at,
                payment_method,
                payment_status,
                installments,
                installment_number,
                parent_expense_id,
                is_parent,
                credit_card_id
            ) VALUES (
                purchase_record.user_id,
                installment_amount,
                purchase_record.description || ' - Cuota ' || i || '/' || purchase_record.installments,
                installment_date,
                purchase_record.created_at,
                'credit_card',
                CASE
                    -- Marcar como pagado solo si la fecha ya pasó
                    WHEN installment_date <= CURRENT_DATE THEN 'paid'
                    ELSE 'pending'
                END,
                purchase_record.installments,
                i,
                parent_expense_id,
                FALSE, -- is_parent
                purchase_record.credit_card_id
            );
        END LOOP;

        RAISE NOTICE 'Creadas % cuotas para el purchase %', purchase_record.installments, purchase_record.id;
    END LOOP;

    RAISE NOTICE 'Migración completada exitosamente!';
END $$;

-- Verificar la migración
SELECT
    'Total purchases' AS metric,
    COUNT(*) AS count
FROM credit_card_purchases
UNION ALL
SELECT
    'Gastos padre creados' AS metric,
    COUNT(*) AS count
FROM expenses
WHERE is_parent = TRUE
UNION ALL
SELECT
    'Cuotas creadas' AS metric,
    COUNT(*) AS count
FROM expenses
WHERE parent_expense_id IS NOT NULL;

-- ==========================================
-- ROLLBACK (si algo sale mal)
-- ==========================================
-- Para deshacer esta migración:
-- DELETE FROM expenses WHERE is_parent = TRUE OR parent_expense_id IS NOT NULL;

-- ==========================================
-- DEPRECAR credit_card_purchases (ejecutar después de verificar)
-- ==========================================
-- Una vez verificado que todo funciona correctamente:
-- 1. Renombrar la tabla a credit_card_purchases_backup
-- ALTER TABLE credit_card_purchases RENAME TO credit_card_purchases_backup;
-- ALTER TABLE credit_card_purchase_categories RENAME TO credit_card_purchase_categories_backup;
--
-- 2. O eliminarla directamente
-- DROP TABLE credit_card_purchase_categories;
-- DROP TABLE credit_card_purchases;
