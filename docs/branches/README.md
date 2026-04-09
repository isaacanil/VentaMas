# Seguimiento de ramas

Esta carpeta se usa para dejar contexto operativo por rama cuando una iniciativa se pausa, se retoma o se bifurca.

## Convencion

- Un archivo por rama activa o pausada.
- Nombre sugerido: `<branch-name>.md`
- Mantenerlo corto y operativo.

## Contenido recomendado

- objetivo de la rama
- rama base
- estado actual
- alcance
- riesgos
- decisiones tomadas
- siguientes pasos
- planes o documentos relacionados

## Politica de comentarios en codigo

No comentar por comentar.

Agregar comentarios solo cuando ayuden a evitar errores en zonas no obvias, por ejemplo:

- compatibilidad legacy
- snapshots de moneda o tasa historica
- reglas contables o fiscales
- idempotencia, outbox o compensaciones
- decisiones temporales de migracion

No agregar comentarios para describir codigo evidente o lineas triviales.

