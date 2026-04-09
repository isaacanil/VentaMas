# Guía de nomenclatura y estructura para documentos

Esta guía define cómo nombrar y estructurar cualquier documento dentro de `docs/` o subcarpetas asociadas. El objetivo es que cada entrega funcional tenga un formato reconocible y fácil de rastrear desde el backlog hasta la implementación.

## Convenciones principales

### Ruta base

```
docs/<dominio>/<tipo>/<slug>.md
```

- **Dominio**: feature o módulo raíz (`authorization`, `inventory`, `barcode`, `pin-authorization`, `firebase`, etc.). Usa `kebab-case`.
- **Tipo**: categoría Divio del contenido. Se aceptan cuatro valores:

| Tipo          | Propósito                               | Pregunta que responde           |
| ------------- | --------------------------------------- | ------------------------------- |
| `tutorial`    | Aprender haciendo                       | “¿Cómo comienzo desde cero?”    |
| `how-to`      | Resolver una tarea concreta             | “¿Cómo logro X?”                |
| `reference`   | Consultar detalles técnicos / catálogos | “¿Cuál es la forma exacta de…?” |
| `explanation` | Entender decisiones o arquitectura      | “¿Por qué funciona así?”        |

- **Slug**: tema específico en `kebab-case` (`modules-configuration`, `purchase-completion-flow`). Evita repetir el tipo o dominio dentro del slug.

### Ejemplos

- `docs/authorization/reference/modules-configuration.md`
- `docs/barcode/how-to/generation-guide.md`
- `docs/inventory/explanation/purchase-completion-flow.md`
- `docs/pin-authorization/how-to/testing-guide.md`

### Excepciones

- Archivos `README.md` se permiten en la raíz de cada dominio para describir cómo usar esa carpeta.
- `pending/` mantiene el esquema `YYYY-MM-DD_<tema>.md`.
- Plantillas compartidas pueden conservar `TEMPLATE.md` o nombres equivalentes cuando sea necesario para tooling.

Cuando un tema abarque varios dominios, ubica el archivo en el dominio más crítico y, dentro del documento, enlaza a los secundarios.

## Estructura mínima por tipo

Cada archivo debe comenzar con un título `#` y puede incluir emojis si ayudan a identificarlo rápido. Después del título, respeta las siguientes secciones según el tipo:

### Tutorial (`docs/<dominio>/tutorial/`)

1. `## 📋 Contexto`
2. `## ✅ Prerrequisitos`
3. `## 🛠️ Paso a paso` (lista numerada; incluye screenshots/código en cada paso)
4. `## 🎯 Resultado esperado`
5. `## 🧰 Troubleshooting` (problemas comunes + solución)

### How-to (`docs/<dominio>/how-to/`)

1. `## ⚡ Resumen rápido`
2. `## Lista de verificación`
3. `## Procedimiento` (subsecciones para cada paso típico)
4. `## Verificación`
5. `## Referencias` (enlaces a docs relacionadas o endpoints)

### Reference (`docs/<dominio>/reference/`)

1. `## 📘 Descripción`
2. `## Campos / parámetros` (tablas o listas detalladas)
3. `## APIs / rutas` o `## Componentes` (según corresponda)
4. `## Versionado / compatibilidad`
5. `## Recursos relacionados`

### Explanation (`docs/<dominio>/explanation/`)

1. `## 📋 Contexto`
2. `## 🎯 Objetivos`
3. `## ⚙️ Diseño / Arquitectura`
4. `## 📈 Impacto / Trade-offs`
5. `## 🔜 Seguimiento / Próximos pasos`

> Si alguna sección no aplica, agrega `<!-- N/A -->` con una breve explicación del porqué, en lugar de omitirla. Así mantenemos la consistencia al navegar.

## Campos mínimos dentro del documento

1. **Título H1** descriptivo (puedes añadir emoji si ayuda a identificar rápido el tipo de doc).
2. **📋 Contexto / Descripción general**: qué se resolvió o cuál es el alcance.
3. **🎯 Objetivos o motivaciones**: bullets cortos.
4. **⚙️ Implementación / Cambios clave**: enlaces a archivos, flags o endpoints.
5. **📁 Artefactos relacionados**: colecciones, funciones, scripts o rutas de UI.
6. **✅ Validación / Estado actual**: cómo se probó o qué queda pendiente.
7. **🔜 Próximos pasos** (opcional): checklist de pendientes o follow-ups.

## Plantilla sugerida

```markdown
# <emoji> Título corto y accionable

## 📋 Contexto

Resumen de 2-4 oraciones sobre el problema y la motivación.

## 🎯 Objetivos

- ...
- ...

## ⚙️ Implementación

- **Archivo/Ruta:** breve descripción (por qué es relevante).
- **Configuración:** detalle de flags, colecciones o jobs.

## 📁 Dependencias

- Servicios/Función Cloud:
- Tablas/Colecciones:
- Scripts de soporte:

## ✅ Validación

- Caso 1 / Resultado
- Casos alternos

## 🔜 Próximos pasos

- [ ] Acción + responsable
```

Usa esta plantilla como base y ajusta las secciones para flujos específicos (por ejemplo, guides pueden incluir `## 🧪 Escenarios de prueba` o `## 📊 KPIs monitoreados`).

## Flujo para crear un nuevo documento

1. **Define el objetivo**: ¿es una nueva feature, incidente o mejora operativa?
2. **Elige la carpeta adecuada**:
   - Feature/guía funcional → `docs/<dominio>/<tipo>/`
   - Investigaciones operativas → `docs/problem-analysis/<tipo>/`
   - Tareas rápidas → `pending/`
3. **Crea el slug (`kebab-case`) y verifica que no exista un doc similar** (usa `rg --files docs | rg "<slug>"`).
4. **Completa la plantilla** llenando secciones en orden. Cada sección vacía debe incluir un comentario `<!-- TBD -->` solo si la información aún se está recopilando.
5. **Enlaza archivos y PRs relevantes** para evitar duplicar contexto.
6. **Pide revisión** en el PR etiquetando al owner del dominio antes de mergear.

## Ejemplos rápidos

- `docs/authorization/reference/modules-configuration.md`: describe los toggles del flujo de autorizaciones.
- `docs/barcode/reference/gs1-implementation.md`: detalla los parámetros GS1 implementados.
- `docs/problem-analysis/explanation/account-receivable-balance-avendys-lockhart.md`: investigación específica del dominio de cuentas por cobrar.
- `docs/documentation/reference/structure-guide.md` (este archivo): pauta transversal para todo el repositorio.
