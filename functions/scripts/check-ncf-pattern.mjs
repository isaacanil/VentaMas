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
  .where('data.numberID', '>=', 945)
  .where('data.numberID', '<=', 965)
  .orderBy('data.numberID')
  .get();

console.log(`Found ${snap.size} invoices\n`);
snap.docs.forEach((d) => {
  const data = d.data()?.data ?? {};
  const ncf = data?.NCF ?? '';
  const txType = data?.selectedTaxReceiptType ?? '';
  const clientId = data?.client?.id ?? '';
  const clientRnc = data?.client?.rnc ?? data?.client?.personalID ?? '';
  const name = data?.client?.name ?? '';
  console.log(
    `#${data.numberID}  NCF=${ncf || '❌'}  txType=${txType || '❌'}  clientId=${clientId || '❌'}  rnc=${clientRnc || '❌'}  name=${name || '❌'}`
  );
});
