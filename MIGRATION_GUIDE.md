# Guía de Migración: Sistema Unificado de Gastos

## Resumen

Esta migración unifica el manejo de gastos en una sola tabla `expenses`, permitiendo soportar cualquier método de pago (efectivo, tarjeta de crédito, débito, criptomonedas, etc.) y gastos en cuotas de forma genérica.

## Cambios Principales

### 1. Nuevos Campos en la Tabla `expenses`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `payment_method` | TEXT | Método de pago: 'cash', 'credit_card', 'debit_card', etc. |
| `payment_status` | TEXT | Estado: 'pending', 'paid', 'cancelled' |
| `installments` | INTEGER | Número total de cuotas (1 = sin cuotas) |
| `installment_number` | INTEGER | Número de esta cuota (1, 2, 3...) |
| `parent_expense_id` | UUID | ID del gasto padre (para cuotas) |
| `total_amount` | NUMERIC | Monto total (solo para gasto padre) |
| `is_parent` | BOOLEAN | TRUE si tiene cuotas hijas |

### 2. Arquitectura de Gastos con Cuotas

**Gasto Padre (Metadata):**
- `amount = 0` (no aparece en el dashboard)
- `is_parent = TRUE`
- `total_amount = monto total del gasto`
- Tiene las categorías asociadas

**Gastos Hijos (Cuotas):**
- `amount = monto de la cuota`
- `parent_expense_id = ID del padre`
- `installment_number = 1, 2, 3...`
- Cada uno con su fecha de vencimiento

**Ejemplo:**
```
Compra de $30,000 en 3 cuotas

Padre:
- amount: 0
- total_amount: 30000
- is_parent: TRUE
- description: "TV Samsung"

Cuota 1:
- amount: 10000
- installment_number: 1
- parent_expense_id: [ID del padre]
- date: 2026-01-15
- description: "TV Samsung - Cuota 1/3"

Cuota 2:
- amount: 10000
- installment_number: 2
- parent_expense_id: [ID del padre]
- date: 2026-02-15
- description: "TV Samsung - Cuota 2/3"

Cuota 3:
- amount: 10000
- installment_number: 3
- parent_expense_id: [ID del padre]
- date: 2026-03-15
- description: "TV Samsung - Cuota 3/3"
```

## Gestión de Gastos Futuros

El sistema maneja automáticamente gastos futuros (cuotas pendientes) de la siguiente manera:

### Dashboard Principal
- **Muestra solo gastos actuales**: Usa `getCurrentExpenses()`
- Excluye automáticamente:
  - Gastos padre (metadata)
  - Gastos futuros con `paymentStatus = 'pending'`

### Sección "Próximos Pagos"
- **Muestra gastos futuros**: Usa `getUpcomingExpenses()`
- Ordena por fecha (más cercano primero)
- Permite visualizar compromisos futuros

### Flujo de Pago de Resumen

```typescript
// 1. Usuario crea compra en 6 cuotas
await addExpenseWithInstallments({
  amount: 30000,
  description: "TV Samsung",
  date: "2026-01-15",
  installments: 6,
  paymentMethod: "credit_card",
  creditCardId: "card-id"
});

// Se crean:
// - 1 gasto padre (metadata)
// - Cuota 1: $5000, fecha 15/01/2026, status: paid (ya pasó)
// - Cuota 2: $5000, fecha 15/02/2026, status: pending
// - Cuota 3-6: status: pending

// 2. Al pagar el resumen de febrero
await payCreditCardStatement("card-id", 1, 2026); // mes 1 = febrero

// Actualiza:
// - Cuota 2 → status: paid
// - Crea un gasto "Pago Resumen Visa 2/2026" de $5000
```

## Pasos de Implementación

### Paso 1: Ejecutar Migraciones SQL ✅

1. **Ejecutar `migrations/001_unified_expenses_system.sql`**
   - Agrega los nuevos campos a la tabla `expenses`
   - Crea índices para optimización
   - Agrega constraints de validación

2. **Ejecutar `migrations/002_migrate_credit_card_purchases.sql`**
   - Migra los datos existentes de `credit_card_purchases` a `expenses`
   - Crea un gasto padre + cuotas por cada purchase
   - Es idempotente (se puede ejecutar varias veces)

**Cómo ejecutar en Supabase:**
1. Ve a SQL Editor en el dashboard de Supabase
2. Copia y pega el contenido de cada archivo
3. Click en "RUN"
4. Verifica que no haya errores

### Paso 2: Actualizar el Código ✅

Los siguientes archivos ya fueron actualizados:

