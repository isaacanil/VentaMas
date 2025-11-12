// setCors.js
const { Storage } = require('@google-cloud/storage');

// Inicializa el cliente. Asegúrate de que
// GOOGLE_APPLICATION_CREDENTIALS apunte a tu JSON de servicio.
const storage = new Storage();

async function setBucketCors() {
  const bucketName = 'ventamaxpos.appspot.com';
  const bucket = storage.bucket(bucketName);

  await bucket.setCorsConfiguration([
    {
      origin: ['*'],
      method: ['GET', 'HEAD'],
      maxAgeSeconds: 3600,
    },
  ]);

  console.log(`✅ CORS configurado en el bucket ${bucketName}`);
}

setBucketCors().catch(err => {
  console.error('❌ Error configurando CORS:', err);
  process.exit(1);
});
