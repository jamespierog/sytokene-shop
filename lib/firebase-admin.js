// Firebase Admin SDK — runs on the SERVER only (API routes, webhooks).
// This is used to:
// 1. Generate signed download URLs for .wav files after payment
// 2. Read Firestore data in API routes without client auth
//
// The private key authenticates your server as a privileged admin,
// so this file must NEVER be imported in client components.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Only initialize once (Next.js may re-run this during hot reload)
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key comes with literal \n characters in the env var,
      // which need to be converted to actual newlines for the PEM format
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminDb = getFirestore();
export const adminStorage = getStorage();
