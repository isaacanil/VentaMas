# Scripts de Desarrollo

Esta carpeta contiene scripts de utilidad escritos en Node.js para el mantenimiento y desarrollo del proyecto.

## 📋 Scripts Disponibles

Todos los scripts deben ejecutarse con Node.js desde la raíz del proyecto o desde esta carpeta.

### Gestión de Linting

- **`group-lint-errors.js`** - Divide errores de linting por tipo de regla y severidad en archivos separados.
- **`chunk-lint-report.js`** - Divide un reporte grande de linting secuencialmente en lotes más pequeños.

### Mantenimiento de Código

- **`find-unused-exports.js`** - Detecta y reporta exportaciones (exports) que no se están utilizando en ningún lugar del código.
- **`validate-imports.js`** - Verifica la integridad de las importaciones y detecta rutas rotas.
- **`fix-broken-imports.js`** - Script automático para corregir ciertos patrones de imports rotos conocidos.
- **`analyze-file-sizes.js`** - Analiza el tamaño de los archivos para encontrar posibles problemas de bundle.

### Utilidades de Git y Flujo de Trabajo

- **`sync-to-alt-main.js`** - Sincroniza la rama actual con la rama `main` de un remoto alternativo (`alt`), eliminando otras ramas remotas viejas.
- **`check-pending-tasks.js`** - Verifica si existen tareas o notas pendientes en la carpeta `pending`.

### Configuración

- **`configure-firebase-cors.js`** - Configuración de CORS para buckets de almacenamiento (ej. Firebase).
- **`check-env.js`** - Valida que el archivo `.env` local tenga todas las claves definidas en `.env.example`.

## Uso General

Para ejecutar cualquiera de estos scripts:

```bash
node tools/<script_name>.js
```

Ejemplos:

```bash
node tools/find-unused-exports.js
node tools/group-lint-errors.js
```
