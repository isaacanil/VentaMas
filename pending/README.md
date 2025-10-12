# Pending Notes

Revisa esta carpeta antes de mover cambios a producción. Aquí se documentan tareas o exportaciones pendientes como `expireAuthorizationRequests`.

- Cada archivo usa el formato `YYYY-MM-DD_<feature>.md`.
- Actualiza o elimina la nota cuando completes la tarea asociada.

## Recordatorio automático

- Ejecuta `chmod +x tools/check_pending.sh` para volver el script ejecutable.
- Agrega al cron de tu usuario algo como:
  ```
  0 9 * * * /bin/bash /home/jonat/Documentos/VentaMas/tools/check_pending.sh >> ~/.local/share/ventamas/pending.log 2>&1
  ```
  Esto genera un resumen diario a las 09:00 y deja el resultado en el log indicado. Si tienes un entorno gráfico con `notify-send`, también verás una notificación en pantalla.
