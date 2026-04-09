# Plan Backlog - Robust Access Model (Owner por negocio + permisos por modulo)

Fecha: 2026-02-16  
Estado: backlog (no iniciar sin aprobacion explicita del usuario)

## Nota de gate (obligatoria)

Antes de iniciar cualquier implementacion, confirmar con el usuario:

- "Deseas implementar ahora el plan `2026-02-16-backlog-robust-access-model`?"

Si la respuesta es "no", mantener este plan en backlog sin ejecutar cambios de codigo ni despliegues.

## Objetivo

Separar responsabilidades sin mezclar conceptos:

- `owner` como propiedad del negocio (`businesses/{businessId}.ownerUid`).
- roles operativos por membresia (`admin/manager/cashier`).
- `dev` como privilegio global de plataforma (no como owner del negocio).

Y evolucionar de RBAC basico a permisos por modulo con rollout gradual.

## Alcance propuesto

1. Modelo de datos:
   - Agregar `ownerUid` en `businesses/{businessId}`.
   - Mantener membresias por negocio en `businesses/{businessId}/members/{uid}`.
   - Definir permisos por modulo (`permissions.*`) para backend.
2. Compatibilidad:
   - Mantener fallback temporal mientras se migra.
   - Ejecutar dual-check (modelo actual + nuevo) en modo sombra.
3. Seguridad:
   - Endurecer autorizacion en backend y reglas por fases.
   - Evitar bypass permanente en produccion.
4. Rollout:
   - Feature flags por negocio.
   - Canary y rollback inmediato.

## Fuera de alcance en esta etapa

- Reescritura completa de todos los modulos en una sola iteracion.
- Eliminacion inmediata de todos los campos legacy sin ventana de observacion.

## Fases (cuando se apruebe)

### Fase 0 - Decision y baseline (sin impacto)

- Confirmar si se implementa ahora o se mantiene backlog.
- Congelar baseline de metricas y errores actuales.
- Definir negocio(s) piloto para canary.

### Fase 1 - Estructura nueva sin romper flujo actual

- Crear `ownerUid` y backfill inicial.
- Incorporar permisos por modulo en backend (modo no bloqueante).
- Mantener compatibilidad con modelo actual.

### Fase 2 - Validacion en modo sombra

- Comparar decisiones de autorizacion actual vs nuevo modelo.
- Registrar divergencias y corregir antes de enforcement.
- Validar en entorno real controlado (sin emulador).

### Fase 3 - Enforcement gradual

- Activar por feature flag en negocio piloto.
- Escalar gradualmente por lotes de negocios.
- Monitorear `permission-denied`, errores de login y flujos criticos.

### Fase 4 - Cleanup final

- Retirar fallback legacy restante.
- Consolidar permisos por modulo como fuente de verdad.
- Cerrar documentacion operativa y runbook.

## Riesgos y mitigaciones

- Riesgo: denegaciones inesperadas en produccion.
  - Mitigacion: modo sombra + canary + rollback por flag.
- Riesgo: desalineacion entre reglas y backend.
  - Mitigacion: matriz unica de permisos y pruebas de contrato.
- Riesgo: impacto invisible en cuentas legacy.
  - Mitigacion: backfill y monitoreo antes de activar enforcement.

## Estimacion de esfuerzo

- Version base (sin enforcement total): 6 a 10 horas.
- Implementacion completa con rollout y cleanup: 20 a 44 horas.

## Criterios de inicio

- Aprobacion explicita del usuario para sacar este plan de backlog.
- Ventana de despliegue acordada.
- Definicion de negocio piloto.

## Criterios de cierre

- Operacion estable con permisos por modulo activos.
- Sin picos anormales de `permission-denied`.
- Backlog legacy reducido y documentado.
