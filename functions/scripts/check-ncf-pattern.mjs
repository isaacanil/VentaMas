import fs from 'node:fs';
import admin from 'firebase-admin';

const args = process.argv.slice(2);

const getFlagValue = (name) => {
  const withEquals = args.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) return withEquals.split('=').slice(1).join('=');
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const toInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const projectId =
  getFlagValue('--projectId') || process.env.GCLOUD_PROJECT || 'ventamaxpos';
const businessId =
  getFlagValue('--businessId') || 'X63aIFwHzk3r0gmT8w6P';
const fromNumber = toInteger(getFlagValue('--from'), 945);
const toNumber = toInteger(getFlagValue('--to'), 965);
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
  .where('data.numberID', '>=', fromNumber)
  .where('data.numberID', '<=', toNumber)
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
