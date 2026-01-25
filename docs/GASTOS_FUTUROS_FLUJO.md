# Flujo de Gastos Futuros - Guía Visual

## Escenario de Ejemplo

Usuario compra una TV en 6 cuotas de $5,000 c/u el 15 de enero de 2026.

---

## Paso 1: Crear Compra en Cuotas

```typescript
await addExpenseWithInstallments({
  amount: 30000,
  description: "TV Samsung",
  date: "2026-01-15", // Fecha de la primera cuota
  installments: 6,
  paymentMethod: "credit_card",
  creditCardId: "visa-id",
  categoryIds: ["electronics-id"]
});
```

**Resultado en la BD:**

```
expenses:
┌────────────┬─────────────────────┬─────────┬───────┬───────────┬────────┬──────────┐
│ id         │ description         │ amount  │ date  │ inst_num  │ status │ is_parent│
├────────────┼─────────────────────┼─────────┼───────┼───────────┼────────┼──────────┤
│ parent-1   │ TV Samsung          │ 0       │ 01/15 │ 1         │ paid   │ TRUE     │ ← Metadata
│ cuota-1    │ TV Samsung - 1/6    │ 5000    │ 01/15 │ 1         │ paid   │ FALSE    │ ✓ Ya pasó
│ cuota-2    │ TV Samsung - 2/6    │ 5000    │ 02/15 │ 2         │ pending│ FALSE    │
│ cuota-3    │ TV Samsung - 3/6    │ 5000    │ 03/15 │ 3         │ pending│ FALSE    │
│ cuota-4    │ TV Samsung - 4/6    │ 5000    │ 04/15 │ 4         │ pending│ FALSE    │
│ cuota-5    │ TV Samsung - 5/6    │ 5000    │ 05/15 │ 5         │ pending│ FALSE    │
│ cuota-6    │ TV Samsung - 6/6    │ 5000    │ 06/15 │ 6         │ pending│ FALSE    │
└────────────┴─────────────────────┴─────────┴───────┴───────────┴────────┴──────────┘
```

---

## Paso 2: Dashboard - 17 de Enero de 2026

### Vista "Gastos del Mes" (usa `getCurrentExpenses()`)

```typescript
const currentExpenses = getCurrentExpenses();
// Retorna: [cuota-1] (solo la cuota 1, porque ya pasó y está paid)
```

**UI:**
```
┌─────────────────────────────────────┐
│ Gastos de Enero 2026                │
├─────────────────────────────────────┤
│ 🛒 Compra semanal        $15,000    │
│ 📺 TV Samsung - 1/6       $5,000    │ ← Solo esta cuota
│ ☕ Café                   $2,500    │
├─────────────────────────────────────┤
│ Total: $22,500                      │
└─────────────────────────────────────┘
```

### Vista "Próximos Pagos" (usa `getUpcomingExpenses()`)

```typescript
const upcomingExpenses = getUpcomingExpenses();
// Retorna: [cuota-2, cuota-3, cuota-4, cuota-5, cuota-6]
```

**UI:**
```
┌─────────────────────────────────────┐
│ Próximos Pagos                      │
├─────────────────────────────────────┤
│ Febrero 2026                        │
│  📺 TV Samsung - 2/6    $5,000      │
│  🏋️ Gym                 $8,000      │
│  Total: $13,000                     │
│                                     │
│ Marzo 2026                          │
│  📺 TV Samsung - 3/6    $5,000      │
│  🏋️ Gym                 $8,000      │
│  Total: $13,000                     │
│                                     │
│ Abril 2026                          │
│  📺 TV Samsung - 4/6    $5,000      │
│  ...                                │
└─────────────────────────────────────┘
```

---

## Paso 3: Pagar Resumen de Febrero

Usuario va a la pantalla de su tarjeta Visa y selecciona "Pagar Resumen de Febrero".

```typescript
const monthlyExpenses = getCreditCardMonthlyExpenses("visa-id", 1, 2026); // mes 1 = feb
// Retorna: [cuota-2] (solo la cuota de febrero)

const totalAmount = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
// $5,000

await payCreditCardStatement("visa-id", 1, 2026);
```

**Qué hace `payCreditCardStatement()`:**

1. Actualiza `cuota-2` → `status = 'paid'`
2. Crea un nuevo gasto:
   ```
   {
     description: "Pago Resumen Visa 2/2026",
     amount: 5000,
     date: "2026-02-17" (hoy),
     paymentMethod: "cash",
     isCreditCardPayment: true
   }
   ```

**Resultado en BD:**

