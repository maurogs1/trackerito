# Trackerito - Contexto para Claude

## Qué es
App de finanzas personales para trackear gastos, ingresos, tarjetas de crédito, servicios recurrentes y deudas.

## Stack
- **React Native + Expo** (TypeScript)
- **Supabase** (PostgreSQL + Auth)
- **Zustand** (estado global con persistencia)
- **React Navigation** (navegación)

## Estructura
```
src/
├── features/           # Módulos de la app
│   ├── auth/           # Login, registro
│   ├── dashboard/      # Pantalla principal
│   ├── expenses/       # Gastos
│   ├── creditCards/    # Tarjetas de crédito
│   ├── services/       # Servicios recurrentes (Netflix, Spotify...)
│   ├── debts/          # Deudas
│   └── settings/       # Configuración
├── store/
│   ├── index.ts        # Store Zustand
│   └── slices/         # Un slice por módulo (expensesSlice, categoriesSlice, etc.)
├── components/         # Componentes compartidos
├── navigation/         # Configuración de rutas
├── theme/              # Colores light/dark
└── lib/supabase.ts     # Cliente Supabase
```

## Funcionalidades Principales

### Gastos
- CRUD de gastos
- Múltiples categorías por gasto
- Clasificación financiera: necesidad, deseo, ahorro
- Métodos de pago: efectivo, débito, crédito, transferencia
- **Sistema de cuotas**: Un gasto puede tener N cuotas mensuales (ej: compra en 12 cuotas)

### Categorías
- Personalizables con icono y color
- Se asocian a gastos (many-to-many)

### Tarjetas de Crédito
- Fecha de corte y fecha de pago
- Asociar gastos a tarjetas

### Servicios Recurrentes
- Pagos mensuales automáticos (Netflix, gym, etc.)

### Deudas
- Trackeo de deudas con montos y fechas

## Base de Datos (Supabase)
Tablas principales:
- `expenses` - Gastos
- `categories` - Categorías
- `expense_categories` - Relación gastos-categorías
- `credit_cards` - Tarjetas
- `services` - Servicios recurrentes
- `debts` - Deudas

**Nota**: La BD usa `snake_case`, TypeScript usa `camelCase`.

## Tema
- Soporta light/dark mode
- Color primario: `#6B4EFF` (morado)
- Colores financieros: verde (necesidad), naranja (deseo), azul (ahorro)
