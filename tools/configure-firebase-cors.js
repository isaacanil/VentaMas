// setCors.js
import { Storage as GCloudStorage } from '@google-cloud/storage';

// Inicializa el cliente. Asegúrate de que
// GOOGLE_APPLICATION_CREDENTIALS apunte a tu JSON de servicio.
const storage = new GCloudStorage();

async function setBucketCors() {
  const bucketName = 'ventamaxpos.appspot.com';
  const bucket = storage.bucket(bucketName);

  await bucket.setCorsConfiguration([
    {
      origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
        'https://ventamax.web.app',
        'https://ventamax.vercel.app',
        'https://ventamaxpos-staging.web.app',
      ],
      method: ['GET', 'HEAD'],
      responseHeader: ['Content-Type'],
      maxAgeSeconds: 3600,
    },
  ]);

  console.log(`✅ CORS configurado en el bucket ${bucketName}`);
}

setBucketCors().catch((err) => {
  console.error('❌ Error configurando CORS:', err);
  process.exit(1);
});