```
expenses:
┌────────────┬─────────────────────┬─────────┬───────┬───────────┬────────┐
│ id         │ description         │ amount  │ date  │ inst_num  │ status │
├────────────┼─────────────────────┼─────────┼───────┼───────────┼────────┤
│ parent-1   │ TV Samsung          │ 0       │ 01/15 │ 1         │ paid   │
│ cuota-1    │ TV Samsung - 1/6    │ 5000    │ 01/15 │ 1         │ paid   │
│ cuota-2    │ TV Samsung - 2/6    │ 5000    │ 02/15 │ 2         │ paid   │ ← Actualizado
│ cuota-3    │ TV Samsung - 3/6    │ 5000    │ 03/15 │ 3         │ pending│
│ cuota-4    │ TV Samsung - 4/6    │ 5000    │ 04/15 │ 4         │ pending│
│ cuota-5    │ TV Samsung - 5/6    │ 5000    │ 05/15 │ 5         │ pending│
│ cuota-6    │ TV Samsung - 6/6    │ 5000    │ 06/15 │ 6         │ pending│
│ payment-1  │ Pago Resumen Visa 2/│ 5000    │ 02/17 │ -         │ paid   │ ← Nuevo
└────────────┴─────────────────────┴─────────┴───────┴───────────┴────────┘
```

---

## Paso 4: Dashboard - 17 de Febrero de 2026

### Vista "Gastos del Mes"

```typescript
const currentExpenses = getCurrentExpenses();
// Retorna: [cuota-2, payment-1, otros gastos del mes]
```

**UI:**
```
┌─────────────────────────────────────┐
│ Gastos de Febrero 2026              │
├─────────────────────────────────────┤
│ 🛒 Compra semanal        $15,000    │
│ 📺 TV Samsung - 2/6       $5,000    │ ✓ Pagado
│ 💳 Pago Resumen Visa     -$5,000    │ ← El pago del resumen
│ ☕ Café                   $2,500    │
├─────────────────────────────────────┤
│ Total: $17,500                      │
└─────────────────────────────────────┘
```

**Nota:** El total real gastado es $17,500 porque:
- Cuota TV: +$5,000 (deuda de tarjeta)
- Pago resumen: -$5,000 (pago en efectivo)
- Otros: +$17,500
- **Neto: $17,500** (el pago del resumen "cancela" la cuota)

### Vista "Próximos Pagos"

```typescript
const upcomingExpenses = getUpcomingExpenses();
// Retorna: [cuota-3, cuota-4, cuota-5, cuota-6]
```

**UI:**
```
┌─────────────────────────────────────┐
│ Próximos Pagos                      │
├─────────────────────────────────────┤
│ Marzo 2026                          │
│  📺 TV Samsung - 3/6    $5,000      │ ← Ya no aparece cuota-2
│  Total: $5,000                      │
│                                     │
│ Abril 2026                          │
│  📺 TV Samsung - 4/6    $5,000      │
│  ...                                │
└─────────────────────────────────────┘
```

---

## Resumen de Ventajas

### ✅ Dashboard Limpio
- Solo muestra gastos que ya ocurrieron
- No contamina con cuotas futuras

### ✅ Visibilidad de Compromisos
- Sección "Próximos Pagos" muestra todo lo que viene
- Agrupa por mes para fácil visualización

### ✅ Pago Automático de Cuotas
- Al pagar el resumen, las cuotas se marcan como pagadas
- Se registra el pago del resumen como gasto

### ✅ Reportes Precisos
- `getSummary()` solo cuenta gastos reales (excluye futuros)
- No infla artificialmente los totales

### ✅ Auditoría Completa
- Cada cuota tiene su estado (pending/paid)
- Puedes ver cuántas cuotas faltan de una compra

---

## Casos de Uso Adicionales

### Cancelar una Compra en Cuotas

Si devuelves el producto:

```typescript
const installments = getExpenseInstallments(parentExpenseId);

// Cancelar todas las cuotas pendientes
for (const installment of installments) {
  if (installment.paymentStatus === 'pending') {
    await updateExpense(installment.id, {
      paymentStatus: 'cancelled'
    });
  }
}
```

Las cuotas canceladas no aparecerán en "Próximos Pagos".

### Ver Todas las Cuotas de una Compra

```typescript
const parent = expenses.find(e => e.id === parentExpenseId);
const installments = getExpenseInstallments(parentExpenseId);

console.log(`${parent.description} - ${parent.totalAmount}`);
installments.forEach(inst => {
  console.log(`Cuota ${inst.installmentNumber}: ${inst.amount} - ${inst.paymentStatus}`);
});

// Output:
// TV Samsung - 30000
// Cuota 1: 5000 - paid
// Cuota 2: 5000 - paid
// Cuota 3: 5000 - pending
// Cuota 4: 5000 - pending
// Cuota 5: 5000 - pending
// Cuota 6: 5000 - pending
```

### Calcular Deuda Total de Tarjeta

```typescript
const pendingInstallments = expenses.filter(e =>
  e.creditCardId === cardId &&
  e.paymentMethod === 'credit_card' &&
  e.paymentStatus === 'pending' &&
  !e.isParent
);

const totalDebt = pendingInstallments.reduce((sum, e) => sum + e.amount, 0);
console.log(`Deuda pendiente: $${totalDebt}`);
```
