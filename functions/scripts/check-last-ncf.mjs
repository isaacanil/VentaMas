import fs from 'node:fs';
import admin from 'firebase-admin';

const args = process.argv.slice(2);

const getFlagValue = (name) => {
  const withEquals = args.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) return withEquals.split('=').slice(1).join('=');
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const projectId =
  getFlagValue('--projectId') || process.env.GCLOUD_PROJECT || 'ventamaxpos';
const businessId =
  getFlagValue('--businessId') || 'X63aIFwHzk3r0gmT8w6P';
const keyPath =
  getFlagValue('--keyPath') ||
  getFlagValue('--service-account') ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS;

const credential = keyPath
  ? admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8')))
  : admin.credential.applicationDefault();

admin.initializeApp({
  credential,
  projectId,
});

const db = admin.firestore();

const snap = await db
  .collection(`businesses/${businessId}/invoices`)
  .where('data.NCF', '>', '')
  .orderBy('data.NCF', 'desc')
  .limit(15)
  .get();

console.log(`Invoices with NCF (last 15 by NCF desc): ${snap.size} found\n`);
snap.docs.forEach((d) => {
  const data = d.data()?.data ?? {};
  console.log(`#${data.numberID}  NCF=${data.NCF}  date=${data.date?.toDate?.()?.toISOString?.() ?? data.date}`);
});
