# Supabase Database Schema

Este documento detalla las tablas necesarias en Supabase para que la aplicación funcione en modo real (no demostración).

> [!IMPORTANT]
> Todos los campos `id` usan **UUID con generación automática** usando `gen_random_uuid()`. Esto es más seguro y elimina la necesidad de generar IDs en el cliente.

## Tablas Requeridas

### 1. `expenses` - Gastos
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  financial_type TEXT DEFAULT 'unclassified'
);

-- Index para búsquedas rápidas
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
```

### 2. `goals` - Metas Financieras
```sql
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
CREATE INDEX idx_goals_deadline ON goals(deadline);
```

### 3. `categories` - Categorías de Gastos
```sql
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
```

### 4. `budgets` - Presupuestos
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category_id UUID NOT NULL,
  limit_amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);
```

### 5. `investments` - Inversiones
```sql
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
CREATE INDEX idx_investments_date ON investments(date DESC);
```

## Row Level Security (RLS)

Para proteger los datos de los usuarios, habilita RLS en todas las tablas:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Políticas para expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Repetir políticas similares para goals, categories, budgets, e investments
-- (Reemplazar 'expenses' con el nombre de cada tabla)
```

## Notas Importantes

1. **Categorías por defecto**: Al crear un usuario nuevo, considera insertar las categorías por defecto automáticamente usando un trigger o función de Supabase.

2. **Campo `user_id`**: Todos los registros deben estar asociados al usuario autenticado mediante `auth.uid()`.

3. **Tipos de datos**: 
   - Usa `TEXT` para IDs ya que la app genera IDs aleatorios con `Math.random().toString(36)`
   - Usa `NUMERIC` para cantidades monetarias para evitar problemas de precisión
   - Usa `TIMESTAMP WITH TIME ZONE` para fechas

4. **Migración de datos mock**: Si un usuario activa el modo demostración y luego lo desactiva, los datos mock no se migran automáticamente a Supabase. El usuario verá datos vacíos hasta que agregue nuevos datos reales.

## Verificación

Para verificar que las tablas están correctamente creadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('expenses', 'goals', 'categories', 'budgets', 'investments');
```

Debería retornar las 5 tablas.
