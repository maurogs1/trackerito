-- Supabase Database Schema
-- Este documento detalla el esquema completo y actualizado de la base de datos en Supabase.
-- Todos los campos `id` usan UUID con generación automática (gen_random_uuid()).

-- ==========================================
-- 1. TABLAS BASE (Sin dependencias externas)
-- ==========================================

-- banks - Bancos
CREATE TABLE IF NOT EXISTS banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banks_user_id ON banks(user_id);

-- categories - Categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  usage_count INTEGER DEFAULT 0,
  financial_type TEXT DEFAULT 'unclassified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_usage ON categories(usage_count DESC);

-- ==========================================
-- 2. TABLAS CON DEPENDENCIAS (Nivel 1)
-- ==========================================

-- credit_cards - Tarjetas de Crédito
-- bank_id es OPCIONAL: permite tarjetas genéricas sin banco asociado
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  last_four_digits TEXT,
  closing_day INTEGER NOT NULL,
  due_day INTEGER NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_bank_id ON credit_cards(bank_id);

-- MIGRACIÓN: Hacer bank_id opcional si la tabla ya existe
DO $$
BEGIN
    -- Primero, cambiar la constraint de NOT NULL a NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_cards' AND column_name = 'bank_id' AND is_nullable = 'NO') THEN
        -- Cambiar ON DELETE CASCADE a ON DELETE SET NULL
        ALTER TABLE credit_cards DROP CONSTRAINT IF EXISTS credit_cards_bank_id_fkey;
        ALTER TABLE credit_cards ALTER COLUMN bank_id DROP NOT NULL;
        ALTER TABLE credit_cards ADD CONSTRAINT credit_cards_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL;
    END IF;
END $$;

-- budgets - Presupuestos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  limit_amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

-- goals - Metas Financieras
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- investments - Inversiones
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  currency TEXT DEFAULT 'ARS',
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);

-- debts - Deudas
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  current_installment INTEGER DEFAULT 1,
  total_installments INTEGER NOT NULL,
  installment_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_bank_id ON debts(bank_id);

-- debt_items - Items de Deudas (detalle)
CREATE TABLE IF NOT EXISTS debt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_debt_items_debt_id ON debt_items(debt_id);

-- expense_debts - Relación Gastos-Deudas
CREATE TABLE IF NOT EXISTS expense_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_id, debt_id)
);
CREATE INDEX IF NOT EXISTS idx_expense_debts_expense_id ON expense_debts(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_debts_debt_id ON expense_debts(debt_id);

-- recurring_services - Servicios Recurrentes (configuración)
CREATE TABLE IF NOT EXISTS recurring_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  estimated_amount NUMERIC NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recurring_services_user_id ON recurring_services(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_services_category_id ON recurring_services(category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_services_active ON recurring_services(is_active, user_id);

-- service_payments - Pagos de Servicios (histórico)
CREATE TABLE IF NOT EXISTS service_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES recurring_services(id) ON DELETE CASCADE NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, month, year)
);
CREATE INDEX IF NOT EXISTS idx_service_payments_service_id ON service_payments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_expense_id ON service_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_month_year ON service_payments(year, month);

-- other_payments - Pagos Recurrentes "Otros" (Alquiler, Seguros, etc.)
CREATE TABLE IF NOT EXISTS other_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  estimated_amount NUMERIC NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_other_payments_user_id ON other_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_other_payments_category_id ON other_payments(category_id);
CREATE INDEX IF NOT EXISTS idx_other_payments_active ON other_payments(is_active, user_id);

-- other_payment_records - Registro de Pagos "Otros" (histórico)
CREATE TABLE IF NOT EXISTS other_payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  other_payment_id UUID REFERENCES other_payments(id) ON DELETE CASCADE NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(other_payment_id, month, year)
);
CREATE INDEX IF NOT EXISTS idx_other_payment_records_payment_id ON other_payment_records(other_payment_id);
CREATE INDEX IF NOT EXISTS idx_other_payment_records_expense_id ON other_payment_records(expense_id);
CREATE INDEX IF NOT EXISTS idx_other_payment_records_month_year ON other_payment_records(year, month);

