# Repo guidance

- Cada vez que modifiques código dentro de `functions/`, incluye en la respuesta el comando para desplegar solo las Cloud Functions afectadas. Usa `firebase deploy --only functions:<FunctionName>` listando cada función relevante separada por comas.
- Si no puedes obtener el nombre exacto de las funciones, indica cómo actualizar `functions/src/index.js` y usa la mejor conjetura basada en los archivos tocados.
- Muestra también el comando `git status --short functions` (o equivalente) para que podamos ver los archivos modificados en `functions/` antes del deploy.
