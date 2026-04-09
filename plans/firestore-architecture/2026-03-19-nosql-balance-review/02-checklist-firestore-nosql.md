# Checklist Firestore NoSQL

Usar este checklist antes de agregar o cambiar una coleccion, query, listener o write-path.

## 1. Query-first
- [ ] La pantalla o proceso ya tiene definida su query principal antes de definir el shape del documento.
- [ ] La ruta propuesta responde directo a la necesidad de lectura sin joins cliente por defecto.
- [ ] Si la pantalla necesita combinar varias entidades, se evaluo crear un read model en vez de hacer fan-out.

## 2. Autoridad del dato
- [ ] Existe una sola fuente primaria para este agregado.
- [ ] Las copias o snapshots estan marcadas como espejo, cache o read model.
- [ ] Esta documentado quien escribe la fuente primaria.
- [ ] Esta documentado quien actualiza el espejo y si puede regenerarse.

## 3. Denormalizacion sana
- [ ] La duplicacion reduce lecturas reales de una pantalla o proceso caliente.
- [ ] La duplicacion no obliga a decidir entre dos fuentes canonicamente validas.
- [ ] El dato duplicado puede reconstruirse desde una fuente primaria si se corrompe.
- [ ] La duplicacion no se hace "por si acaso".

## 4. Lado servidor vs lado cliente
- [ ] Las escrituras criticas o multi-documento viven en Cloud Functions o backend controlado.
- [ ] El cliente no hace read-calculate-write sobre secuencias, reservas o saldos sensibles.
- [ ] Si hay transaccion, esta en el lado servidor o su uso desde cliente esta claramente justificado.

## 5. Escalabilidad de documentos
- [ ] El documento no tiene arrays de crecimiento abierto.
- [ ] El documento no concentra escrituras frecuentes de muchos flujos distintos.
- [ ] El tamano esperado del documento se mantiene pequeno incluso con crecimiento del negocio.
- [ ] Si la estructura crece sin limite, se uso subcoleccion o eventos append-only.

## 6. Tenant boundary
- [ ] El dato operativo del negocio vive bajo `businesses/{businessId}/...`.
- [ ] No se creo una ruta raiz global para informacion que realmente pertenece al tenant.
- [ ] Si la coleccion es global, existe una razon funcional fuerte y documentada.

## 7. Seguridad y acceso
- [ ] La ruta puede protegerse con reglas por membresia o rol.
- [ ] No depende de reglas abiertas ni de "el frontend no lo hara mal".
- [ ] El path no rompe aislamiento entre negocios.

## 8. Indices y costo
- [ ] Las queries compuestas usadas en runtime estan reflejadas en `firestore.indexes.json`.
- [ ] Se evaluo el costo de listeners realtime frente a fetch one-shot o paginacion.
- [ ] No se esta usando realtime donde la pantalla realmente no lo necesita.

## 9. Compatibilidad legacy
- [ ] Si existe una ruta legacy, esta marcada como migracion temporal y no como contrato permanente.
- [ ] La nueva implementacion no agrega otra capa mas de compatibilidad silenciosa.
- [ ] Existe plan de retiro para la ruta legacy o al menos se congela su uso.

## 10. Senales de alarma
Si alguna de estas respuestas es "si", detener el cambio y revisar el diseno:

- [ ] La pantalla necesita dos o mas queries para reconstruir una fila simple.
- [ ] El cliente necesita hacer `documentId() in` por chunks para leer una vista comun.
- [ ] El mismo dato puede editarse desde dos rutas distintas.
- [ ] La propuesta agrega otro mirror sin declarar cual es la autoridad.
- [ ] El cambio introduce una nueva ruta raiz para dato de negocio.
- [ ] El cambio depende de listeners en cascada para armar una jerarquia grande.
