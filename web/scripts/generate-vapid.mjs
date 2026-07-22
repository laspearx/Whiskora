/**
 * Run this script once to generate VAPID key pair for Web Push.
 * Usage: node scripts/generate-vapid.mjs
 * Then add the output to .env.local and Vercel environment variables.
 */
import { webcrypto } from 'node:crypto';
const { subtle } = webcrypto;

const keyPair = await subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },
  true,
  ['deriveKey'],
);

const publicKeyRaw = await subtle.exportKey('raw', keyPair.publicKey);
const publicKeyB64 = Buffer.from(publicKeyRaw).toString('base64url');

// PKCS8 DER for P-256: raw private key bytes start at offset 36
const privateKeyPkcs8 = await subtle.exportKey('pkcs8', keyPair.privateKey);
const privateKeyRaw = new Uint8Array(privateKeyPkcs8).slice(36, 68);
const privateKeyB64 = Buffer.from(privateKeyRaw).toString('base64url');

console.log('Copy the following into your .env.local and Vercel environment variables:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKeyB64}`);
console.log(`VAPID_PRIVATE_KEY=${privateKeyB64}`);
console.log(`VAPID_EMAIL=mailto:admin@whiskora.pet`);
console.log('');
console.log('Also add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL as Supabase secrets:');
console.log('  supabase secrets set VAPID_PUBLIC_KEY=<public>');
console.log('  supabase secrets set VAPID_PRIVATE_KEY=<private>');
console.log('  supabase secrets set VAPID_EMAIL=mailto:admin@whiskora.pet');
