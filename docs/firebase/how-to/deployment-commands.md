# Guía rápida de despliegues Firebase

## ⚡ Resumen rápido

Comandos principales para publicar VentaMas en Hosting (prod/staging) y actualizar la configuración CORS de GCS.

## Lista de verificación

- [ ] Tener `firebase-tools` instalado y autenticado (`firebase login`).
- [ ] Seleccionar el proyecto correcto (`firebase use`).
- [ ] Variables `.env` actualizadas para cada entorno.
- [ ] Acceso a `gcloud` con permisos sobre `ventamaxpos.appspot.com`.

## Procedimiento

### Hosting producción

```bash
firebase deploy --only hosting:prod
# o vía script
npm run deploy:prod
```

### Hosting staging permanente

```bash
firebase deploy --only hosting:staging
# o vía script
npm run deploy:staging
```

### Actualizar CORS de Google Cloud Storage

```bash
gcloud storage buckets update gs://ventamaxpos.appspot.com --cors-file=cors.json
```

## Verificación

- Revisa `firebase hosting:channels:list` o la consola para confirmar la versión publicada.
- Abre `https://ventamas.app` (prod) o la URL de staging para validar assets.
- Usa `gsutil cors get gs://ventamaxpos.appspot.com` para confirmar reglas cargadas.

## Referencias

- `firebase.json`
- `cors.json`
- `package.json` (`deploy:*` scripts)
