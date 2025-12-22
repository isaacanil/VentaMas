# Scripts de Desarrollo

Esta carpeta contiene scripts de utilidad para el desarrollo del proyecto.

## 📋 Scripts Disponibles

### Gestión de Linting

- **`split-lint-by-type.ps1`** - Divide errores de linting por tipo de regla y severidad
- **`split-lint-report.ps1`** - Divide errores de linting secuencialmente en lotes

**📖 Documentación completa**: Ver [`docs/development/lint-management.md`](../docs/development/lint-management.md)

**Uso rápido**:
```bash
npm run lint:report  # Genera reporte + divisiones automáticamente
```

### Otros Scripts

- **`check-unused-exports.ps1`** - Detecta exports no utilizados
- **`check_pending.sh`** - Verifica actualizaciones pendientes
- **`push-to-alt-as-main.sh`** - Push a repositorio alternativo
- **`setCors.js`** - Configuración de CORS para Firebase

---

Para más información sobre cada script, consulta la documentación en `docs/development/`.