-- ==========================================
-- 3. TABLAS PRINCIPALES (Nivel 2)
-- ==========================================

-- expenses - Gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  financial_type TEXT DEFAULT 'unclassified',
  is_credit_card_payment BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Agregar credit_card_id después si no existe (para permitir que credit_cards se cree después)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_cards') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'credit_card_id') THEN
            ALTER TABLE expenses ADD COLUMN credit_card_id UUID REFERENCES credit_cards(id);
            CREATE INDEX IF NOT EXISTS idx_expenses_credit_card_id ON expenses(credit_card_id);
        END IF;
    END IF;
END $$;

-- MIGRACIÓN: Agregar columnas adicionales a 'expenses' si la tabla ya existe
DO $$
BEGIN
    -- Agregar relación con servicios recurrentes solo si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurring_services') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'service_id') THEN
            ALTER TABLE expenses ADD COLUMN service_id UUID;
            ALTER TABLE expenses ADD CONSTRAINT expenses_service_id_fkey FOREIGN KEY (service_id) REFERENCES recurring_services(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_expenses_service_id ON expenses(service_id);
        END IF;
    END IF;
END $$;

-- credit_card_purchases - Consumos con Tarjeta
CREATE TABLE IF NOT EXISTS credit_card_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installments INTEGER DEFAULT 1,
  first_installment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cc_purchases_user_id ON credit_card_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_purchases_card_id ON credit_card_purchases(credit_card_id);

-- MIGRACIÓN: Eliminar category_id si existe y crear tabla de relación
DO $$
BEGIN
    -- Eliminar columna category_id si existe (reemplazada por tabla de relación)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'credit_card_purchases' 
               AND column_name = 'category_id') THEN
        ALTER TABLE credit_card_purchases DROP COLUMN category_id;
    END IF;
END $$;

-- credit_card_purchase_categories - Relación Consumos-Categorías (múltiples)
CREATE TABLE IF NOT EXISTS credit_card_purchase_categories (
  purchase_id UUID REFERENCES credit_card_purchases(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (purchase_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_cc_purchase_categories_purchase_id ON credit_card_purchase_categories(purchase_id);
CREATE INDEX IF NOT EXISTS idx_cc_purchase_categories_category_id ON credit_card_purchase_categories(category_id);

-- expense_categories - Relación Gastos-Categorías
CREATE TABLE IF NOT EXISTS expense_categories (
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, category_id)
);

-- ==========================================
-- 4. SEGURIDAD (RLS)
-- ==========================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_purchase_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;

-- Políticas (Ejemplos genéricos, ajustar según necesidad)
-- Nota: Si las políticas ya existen, estos comandos darán error.
-- Se recomienda borrarlas antes o usar bloques DO para verificar existencia.

-- Credit Cards
DROP POLICY IF EXISTS "Users can view their own credit cards" ON credit_cards;
CREATE POLICY "Users can view their own credit cards" ON credit_cards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credit cards" ON credit_cards;
CREATE POLICY "Users can insert their own credit cards" ON credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credit cards" ON credit_cards;
CREATE POLICY "Users can update their own credit cards" ON credit_cards FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own credit cards" ON credit_cards;
CREATE POLICY "Users can delete their own credit cards" ON credit_cards FOR DELETE USING (auth.uid() = user_id);

-- Credit Card Purchases
DROP POLICY IF EXISTS "Users can view their own cc purchases" ON credit_card_purchases;
CREATE POLICY "Users can view their own cc purchases" ON credit_card_purchases FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cc purchases" ON credit_card_purchases;
CREATE POLICY "Users can insert their own cc purchases" ON credit_card_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cc purchases" ON credit_card_purchases;
CREATE POLICY "Users can update their own cc purchases" ON credit_card_purchases FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cc purchases" ON credit_card_purchases;
CREATE POLICY "Users can delete their own cc purchases" ON credit_card_purchases FOR DELETE USING (auth.uid() = user_id);

-- Banks
DROP POLICY IF EXISTS "Users can view their own banks" ON banks;
CREATE POLICY "Users can view their own banks" ON banks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own banks" ON banks;
CREATE POLICY "Users can insert their own banks" ON banks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own banks" ON banks;
CREATE POLICY "Users can update their own banks" ON banks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own banks" ON banks;
CREATE POLICY "Users can delete their own banks" ON banks FOR DELETE USING (auth.uid() = user_id);

-- Expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
CREATE POLICY "Users can view their own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
CREATE POLICY "Users can insert their own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
CREATE POLICY "Users can update their own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
CREATE POLICY "Users can delete their own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Categories
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Expense Categories
DROP POLICY IF EXISTS "Users can view their own expense_categories" ON expense_categories;
CREATE POLICY "Users can view their own expense_categories" ON expense_categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_categories.expense_id AND expenses.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own expense_categories" ON expense_categories;
CREATE POLICY "Users can insert their own expense_categories" ON expense_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_categories.expense_id AND expenses.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own expense_categories" ON expense_categories;
CREATE POLICY "Users can delete their own expense_categories" ON expense_categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_categories.expense_id AND expenses.user_id = auth.uid())
);

