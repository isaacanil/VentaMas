# 2025-11-09_unused-ui-cleanup

## UI components sin referencias activas

- `src/abilities/actions.js`: utilitario de acciones/sujetos no importado en el código actual. Revisar si su definición debería migrarse a documentación o eliminarse.
- `src/assets/system/user/UserIcon.jsx`: ícono no utilizado tras revisar importaciones. Dependencias asociadas (`.scss` y `.svg`) también parecen obsoletas.
- `src/components/PageTransition.jsx`: wrapper de transición no usado en rutas actuales.
- `src/components/ProcessViewer.jsx`: overlay de procesos no referenciado.
- `src/views/component/MultiDisplayControl/MultiDisplayControl.jsx`: componente experimental sin consumidores y dependiente de los íconos anteriores.

## Próximos pasos sugeridos

1. Confirmar con el equipo si alguno de estos módulos debe preservarse para futuros releases.
2. Si no hay objeciones, eliminarlos junto con sus estilos/assets asociados y actualizar `unused-exports-report.txt`.
3. Ejecutar `npm run lint:path -- src/abilities src/assets src/components src/views/component/MultiDisplayControl` para validar que no queden imports colgantes.
