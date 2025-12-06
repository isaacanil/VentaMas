# Carpeta de análisis de problemas

Este directorio centraliza investigaciones manuales sobre incidencias. El objetivo es guardar en un solo lugar la evidencia, los supuestos técnicos revisados y los pasos siguientes para que cualquier miembro del equipo pueda retomar el caso sin perder contexto.

## ¿Cómo usarla?

1. Duplica el archivo `reference/template.md`, renómbralo con un slug descriptivo (por ejemplo, `limite-credito-no-actualiza.md`) y completa cada sección dentro del subdirectorio adecuado (`explanation/` por defecto).
2. Adjunta enlaces a capturas o describe los datos observados; evita guardar binarios pesados dentro del repositorio.
3. Actualiza la sección “Próximos pasos” con dueños y fechas estimadas para que el seguimiento sea claro.

## Convenciones sugeridas

- Cada documento debe comenzar con un título y un resumen de una sola línea.
- Incluye secciones para evidencia, impacto, pasos para reproducir, datos técnicos relevantes, hipótesis y acciones pendientes.
- Cuando el problema se resuelva, añade una sección de “Resultado” con la fecha y referencia al PR/commit o tarea asociada.
