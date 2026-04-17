import admin from 'firebase-admin';
import { readFileSync } from 'fs';
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync('C:/Dev/keys/VentaMas/ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json', 'utf8'))),
  projectId: 'ventamaxpos',
});
const doc = await admin.firestore().doc('businesses/X63aIFwHzk3r0gmT8w6P').get();
const d = doc.data();
const biz = d?.business ?? {};
console.log('Top-level keys:', Object.keys(d ?? {}).join(', '));
console.log('business keys:', Object.keys(biz).join(', '));
console.log('business.name:', biz?.name);
console.log('business.businessName:', biz?.businessName);