- ✅ `src/features/expenses/types.ts` - Tipos TypeScript actualizados
- ✅ `src/store/slices/expensesSlice.ts` - Nuevas funciones:
  - `addExpenseWithInstallments()` - Crear gastos con cuotas
  - `getExpenseInstallments()` - Obtener cuotas de un gasto
  - `getCreditCardMonthlyExpenses()` - Obtener gastos de tarjeta por mes
  - `payCreditCardStatement()` - Pagar resumen de tarjeta (marca cuotas como pagadas)
  - `getCurrentExpenses()` - Obtener solo gastos actuales (excluye futuros pendientes)
  - `getUpcomingExpenses()` - Obtener gastos futuros (próximos pagos)
  - `getSummary()` - Actualizado para excluir gastos futuros

### Paso 3: Refactorizar AddExpenseScreen (PENDIENTE)

El archivo `src/features/expenses/screens/AddExpenseScreen.tsx` necesita ser actualizado para:

1. **Remover la lógica específica de tarjeta de crédito:**
   ```typescript
   // ANTES
   if (paymentMethod === 'credit_card' && selectedCardId) {
     await addCreditCardPurchase({...});
   }

   // DESPUÉS
   if (installments > 1) {
     await addExpenseWithInstallments({...});
   } else {
     await addExpense({...});
   }
   ```

2. **Hacer el selector de método de pago genérico:**
   ```typescript
   // ANTES
   const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');

   // DESPUÉS
   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
   ```

3. **Agregar selector de cuotas (para cualquier método de pago):**
   ```typescript
   {paymentMethod !== 'cash' && (
     <View>
       <Text>Número de cuotas</Text>
       <TextInput
         value={installments}
         onChangeText={setInstallments}
         keyboardType="numeric"
       />
     </View>
   )}
   ```

### Paso 4: Actualizar CreditCardScreen (PENDIENTE)

El archivo `src/features/creditCards/screens/CreditCardScreen.tsx` necesita:

1. **Usar `getCreditCardMonthlyExpenses()` en lugar de la lógica actual:**
   ```typescript
   // ANTES
   const summary = getMonthlyConsumption(cardId, month, year);

   // DESPUÉS
   const monthlyExpenses = getCreditCardMonthlyExpenses(cardId, month, year);
   const totalAmount = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
   ```

2. **Mostrar las cuotas con el formato correcto:**
   ```typescript
   {monthlyExpenses.map(expense => (
     <View key={expense.id}>
       <Text>{expense.description}</Text>
       <Text>Cuota {expense.installmentNumber}/{expense.installments}</Text>
       <Text>${expense.amount}</Text>
     </View>
   ))}
   ```

### Paso 5: Actualizar Dashboard y Reportes (PENDIENTE)

Los componentes que muestran gastos deben usar las nuevas funciones helper:

#### 1. Dashboard Principal - Usar `getCurrentExpenses()`

```typescript
// En lugar de usar expenses directamente
const { expenses } = useStore();

// Usar la función helper
const { getCurrentExpenses } = useStore();
const visibleExpenses = getCurrentExpenses();

// Renderizar
{visibleExpenses.map(expense => (
  <ExpenseItem key={expense.id} expense={expense} />
))}
```

#### 2. Sección "Próximos Pagos" - Usar `getUpcomingExpenses()`

```typescript
const { getUpcomingExpenses } = useStore();
const upcomingExpenses = getUpcomingExpenses();

// Agrupar por mes
const groupedByMonth = upcomingExpenses.reduce((acc, expense) => {
  const monthKey = format(new Date(expense.date), 'MMMM yyyy');
  if (!acc[monthKey]) acc[monthKey] = [];
  acc[monthKey].push(expense);
  return acc;
}, {});

// Renderizar
<View>
  <Text>Próximos Pagos</Text>
  {Object.entries(groupedByMonth).map(([month, expenses]) => (
    <View key={month}>
      <Text>{month}</Text>
      <Text>Total: ${expenses.reduce((sum, e) => sum + e.amount, 0)}</Text>
      {expenses.map(expense => (
        <View key={expense.id}>
          <Text>{expense.description}</Text>
          <Text>${expense.amount}</Text>
          {expense.installmentNumber && (
            <Text>Cuota {expense.installmentNumber}/{expense.installments}</Text>
          )}
        </View>
      ))}
    </View>
  ))}
</View>
```

#### 3. Pantalla de Tarjeta - Botón "Pagar Resumen"

