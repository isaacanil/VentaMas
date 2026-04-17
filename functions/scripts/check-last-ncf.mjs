import fs from 'node:fs';
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync('C:/Dev/keys/VentaMas/ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json', 'utf8'))
  ),
  projectId: 'ventamaxpos',
});

const db = admin.firestore();

const snap = await db
  .collection('businesses/X63aIFwHzk3r0gmT8w6P/invoices')
  .where('data.NCF', '>', '')
  .orderBy('data.NCF', 'desc')
  .limit(15)
  .get();

console.log(`Invoices with NCF (last 15 by NCF desc): ${snap.size} found\n`);
snap.docs.forEach((d) => {
  const data = d.data()?.data ?? {};
  console.log(`#${data.numberID}  NCF=${data.NCF}  date=${data.date?.toDate?.()?.toISOString?.() ?? data.date}`);
});
