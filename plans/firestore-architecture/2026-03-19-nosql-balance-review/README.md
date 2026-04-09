# Firestore NoSQL Balance Review

Fecha: 2026-03-19
Base: `C:\Dev\VentaMas`

## Objetivo
Revisar la estructura actual de Firestore con un criterio practico:

- preservar lo que ya esta bien alineado con un modelo documental multi-tenant,
- separar duplicacion util de duplicacion peligrosa,
- detectar donde el repo esta simulando joins o normalizacion estilo SQL,
- dejar un paquete accionable para revisar y mejorar despues.

## Documentos
- `01-auditoria-actual.md`: diagnostico del estado actual con foco en autoridad de datos, consultas, espejos y anti-patrones.
- `02-checklist-firestore-nosql.md`: checklist corto para nuevas features y refactors sobre Firestore.
- `03-plan-de-mejora.md`: roadmap por fases para corregir el modelo sin romper el sistema.

## Idea central
El problema principal no es que exista duplicacion. En Firestore la duplicacion puede ser correcta.

El problema actual es que parte de esa duplicacion:

- no tiene una fuente primaria explicita,
- no tiene ownership de escritura claramente delimitado,
- no siempre se puede regenerar,
- y obliga al frontend a reconstruir relaciones con joins manuales o listeners en fan-out.

## Resultado esperado
Usar Firestore mas como base documental orientada a consultas por pantalla y menos como un modelo relacional distribuido.
