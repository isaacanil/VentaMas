# Planes y Limites (Tiered Pricing)

Fecha: 2026-02-14
Alcance: propuesta basada en modulos reales detectados en frontend (`src/router/routes/paths/*`) y backend (`functions/src/app/modules/*`).

## 1) Modulos auditados en la app

- Dashboard/Home
- Ventas (`/sales`), Facturas (`/bills`), Preventas (`/preorders`)
- Inventario (items, control, resumen, movimientos, almacenes, stock)
- Compras y Pedidos (orders, purchases, backorders)
- Contactos (clientes, proveedores)
- Gastos del negocio
- Cuadre de caja
- Cuentas por cobrar
- Notas de credito
- Utilidad (dashboard y comparativas)
- Analitica avanzada de ventas (panel de charts en facturas)
- Configuracion (usuarios, sesiones, actividad, negocio, inventario, fiscal)
- Autorizaciones con PIN
- Seguros (condicional para farmacias)
- Multi-business (create/switch business)
- Herramientas Dev (solo internas)

## 2) Tabla principal de planes

Supuesto operativo legacy: `1 sucursal/entorno = 1 businessId`.

Nota: ese supuesto describe el modelo actual auditado, pero deja de ser la referencia target si se adopta el plan `plans/architecture/2026-03-23-multi-sucursal-y-analitica-enterprise-plan.md`.

| Plan | Precio mensual (DOP) | Usuarios (`maxUsers`) | Productos (`maxProducts`) | Facturas/Ventas por mes (`maxMonthlyInvoices`) | Clientes (`maxClients`) | Proveedores (`maxSuppliers`) | Almacenes (`maxWarehouses`) | Cajas activas (`maxOpenCashRegisters`) | Sucursales/Negocios (`maxBusinesses`) | Historial de reportes (`reportLookbackDays`) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Demo | RD$0 (14 dias) | 1 | 150 | 100 | 200 | 30 | 1 | 1 | 1 | 30 |
| Basic | RD$790 | 2 | 1,200 | 800 | 2,000 | 250 | 2 | 2 | 1 | 180 |
| Plus | RD$1,500 | 8 | 10,000 | 15,000 | 20,000 | 3,000 | 8 | 5 | 2 | 730 |
| Pro | RD$2,990 | -1 | -1 | -1 | -1 | -1 | -1 | -1 | -1 | -1 |

`-1` = ilimitado (con fair-use tecnico para abuso extremo).

## 3) Matriz de acceso por modulo

| Modulo / Feature | Demo | Basic | Plus | Pro |
|---|---|---|---|---|
| Ventas POS + Facturas | Si | Si | Si | Si |
| Preventas (modo diferido) | No | Si | Si | Si |
| Inventario (items/control/movimientos) | Si (basico) | Si | Si | Si |
| Compras + Pedidos + Backorders | No | Si | Si | Si |
| Contactos (clientes/proveedores) | Si (basico) | Si | Si | Si |
| Gastos | Si (basico) | Si | Si | Si |
| Cuadre de caja | Si (1 caja) | Si | Si | Si |
| Cuentas por cobrar | No | Si | Si | Si |
| Notas de credito | No | Si (limite mensual) | Si | Si |
| Utilidad (reportes basicos) | Si | Si | Si | Si |
| Analitica avanzada de ventas | No | No | Si | Si |
| Configuracion fiscal (NCF/comprobantes) | Si (basico) | Si | Si | Si |
| Flujo de autorizaciones PIN | No | No | Si | Si |
| Usuarios y roles | 1 usuario fijo | Hasta 2 usuarios | Hasta 8 usuarios | Ilimitado |
| Logs de sesion/actividad de usuarios | No | No | Si | Si |
| Seguros (modulo farmacia) | No | No | Si | Si |
| Multi-negocio / Switch business | No | No | Si (hasta 2) | Si (ilimitado) |
| API Access | No | No | No | Si |
| IA Insights / reportes IA | No | No | Limitado | Si |
| Herramientas Dev internas | No | No | No | No |