-- Credit Card Purchase Categories
DROP POLICY IF EXISTS "Users can view their own cc_purchase_categories" ON credit_card_purchase_categories;
CREATE POLICY "Users can view their own cc_purchase_categories" ON credit_card_purchase_categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM credit_card_purchases 
    WHERE credit_card_purchases.id = credit_card_purchase_categories.purchase_id 
    AND credit_card_purchases.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert their own cc_purchase_categories" ON credit_card_purchase_categories;
CREATE POLICY "Users can insert their own cc_purchase_categories" ON credit_card_purchase_categories 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM credit_card_purchases 
    WHERE credit_card_purchases.id = credit_card_purchase_categories.purchase_id 
    AND credit_card_purchases.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own cc_purchase_categories" ON credit_card_purchase_categories;
CREATE POLICY "Users can delete their own cc_purchase_categories" ON credit_card_purchase_categories 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM credit_card_purchases 
    WHERE credit_card_purchases.id = credit_card_purchase_categories.purchase_id 
    AND credit_card_purchases.user_id = auth.uid()
  )
);

-- Budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
CREATE POLICY "Users can view their own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
CREATE POLICY "Users can insert their own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Goals
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
CREATE POLICY "Users can view their own goals" ON goals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
CREATE POLICY "Users can insert their own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
CREATE POLICY "Users can update their own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Users can delete their own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Investments
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
CREATE POLICY "Users can view their own investments" ON investments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own investments" ON investments;
CREATE POLICY "Users can insert their own investments" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
CREATE POLICY "Users can update their own investments" ON investments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;
CREATE POLICY "Users can delete their own investments" ON investments FOR DELETE USING (auth.uid() = user_id);

-- Debts
DROP POLICY IF EXISTS "Users can view their own debts" ON debts;
CREATE POLICY "Users can view their own debts" ON debts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own debts" ON debts;
CREATE POLICY "Users can insert their own debts" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own debts" ON debts;
CREATE POLICY "Users can update their own debts" ON debts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own debts" ON debts;
CREATE POLICY "Users can delete their own debts" ON debts FOR DELETE USING (auth.uid() = user_id);

-- Debt Items
DROP POLICY IF EXISTS "Users can view their own debt_items" ON debt_items;
CREATE POLICY "Users can view their own debt_items" ON debt_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_items.debt_id AND debts.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own debt_items" ON debt_items;
CREATE POLICY "Users can insert their own debt_items" ON debt_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_items.debt_id AND debts.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own debt_items" ON debt_items;
CREATE POLICY "Users can update their own debt_items" ON debt_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_items.debt_id AND debts.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own debt_items" ON debt_items;
CREATE POLICY "Users can delete their own debt_items" ON debt_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM debts WHERE debts.id = debt_items.debt_id AND debts.user_id = auth.uid())
);

