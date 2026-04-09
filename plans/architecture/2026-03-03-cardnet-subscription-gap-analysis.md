# CardNET para suscripciones: analisis de brecha

Fecha: 2026-03-03

## Resumen ejecutivo

La informacion publica de CardNET QA si alcanza para avanzar en el flujo actual de pago de suscripciones, pero no para declarar "suscripciones completas" de punta a punta.

Lo que si permite cerrar:

- checkout hosted/manual para un pago puntual de upgrade o renovacion manual
- pruebas en sandbox sin comercio de produccion propio

Lo que todavia no deja cerrado por si solo:

- renovacion automatica mensual real
- portal de gestion de tarjetas
- cobro recurrente con tarjeta guardada
- produccion sin afiliacion/certificacion

## Datos QA confirmados

Segun la documentacion publica oficial de CardNET QA:

- Base URL QA: `https://labservicios.cardnet.com.do/api/payment`
- Merchant QA: `349041263`
- TerminalId QA: `77777777`
- CurrencyCode QA: `214`

Y para flujo hosted con pantalla:

1. El backend crea una sesion `POST /sessions`
2. CardNET responde con:
   - `SESSION`
   - `session-key`
   - expiracion
3. El frontend envia un formulario POST a:
   - `https://labservicios.cardnet.com.do/api/payment/authorize`
4. Despues del pago, el comercio debe consultar el resultado con `SESSION + session-key`

## Encaje con la arquitectura actual

La arquitectura de billing actual ya tiene piezas que encajan bien con CardNET:

- adaptadores por proveedor:
  - `functions/src/app/versions/v2/billing/services/providerAdapter.service.js`
- checkout session pendiente:
  - `functions/src/app/versions/v2/billing/controllers/billingManagement.controller.js`
- proxy publico de checkout:
  - `src/modules/checkout/pages/AzulCheckoutRedirect/AzulCheckoutRedirect.tsx`

Pero hoy CardNET no esta implementado:

- `providerAdapter.service.js` tiene `['cardnet', null]`
- el proxy `/checkout` solo sabe enviar a Azul
- solo existe webhook/retorno implementado para Azul

## Conclusion tecnica

### Si alcanza para cerrar en sandbox

Si, pero solo este caso:

- usuario abre checkout
- se crea sesion CardNET QA
- se redirige al authorize hosted form
- se verifica el resultado al volver
- se registra `paymentHistory`
- se activa la suscripcion

Eso cerraria el flujo actual de pago puntual de suscripcion.

### No alcanza para suscripcion completa real

No, porque todavia faltan piezas de negocio y seguridad:

1. Tokenizacion / Card On File
   - necesaria para cobros recurrentes reales sin que el usuario repita checkout
2. Credenciales de produccion
   - merchant/terminal/llaves propias
3. Certificacion CardNET
4. Portal de metodo de pago
   - el UI actual asume que existe gestion externa del metodo
5. Reintentos automaticos / dunning conectado al proveedor

## Brecha exacta en el codigo actual

### Falta 1: adapter CardNET

Se necesita:

- `functions/src/app/versions/v2/billing/adapters/cardnet.provider.js`

Responsabilidad:

- crear sesion CardNET
- devolver URL interna `/checkout?...`
- incluir metadata suficiente para persistir `checkoutSessions`

### Falta 2: checkout proxy multigateway

Archivo actual:

- `src/modules/checkout/pages/AzulCheckoutRedirect/AzulCheckoutRedirect.tsx`

Brecha:

- hoy solo soporta `provider === 'azul'`
- para CardNET debe poder hacer POST a `/authorize` con `SESSION`

### Falta 3: verificacion de retorno

Hoy existe solo:

- `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js`

Brecha:

- CardNET no puede reutilizar tal cual el flujo de Azul
- hace falta un endpoint o callable para consultar el resultado de la sesion usando `session-key`

### Falta 4: activacion de suscripcion tras verificacion

Ya existe la logica final:

- escribir `paymentHistory`
- `assignSubscriptionToBillingAccount(...)`

Pero falta conectarla al retorno/verificacion CardNET.

## Recomendacion por fases

### Fase A: CardNET hosted checkout manual

Objetivo:

- cerrar el flujo actual de pago puntual

Entregables:

- adapter CardNET QA
- proxy `/checkout` con soporte CardNET
- retorno/verificacion de sesion
- `paymentHistory` + activacion de suscripcion

### Fase B: CardNET tokenizacion

Objetivo:

- guardar metodo de pago y soportar cobro recurrente

Entregables:

- captura/tokenizacion segura
- storage seguro de token
- renovacion automatica
- retry/dunning por provider

## Decision recomendada

No habilitar `cardnet` como provider visible hasta completar Fase A.

Motivo:

- con solo merchant/terminal QA podriamos abrir checkout
- pero sin verificacion de retorno no queda garantizada la activacion de suscripcion

## Respuesta corta a la pregunta original

Con lo que encontraste, si podemos probablemente terminar el pago puntual/manual en sandbox.

Con eso solo, no terminamos todavia el proceso completo de suscripcion.

Lo que faltaria es:

1. retorno/verificacion CardNET
2. activacion automatica tras pago
3. para renovacion real: tokenizacion/Card On File
4. para produccion: afiliacion y certificacion

