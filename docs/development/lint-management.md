# Sistema de Gestión de Errores de Linting

> Sistema completo para analizar y corregir errores de linting de forma organizada y eficiente.

## 📋 Tabla de Contenidos

- [Inicio Rápido](#-inicio-rápido)
- [Comandos Disponibles](#-comandos-disponibles)
- [Estructura de Archivos](#-estructura-de-archivos)
- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Guía de Corrección](#-guía-de-corrección)
- [Personalización](#-personalización)
- [Preguntas Frecuentes](#-preguntas-frecuentes)

---

## 🚀 Inicio Rápido

### Comando Principal (TODO EN UNO)
```bash
npm run lint:report
```

Este comando ejecuta automáticamente:
1. ✅ ESLint en todo el proyecto
2. ✅ Guarda reporte en `reports/lint-report.txt`
3. ✅ Crea división por tipo en `reports/by-type/` (PRINCIPAL)
4. ✅ Crea división secuencial en `reports/batches/` (REFERENCIA)

### Primer Uso
```bash
# 1. Generar reportes
npm run lint:report

# 2. Ver resumen
code reports/by-type/00-INDICE.txt

# 3. Empezar a corregir (ejemplo con warnings)
code reports/by-type/warnings/react-hooks-exhaustive-deps-parte-1-de-3.txt
```

---

## 📋 Comandos Disponibles

### Comandos de Reporte

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `npm run lint:report` | **Comando principal**: Genera reporte + ambas divisiones | ⭐ Recomendado |
| `npm run lint:report:quick` | Solo genera reporte sin dividir | Para CI/CD |
| `npm run lint:fix` | Auto-corrige lo que sea posible | Después de revisar |

### Comandos de División

| Comando | Descripción | Cuándo usar |
|---------|-------------|-------------|
| `npm run lint:by-type` | Divide por tipo (usa reporte existente) | Regenerar solo by-type |
| `npm run lint:batch` | Divide secuencialmente (usa reporte existente) | Regenerar solo batches |
| `npm run lint:split-all` | Crea ambas divisiones (usa reporte existente) | Regenerar todo |

### Comandos de Linting Estándar

| Comando | Descripción |
|---------|-------------|
| `npm run lint` | Ejecuta linter (muestra en consola) |
| `npm run lint:web` | Lint solo código web |
| `npm run lint:web:fix` | Auto-corrige código web |
| `npm run lint:functions` | Lint solo Firebase functions |

---

## 📁 Estructura de Archivos

```
reports/
├── lint-report.txt                    # 📄 Reporte completo de ESLint
│
├── by-type/                           # ⭐ DIVISIÓN PRINCIPAL (por tipo de regla)
│   ├── 00-INDICE.txt                  # 📊 Resumen general con estadísticas
│   │
│   ├── errors/                        # 🔴 Errores críticos (305 total)
│   │   ├── renders-parte-1-de-4.txt           # 50 errores
│   │   ├── renders-parte-2-de-4.txt           # 50 errores
│   │   ├── renders-parte-3-de-4.txt           # 50 errores
│   │   ├── renders-parte-4-de-4.txt           # 13 errores
│   │   ├── @typescript-eslint-no-empty-function.txt  # 35 errores
│   │   ├── react-hooks-rules-of-hooks.txt     # 28 errores
│   │   ├── render.txt                         # 26 errores
│   │   ├── preserved.txt                      # 14 errores
│   │   ├── import-no-unresolved.txt           # 9 errores
│   │   ├── no-undef.txt                       # 7 errores
│   │   ├── sin-regla.txt                      # 7 errores
│   │   ├── declared.txt                       # 6 errores
│   │   ├── expected.txt                       # 5 errores
│   │   ├── literal.txt                        # 3 errores
│   │   └── expression.txt                     # 2 errores
│   │
│   └── warnings/                      # ⚠️ Advertencias (288 total)
│       ├── react-hooks-exhaustive-deps-parte-1-de-3.txt  # 50 warnings
│       ├── react-hooks-exhaustive-deps-parte-2-de-3.txt  # 50 warnings
│       ├── react-hooks-exhaustive-deps-parte-3-de-3.txt  # 42 warnings
│       ├── sin-regla-parte-1-de-3.txt                    # 50 warnings
│       ├── sin-regla-parte-2-de-3.txt                    # 50 warnings
│       ├── sin-regla-parte-3-de-3.txt                    # 40 warnings
│       ├── react-refresh-only-export-components.txt      # 5 warnings
│       └── unused-imports-no-unused-vars.txt             # 1 warning
│
└── batches/                           # 📦 División secuencial (referencia)
    ├── 00-indice.txt                  # Índice de lotes
    ├── lote-001.txt                   # Problemas 1-50
    ├── lote-002.txt                   # Problemas 51-100
    ├── lote-003.txt                   # Problemas 101-150
    ├── ...
    └── lote-012.txt                   # Problemas 551-593
```

### Formato de Archivos

Cada archivo de error contiene:
- **Encabezado**: Regla, severidad, total de problemas
- **Por archivo**: Problemas agrupados por archivo fuente
- **Detalles**: Línea, columna, mensaje, contexto
- **Estadísticas**: Archivos más afectados

---

## 🎯 Flujo de Trabajo

### Workflow Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GENERAR REPORTE                                          │
│    npm run lint:report                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REVISAR ÍNDICE                                           │
│    code reports/by-type/00-INDICE.txt                       │
│    • Ver total de errores vs warnings                       │
│    • Identificar reglas más frecuentes                      │
│    • Decidir estrategia                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ELEGIR ESTRATEGIA                                        │
│    ┌─────────────────┐        ┌─────────────────┐          │
│    │ Opción A:       │        │ Opción B:       │          │
│    │ Warnings        │   ó    │ Errors          │          │
│    │ (más fácil)     │        │ (más crítico)   │          │
│    └─────────────────┘        └─────────────────┘          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CORREGIR POR LOTES                                       │
│    • Abrir archivo de regla específica                      │
│    • Corregir 10-20 casos                                   │
│    • Hacer commit                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. AUTO-CORRECCIÓN                                          │
│    npm run lint:fix                                         │
│    • Corrige ~30-40% automáticamente                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. REGENERAR REPORTE                                        │
│    npm run lint:report                                      │
│    • Ver progreso                                           │
│    • Archivos se actualizan con problemas restantes         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. REPETIR HASTA COMPLETAR                                  │
│    ¿Quedan errores? → Volver al paso 2                      │
│    ✅ Código limpio!                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 Guía de Corrección

### Estrategia A: Empezar con Warnings (Recomendado)

Los warnings son menos críticos y más fáciles de corregir.

#### 1. react-hooks/exhaustive-deps (142 casos)
```bash
code reports/by-type/warnings/react-hooks-exhaustive-deps-parte-1-de-3.txt
```

**Problema**: Dependencias faltantes en hooks (useEffect, useCallback, useMemo).

**Soluciones**:
```javascript
// ❌ Antes
useEffect(() => {
  fetchData(userId);
}, []); // userId falta

// ✅ Solución 1: Agregar dependencia
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ Solución 2: Si es intencional
useEffect(() => {
  fetchData(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Solo ejecutar una vez
```

#### 2. react-refresh/only-export-components (5 casos)
```bash
code reports/by-type/warnings/react-refresh-only-export-components.txt
```

**Problema**: Exportar cosas que no son componentes desde archivos de componentes.

**Solución**: Mover exports a archivos separados o usar `export const`.

---

### Estrategia B: Empezar con Errores Críticos

Los errores bloquean el build en producción.

#### 1. @typescript-eslint/no-empty-function (35 casos)
```bash
code reports/by-type/errors/@typescript-eslint-no-empty-function.txt
```

**Problema**: Funciones vacías sin propósito.

**Soluciones**:
```javascript
// ❌ Antes
const handleClick = () => {};

// ✅ Solución 1: Eliminar si no se usa
// (eliminar la función)

// ✅ Solución 2: Agregar TODO si se implementará
const handleClick = () => {
  // TODO: Implementar lógica de click
};

// ✅ Solución 3: Si es intencional (placeholder)
const handleClick = () => {
  // Intencionalmente vacío - placeholder para prop
};
```

#### 2. react-hooks/rules-of-hooks (28 casos)
```bash
code reports/by-type/errors/react-hooks-rules-of-hooks.txt
```

**Problema**: Hooks llamados condicionalmente o en loops.

**Soluciones**:
```javascript
// ❌ Antes
function Component({ condition }) {
  if (condition) {
    const [state, setState] = useState(); // ❌ Hook condicional
  }
}

// ✅ Solución: Mover hook al nivel superior
function Component({ condition }) {
  const [state, setState] = useState();
  
  if (condition) {
    // Usar state aquí
  }
}
```

#### 3. import/no-unresolved (9 casos)
```bash
code reports/by-type/errors/import-no-unresolved.txt
```

**Problema**: Imports que ESLint no puede resolver.

**Soluciones**:
1. Verificar que el archivo existe
2. Verificar la ruta
3. Agregar a `ignore` en `eslint.config.js` si es un asset

---

### Reglas Comunes y Soluciones Rápidas

| Regla | Problema | Solución Rápida |
|-------|----------|-----------------|
| `renders` | Problemas de renderizado | Revisar lógica de render |
| `no-undef` | Variable no definida | Importar o definir variable |
| `declared` | Variable declarada pero no usada | Eliminar o usar |
| `expected` | Sintaxis esperada | Revisar sintaxis |
| `literal` | Literal inesperado | Revisar tipo de dato |

---

## 🔧 Personalización

### Cambiar Tamaño de Lotes

Por defecto, los lotes son de 50 problemas. Para cambiar:

```bash
# Lotes de 100
powershell -File ./tools/split-lint-by-type.ps1 -MaxPerFile 100

# Lotes de 25
powershell -File ./tools/split-lint-by-type.ps1 -MaxPerFile 25
```

### Usar Otro Archivo de Reporte

```bash
powershell -File ./tools/split-lint-by-type.ps1 -InputFile "otro-reporte.txt"
```

### Modificar Scripts

Los scripts están en:
- `tools/split-lint-by-type.ps1` - División por tipo
- `tools/split-lint-report.ps1` - División secuencial

---

## 💡 Consejos Pro

### ✅ Mejores Prácticas

1. **Commits frecuentes**: Haz commit después de cada 10-20 correcciones
2. **Un tipo a la vez**: Enfócate en una regla específica
3. **Auto-fix primero**: Ejecuta `npm run lint:fix` antes de corregir manualmente
4. **Prioriza errors**: Los warnings pueden esperar
5. **Documenta decisiones**: Si deshabilitas una regla, explica por qué

### 🎯 Atajos de Productividad

```bash
# Alias útiles (agregar a tu shell)
alias lint-report="npm run lint:report"
alias lint-fix="npm run lint:fix"
alias lint-errors="code reports/by-type/errors/"
alias lint-warnings="code reports/by-type/warnings/"
```

### 📊 Tracking de Progreso

Crea un archivo `LINT_PROGRESS.md` para trackear:

```markdown
# Progreso de Limpieza de Linting

## Objetivo
- [ ] 0 errores
- [ ] < 50 warnings

## Completado
- [x] @typescript-eslint/no-empty-function (35/35)
- [x] react-hooks-rules-of-hooks (28/28)
- [ ] react-hooks/exhaustive-deps (50/142)

## Notas
- 2025-12-10: Completados 63 errores
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué dos tipos de división?

- **by-type**: Para corrección sistemática (recomendado)
- **batches**: Para referencia y contexto completo

### ¿Puedo usar solo una división?

Sí, usa solo los comandos que necesites:
```bash
npm run lint:report:quick  # Solo reporte
npm run lint:by-type       # Solo by-type
```

### ¿Los archivos se sobrescriben?

Sí, cada vez que ejecutas `npm run lint:report`, los archivos se regeneran completamente con los problemas actuales.

### ¿Qué pasa si corrijo un error y regenero?

El error desaparece del reporte. Los archivos solo muestran problemas pendientes.

### ¿Puedo ignorar ciertos errores?

Sí, en `eslint.config.js`:
```javascript
rules: {
  'nombre-regla': 'off', // Deshabilitar completamente
  'nombre-regla': 'warn', // Cambiar a warning
}
```

O en el código:
```javascript
// eslint-disable-next-line nombre-regla
const codigo = aqui;
```

### ¿Cómo sé cuántos errores quedan?

Revisa `reports/by-type/00-INDICE.txt` después de cada `npm run lint:report`.

---

## 📈 Estadísticas Actuales

**Última actualización**: 2025-12-10

| Métrica | Valor |
|---------|-------|
| **Total de problemas** | 593 |
| **Errores** | 305 (51%) |
| **Warnings** | 288 (49%) |
| **Archivos afectados** | ~200 |

### Top 5 Errores
1. `renders` - 163 ocurrencias (27%)
2. `@typescript-eslint/no-empty-function` - 35 ocurrencias (6%)
3. `react-hooks/rules-of-hooks` - 28 ocurrencias (5%)
4. `render` - 26 ocurrencias (4%)
5. `preserved` - 14 ocurrencias (2%)

### Top 5 Warnings
1. `react-hooks/exhaustive-deps` - 142 ocurrencias (49%)
2. `sin-regla` - 140 ocurrencias (49%)
3. `react-refresh/only-export-components` - 5 ocurrencias (2%)
4. `unused-imports/no-unused-vars` - 1 ocurrencia (<1%)

---

## 🔗 Enlaces Útiles

- [Documentación de ESLint](https://eslint.org/docs/latest/)
- [Reglas de React Hooks](https://react.dev/reference/react/hooks#rules-of-hooks)
- [TypeScript ESLint](https://typescript-eslint.io/rules/)
- [ESLint Plugin Import](https://github.com/import-js/eslint-plugin-import)

---

## 📝 Changelog

### 2025-12-10
- ✅ Sistema inicial creado
- ✅ División por tipo implementada
- ✅ División secuencial implementada
- ✅ Comando unificado `npm run lint:report`
- ✅ Documentación completa

---

**¿Necesitas ayuda?** Revisa esta documentación o consulta con el equipo de desarrollo.
