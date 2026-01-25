DO $$
DECLARE
    target_user_id UUID := 'USER_ID_AQUI';  -- <-- Cambia esto
BEGIN
    DELETE FROM expense_categories 
    WHERE expense_id IN (SELECT id FROM expenses WHERE user_id = target_user_id);
    
    DELETE FROM credit_card_purchase_categories 
    WHERE purchase_id IN (SELECT id FROM credit_card_purchases WHERE user_id = target_user_id);

    DELETE FROM expenses WHERE user_id = target_user_id;

    -- 3. Eliminar compras de tarjetas de 
    DELETE FROM credit_card_purchases WHERE user_id = target_user_id;

    -- 4. Eliminar tarjetas de crédito
    DELETE FROM credit_cards WHERE user_id = target_user_id;

    -- 5. Eliminar categorías
    DELETE FROM categories WHERE user_id = target_user_id;

    -- 6. Eliminar metas
    DELETE FROM goals WHERE user_id = target_user_id;

    DELETE FROM budgets WHERE user_id = target_user_id;

    DELETE FROM investments WHERE user_id = target_user_id;

    DELETE FROM debts WHERE user_id = target_user_id;

    DELETE FROM banks WHERE user_id = target_user_id;

    DELETE FROM service_payments 
    WHERE service_id IN (SELECT id FROM recurring_services WHERE user_id = target_user_id);
    
    DELETE FROM recurring_services WHERE user_id = target_user_id;

    RAISE NOTICE 'Datos del usuario % eliminados correctamente', target_user_id;
END $$;