Notas:
- `Herramientas Dev` no forman parte del producto comercial.
- `Plus` queda como el plan estandar equivalente al precio historico (RD$1,500).

## 4) Schema update recomendado (`subscription`)

Recomendacion: `plans/{planId}` como catalogo y snapshot de limites en cada negocio.

```json
{
  "subscription": {
    "planId": "plus",
    "planVersion": 2,
    "status": "active",
    "billingCycle": "monthly",
    "currency": "DOP",
    "priceMonthly": 1500,
    "periodStart": "<timestamp>",
    "periodEnd": "<timestamp>",
    "trialEndsAt": null,
    "limits": {
      "maxUsers": 8,
      "maxProducts": 10000,
      "maxMonthlyInvoices": 15000,
      "maxClients": 20000,
      "maxSuppliers": 3000,
      "maxWarehouses": 8,
      "maxOpenCashRegisters": 5,
      "maxBusinesses": 2,
      "reportLookbackDays": 730,
      "maxAiInsightsPerMonth": 30,
      "maxApiRequestsPerDay": 0,
      "maxStorageGb": 20
    },
    "features": {
      "advancedReports": true,
      "salesAnalyticsPanel": true,
      "accountsReceivable": true,
      "authorizationsPinFlow": true,
      "insuranceModule": true,
      "apiAccess": false,
      "aiInsights": true
    },
    "moduleAccess": {
      "sales": true,
      "preorders": true,
      "inventory": true,
      "orders": true,
      "purchases": true,
      "expenses": true,
      "cashReconciliation": true,
      "accountsReceivable": true,
      "creditNote": true,
      "utility": true,
      "authorizations": true,
      "taxReceipt": true,
      "insurance": true,
      "multiBusiness": true,
      "api": false,
      "ai": true
    },
    "usage": {
      "users": 5,
      "products": 2140,
      "monthlyInvoices": 1220,
      "clients": 1800,
      "suppliers": 210,
      "warehouses": 3,
      "openCashRegisters": 2,
      "businesses": 1,
      "aiInsightsThisMonth": 12,
      "apiRequestsToday": 0,
      "storageGb": 3.4
    }
  }
}
```

### 4.1 Catalogo recomendado

- `plans/demo`
- `plans/basic`
- `plans/plus`
- `plans/pro`
- `plans/legacy_1500_unlimited` (hidden, no venta nueva)

### 4.2 Donde medir uso (recomendado)

- `businesses/{businessId}/usage/current` (snapshot rapido)
- `businesses/{businessId}/usage/monthly/{YYYY-MM}` (contadores mensuales)
- `businesses/{businessId}/usage/daily/{YYYY-MM-DD}` (API/IA y alertas)

## 5) Estrategia para clientes actuales (RD$1,500 con acceso total)

Recomendacion: **crear plan grandfathered `legacy_1500_unlimited`**.

1. Mantener precio y beneficios actuales para cuentas activas antes de `<fecha-corte>`.
2. No vender ese plan a nuevos clientes.
3. Reservar capacidades nuevas para Pro (`apiAccess`, `aiInsights` amplia, multi-negocio ilimitado).
4. Ofrecer upgrade voluntario a Pro con incentivo temporal (ej: 20% por 6 meses).
5. Revisar costo real por cohorte en 6-12 meses antes de decidir sunset del legacy.

## 6) Regla de enforcement tecnico (resumen)

1. Validar limites en backend (Cloud Functions/middleware), no solo en UI.
2. Bloquear creacion cuando se supera cuota (ej: crear usuario, crear producto, emitir factura).
3. Permitir lectura historica aunque se exceda temporalmente; bloquear nuevas altas.
4. Exponer `remainingQuota` en API para mensajes UX claros.
