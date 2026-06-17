# Guía rápida de despliegues Firebase

## Resumen rápido

Ejecutar los despliegues desde PowerShell 7.5.4 en la raíz del repo. El camino
seguro es el helper `tools/deploy.js`, expuesto por `npm run deploy`; ese helper
usa los aliases de `.firebaserc`, selecciona el build correcto y evita publicar
todas las Cloud Functions por accidente.

## Lista de verificación

- [ ] Estar en la raíz de `C:\Dev\VentaMas`.
- [ ] Tener sesión válida para Firebase (`firebase login`) y permisos sobre el
      proyecto de destino.
- [ ] Confirmar el alcance con `npm run deploy -- --help` o `--dry-run`.
- [ ] Si se modificó `functions/`, desplegar solo las funciones afectadas con
      `staging:functions` o `prod:functions`.
- [ ] Para CORS de Storage, usar `tools/configure-firebase-cors.js`; este repo
      no depende de un archivo externo de configuración CORS.

## Procedimiento

### Hosting staging

```powershell
npm run deploy -- staging
```

Previsualizar el comando sin desplegar:

```powershell
npm run deploy -- staging --dry-run
```

Si ya existe un `dist` válido y se quiere saltar el build:

```powershell
npm run deploy -- staging --no-build
```

### Hosting producción

```powershell
npm run deploy -- prod
```

En modo no interactivo, el guard de producción requiere confirmación explícita:

```powershell
$env:CONFIRM_PROD_DEPLOY = 'PROD'
npm run deploy -- prod
Remove-Item Env:\CONFIRM_PROD_DEPLOY
```

### Cloud Functions específicas

Staging:

```powershell
npm run deploy -- staging:functions nombreDeFuncion
```

Varias funciones:

```powershell
npm run deploy -- staging:functions funcionA,funcionB
```

Producción:

```powershell
$env:CONFIRM_PROD_DEPLOY = 'PROD'
npm run deploy -- prod:functions nombreDeFuncion
Remove-Item Env:\CONFIRM_PROD_DEPLOY
```

El helper oculta y bloquea los targets de todas las Functions en staging o
producción salvo que se defina `ALLOW_ALL_FUNCTIONS_DEPLOY=1`. Usar ese escape
hatch solo con aprobación explícita de release.

### Actualizar CORS de Google Cloud Storage

La configuración CORS vive en `tools/configure-firebase-cors.js`.

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\ruta\service-account.json'
node .\tools\configure-firebase-cors.js
Remove-Item Env:\GOOGLE_APPLICATION_CREDENTIALS
```

Verificación de solo lectura:

```powershell
gcloud storage buckets describe gs://ventamaxpos.appspot.com --format="json(cors_config)"
```

## Verificación

- Confirmar el alcance con `npm run deploy -- staging --dry-run` o el target
  equivalente antes de publicar.
- Revisar la salida del helper: debe mostrar el alias, el proyecto y el target.
- Abrir la URL publicada y validar que los assets cargan correctamente:
  `https://ventamax-staging.web.app/` para staging o `https://ventamax.web.app/`
  para producción.

## Referencias

- `.firebaserc`
- `firebase.json`
- `package.json` (`deploy:*` scripts)
- `tools/deploy.js`
- `tools/configure-firebase-cors.js`
