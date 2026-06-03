import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

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
  ? admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8')))
  : admin.credential.applicationDefault();

admin.initializeApp({
  credential,
  projectId,
});
const doc = await admin.firestore().doc(`businesses/${businessId}`).get();
const d = doc.data();
const biz = d?.business ?? {};
console.log('Top-level keys:', Object.keys(d ?? {}).join(', '));
console.log('business keys:', Object.keys(biz).join(', '));
console.log('business.name:', biz?.name);
console.log('business.businessName:', biz?.businessName);
