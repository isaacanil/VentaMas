# Migracion a Vite 8

## Objetivo

Migrar el frontend de `rolldown-vite@7.x` a `vite@8.0.0` estable, alineando dependencias y configuracion con los cambios oficiales de Vite 8.

## Estado actual

- El proyecto usa `vite` apuntando a `npm:rolldown-vite@^7.2.10`.
- `vite.config.ts` todavia usa `build.rollupOptions` y `build.commonjsOptions`.
- `vitest.config.ts` usa `esbuild.jsx`, que en Vite 8 pasa por capa de compatibilidad y debe migrarse a `oxc`.
- Storybook y el ecosistema Vitest estan en versiones de la rama anterior.

## Cambios a aplicar

1. Sustituir `rolldown-vite` por `vite@^8.0.0`.
2. Subir `@vitejs/plugin-react` a la rama 6.
3. Subir `vitest`, `@vitest/browser` y `@vitest/coverage-v8` a la rama 4.1.
4. Subir `storybook` y paquetes `@storybook/*` a una version con peer para `vite@^8`.
5. Mover `build.rollupOptions` a `build.rolldownOptions`.
6. Eliminar `build.commonjsOptions`, porque en Vite 8 ya no tiene efecto.
7. Migrar `vitest.config.ts` de `esbuild` a `oxc`.
8. Regenerar `package-lock.json` y validar `build`, `test:run` y `build-storybook`.

## Riesgos conocidos

- `vite-plugin-pwa@1.2.0` publica peer hasta Vite 7. El plugin compila correctamente con Vite 8 en este proyecto, pero npm necesita una compatibilidad temporal a nivel de repo (`.npmrc` con `legacy-peer-deps=true`) hasta que el paquete publique el peer actualizado.
- El cambio de interop CJS de Vite 8 puede romper imports por defecto ambiguos. Esto solo se confirma con build/test.
- Lightning CSS y Oxc pueden producir diferencias menores de output frente a la cadena actual.

## Criterios de cierre

- `npm run build` pasa.
- `npm run test:run` pasa.
- `npm run build-storybook` pasa o queda documentado el bloqueo exacto.
- El proyecto queda consumiendo `vite@8.x` real, no alias a `rolldown-vite`.
