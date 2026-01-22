# Repo guidance

- Cada vez que modifiques codigo dentro de `functions/`, incluye en la respuesta el comando para desplegar solo las Cloud Functions afectadas. Usa `firebase deploy --only functions:<FunctionName>` listando cada funcion relevante separada por comas.
- Si no puedes obtener el nombre exacto de las funciones, indica como actualizar `functions/src/index.js` y usa la mejor conjetura basada en los archivos tocados.
- Muestra tambien el comando `git status --short functions` (o equivalente) para que podamos ver los archivos modificados en `functions/` antes del deploy.
- Cuando se pida dividir un componente, separa el codigo en `utils/`, `components/`, `hooks/`, u otras carpetas que correspondan dentro de la misma carpeta del componente. Mueve los estilos de styled-components a los archivos de cada subcomponente; solo centraliza estilos en un archivo comun si se reutilizan en varios subcomponentes.

## React hooks + lint (`react-hooks/set-state-in-effect`)
- Si aparece `Calling setState synchronously within an effect...` (lint `react-hooks/set-state-in-effect`):
  - Evita llamar `setState(...)` directamente en el cuerpo del `useEffect` para "sincronizar" estado derivado.
  - Si el estado es derivable, calcúlalo en render (o usa un `safeValue`/clamp al leer).
  - Si el effect sincroniza con un sistema externo (Firestore `onSnapshot`, event listeners, timers, etc.), haz `setState` dentro del callback del sistema externo, no en el cuerpo del effect.
  - No uses `eslint-disable` salvo último recurso; si se usa, justificar por qué no hay alternativa.


