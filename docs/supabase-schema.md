# Supabase Database Schema

Este documento detalla el esquema actual de la base de datos en Supabase, incluyendo todas las tablas y políticas de seguridad (RLS).

> [!IMPORTANT]
> Todos los campos `id` usan **UUID con generación automática** (`gen_random_uuid()`).

## Tablas

### 1. `expenses` - Gastos
Almacena los detalles de cada gasto.
\`\`\`sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  financial_type TEXT DEFAULT 'unclassified'
);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
\`\`\`

### 2. `categories` - Categorías
Categorías disponibles para clasificar gastos.
\`\`\`sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  usage_count INTEGER DEFAULT 0,
  financial_type TEXT DEFAULT 'unclassified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_usage ON categories(usage_count DESC);
\`\`\`

### 3. `expense_categories` - Relación Gastos-Categorías (N:M)
Tabla intermedia para permitir múltiples categorías por gasto.
\`\`\`sql
CREATE TABLE expense_categories (
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, category_id)
);
\`\`\`

### 4. `budgets` - Presupuestos
Límites de gasto por categoría.
\`\`\`sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  limit_amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);
\`\`\`

### 5. `goals` - Metas Financieras
Objetivos de ahorro.
\`\`\`sql
CREATE TABLE goals (
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

CREATE INDEX idx_goals_user_id ON goals(user_id);
\`\`\`

### 6. `investments` - Inversiones
Registro de inversiones.
\`\`\`sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'crypto', 'stock', etc.
  currency TEXT DEFAULT 'ARS',
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_investments_user_id ON investments(user_id);
\`\`\`

### 7. `debts` - Deudas
Registro de deudas y compras en cuotas.
\`\`\`sql
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  current_installment INTEGER DEFAULT 0,
  total_installments INTEGER NOT NULL,
  installment_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'paid', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_debts_user_id ON debts(user_id);
\`\`\`

### 8. `debt_items` - Ítems de Deuda
Sub-ítems dentro de una deuda (ej: heladera, lavarropas dentro de un mismo plan de cuotas).
\`\`\`sql
CREATE TABLE debt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_debt_items_debt_id ON debt_items(debt_id);
\`\`\`

### 9. `expense_debts` - Relación Gastos-Deudas
Vincula un pago (gasto) con una o más deudas.
\`\`\`sql
CREATE TABLE expense_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL, -- Monto del gasto asignado a esta deuda
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_expense_debts_expense_id ON expense_debts(expense_id);
CREATE INDEX idx_expense_debts_debt_id ON expense_debts(debt_id);
\`\`\`

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado para asegurar que los usuarios solo accedan a sus propios datos.

\`\`\`sql
-- Habilitar RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_debts ENABLE ROW LEVEL SECURITY;

-- Políticas Generales (Ejemplo para 'expenses')
-- Se aplican políticas similares para goals, budgets, investments, categories, debts, debt_items y expense_debts.
CREATE POLICY "Users can view their own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Políticas Específicas para 'expense_categories' (Tabla intermedia)
-- Verifica la propiedad a través de la tabla 'expenses'
CREATE POLICY "Users can view their own expense categories" ON expense_categories FOR SELECT
USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_categories.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can insert their own expense categories" ON expense_categories FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_categories.expense_id AND expenses.user_id = auth.uid()));

CREATE POLICY "Users can delete their own expense categories" ON expense_categories FOR DELETE
USING (EXISTS (SELECT 1 FROM expenses WHERE expenses.id = expense_categories.expense_id AND expenses.user_id = auth.uid()));
\`\`\`