-- Expense Debts
DROP POLICY IF EXISTS "Users can view their own expense_debts" ON expense_debts;
CREATE POLICY "Users can view their own expense_debts" ON expense_debts FOR SELECT USING (
  EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_debts.expense_id AND expenses.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own expense_debts" ON expense_debts;
CREATE POLICY "Users can insert their own expense_debts" ON expense_debts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_debts.expense_id AND expenses.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own expense_debts" ON expense_debts;
CREATE POLICY "Users can delete their own expense_debts" ON expense_debts FOR DELETE USING (
  EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_debts.expense_id AND expenses.user_id = auth.uid())
);

-- Recurring Services
DROP POLICY IF EXISTS "Users can view their own recurring_services" ON recurring_services;
CREATE POLICY "Users can view their own recurring_services" ON recurring_services FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recurring_services" ON recurring_services;
CREATE POLICY "Users can insert their own recurring_services" ON recurring_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recurring_services" ON recurring_services;
CREATE POLICY "Users can update their own recurring_services" ON recurring_services FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recurring_services" ON recurring_services;
CREATE POLICY "Users can delete their own recurring_services" ON recurring_services FOR DELETE USING (auth.uid() = user_id);

-- Service Payments
DROP POLICY IF EXISTS "Users can view their own service_payments" ON service_payments;
CREATE POLICY "Users can view their own service_payments" ON service_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM recurring_services WHERE recurring_services.id = service_payments.service_id AND recurring_services.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own service_payments" ON service_payments;
CREATE POLICY "Users can insert their own service_payments" ON service_payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM recurring_services WHERE recurring_services.id = service_payments.service_id AND recurring_services.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own service_payments" ON service_payments;
CREATE POLICY "Users can update their own service_payments" ON service_payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM recurring_services WHERE recurring_services.id = service_payments.service_id AND recurring_services.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own service_payments" ON service_payments;
CREATE POLICY "Users can delete their own service_payments" ON service_payments FOR DELETE USING (
  EXISTS (SELECT 1 FROM recurring_services WHERE recurring_services.id = service_payments.service_id AND recurring_services.user_id = auth.uid())
);

-- Other Payments
DROP POLICY IF EXISTS "Users can view their own other_payments" ON other_payments;
CREATE POLICY "Users can view their own other_payments" ON other_payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own other_payments" ON other_payments;
CREATE POLICY "Users can insert their own other_payments" ON other_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own other_payments" ON other_payments;
CREATE POLICY "Users can update their own other_payments" ON other_payments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own other_payments" ON other_payments;
CREATE POLICY "Users can delete their own other_payments" ON other_payments FOR DELETE USING (auth.uid() = user_id);

-- Other Payment Records
DROP POLICY IF EXISTS "Users can view their own other_payment_records" ON other_payment_records;
CREATE POLICY "Users can view their own other_payment_records" ON other_payment_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM other_payments WHERE other_payments.id = other_payment_records.other_payment_id AND other_payments.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own other_payment_records" ON other_payment_records;
CREATE POLICY "Users can insert their own other_payment_records" ON other_payment_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM other_payments WHERE other_payments.id = other_payment_records.other_payment_id AND other_payments.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own other_payment_records" ON other_payment_records;
CREATE POLICY "Users can update their own other_payment_records" ON other_payment_records FOR UPDATE USING (
  EXISTS (SELECT 1 FROM other_payments WHERE other_payments.id = other_payment_records.other_payment_id AND other_payments.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own other_payment_records" ON other_payment_records;
CREATE POLICY "Users can delete their own other_payment_records" ON other_payment_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM other_payments WHERE other_payments.id = other_payment_records.other_payment_id AND other_payments.user_id = auth.uid())
);