```typescript
const { payCreditCardStatement, getCreditCardMonthlyExpenses } = useStore();
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

const monthlyExpenses = getCreditCardMonthlyExpenses(
  cardId,
  selectedMonth,
  selectedYear
);

const totalAmount = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

const handlePayStatement = async () => {
  await payCreditCardStatement(cardId, selectedMonth, selectedYear);
  Alert.alert('Éxito', 'Resumen pagado correctamente');
};

// UI
<View>
  <Text>Resumen de {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}</Text>
  <Text>Total a pagar: ${totalAmount}</Text>

  {monthlyExpenses.map(expense => (
    <View key={expense.id}>
      <Text>{expense.description}</Text>
      <Text>${expense.amount}</Text>
      <Text>Estado: {expense.paymentStatus === 'paid' ? '✓ Pagado' : '○ Pendiente'}</Text>
    </View>
  ))}

  <Button
    title={`Pagar Resumen ($${totalAmount})`}
    onPress={handlePayStatement}
    disabled={monthlyExpenses.length === 0}
  />
</View>
```

#### 4. Mostrar Indicador de Cuotas

```typescript
{expense.parentExpenseId && (
  <View style={styles.installmentBadge}>
    <Text>Cuota {expense.installmentNumber}/{expense.installments}</Text>
  </View>
)}

{expense.paymentStatus === 'pending' && (
  <View style={styles.pendingBadge}>
    <Text>Pendiente</Text>
  </View>
)}
```

### Paso 6: Deprecar Credit Card Purchases (FUTURO)

Una vez verificado que todo funciona:

1. Renombrar tablas antiguas:
   ```sql
   ALTER TABLE credit_card_purchases RENAME TO credit_card_purchases_backup;
   ALTER TABLE credit_card_purchase_categories RENAME TO credit_card_purchase_categories_backup;
   ```

2. Actualizar el schema en `docs/supabase-schema.md`

3. Remover código legacy:
   - `creditCardsSlice.ts` → remover métodos de purchases
   - Limpiar imports y referencias

## Beneficios del Nuevo Sistema

### Antes (Sistema Antiguo)
- ❌ Lógica duplicada entre `expenses` y `credit_card_purchases`
- ❌ No soporta cuotas para otros métodos de pago
- ❌ Difícil de extender a nuevos métodos de pago
- ❌ Reportes deben consultar múltiples tablas

### Después (Sistema Unificado)
- ✅ Una sola tabla para todos los gastos
- ✅ Cuotas genéricas (funciona con cualquier método de pago)
- ✅ Fácil de agregar nuevos métodos (débito, crypto, etc.)
- ✅ Reportes simples (una sola query)
- ✅ Auditoría completa (estado de pago por cuota)

## Testing

### Casos de Prueba

1. **Gasto simple (sin cuotas):**
   ```typescript
   await addExpense({
     amount: 5000,
     description: "Almuerzo",
     date: new Date().toISOString(),
     paymentMethod: "cash",
     categoryIds: ["food-category-id"]
   });
   ```

2. **Gasto con cuotas (tarjeta de crédito):**
   ```typescript
   await addExpenseWithInstallments({
     amount: 30000,
     description: "TV Samsung",
     date: new Date().toISOString(),
     paymentMethod: "credit_card",
     creditCardId: "card-id",
     installments: 6,
     categoryIds: ["electronics-category-id"]
   });

   // Verificar:
   // - 1 gasto padre (amount=0, is_parent=true, total_amount=30000)
   // - 6 cuotas (amount=5000 c/u, installment_number 1-6)
   ```

3. **Obtener resumen mensual de tarjeta:**
   ```typescript
   const expenses = getCreditCardMonthlyExpenses("card-id", 0, 2026); // Enero 2026
   // Debe retornar solo las cuotas que vencen en ese mes
   ```

4. **Dashboard no muestra gastos padre:**
   ```typescript
   const validExpenses = expenses.filter(e => !e.isParent);
   // Solo cuotas y gastos normales
   ```

## Rollback

Si algo sale mal, puedes revertir la migración:

```sql
-- Eliminar gastos migrados
DELETE FROM expenses WHERE is_parent = TRUE OR parent_expense_id IS NOT NULL;

-- Remover columnas nuevas (opcional)
ALTER TABLE expenses DROP COLUMN payment_method;
ALTER TABLE expenses DROP COLUMN payment_status;
ALTER TABLE expenses DROP COLUMN installments;
ALTER TABLE expenses DROP COLUMN installment_number;
ALTER TABLE expenses DROP COLUMN parent_expense_id;
ALTER TABLE expenses DROP COLUMN total_amount;
ALTER TABLE expenses DROP COLUMN is_parent;
```

## Próximos Pasos

1. ✅ Ejecutar migraciones SQL
2. ⏳ Refactorizar `AddExpenseScreen`
3. ⏳ Actualizar `CreditCardScreen`
4. ⏳ Actualizar componentes de Dashboard
5. ⏳ Testing exhaustivo
6. ⏳ Deprecar `credit_card_purchases`

## Soporte

Si tienes dudas o encuentras problemas:
- Revisar los comentarios en el código
- Verificar los constraints en la base de datos
- Usar las funciones helper del slice (`getExpenseInstallments`, etc.)
