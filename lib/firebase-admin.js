// Firebase Admin SDK — runs on the SERVER only (API routes, webhooks).
//
// IMPORTANT: We use lazy initialization here. Instead of initializing
// Firebase Admin at import time (which crashes during `next build`
// because the env vars aren't always available or parseable at build),
// we wrap everything in getter functions that initialize on first call.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// This function cleans up the private key from various .env formats.
// The key can arrive in many broken formats depending on how it was
// copy-pasted into .env.local or Vercel's UI:
//   - Wrapped in double quotes: "-----BEGIN..."
//   - Wrapped in single quotes: '-----BEGIN...'
//   - With literal \n instead of real newlines
//   - With escaped \\n from JSON stringification
//   - With extra whitespace or missing newlines
function parsePrivateKey(key) {
  if (!key) return undefined;

  // Strip surrounding quotes if present
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }

  // Replace all variations of escaped newlines with real newlines
  cleaned = cleaned.replace(/\\\\n/g, "\n"); // \\n → \n (double escaped)
  cleaned = cleaned.replace(/\\n/g, "\n"); // \n → real newline

  return cleaned;
}

// Lazy initialization — only runs when you actually call getAdminDb()
// or getAdminStorage(), NOT at import time during the build.
let _initialized = false;

function ensureInitialized() {
  if (_initialized) return;
  if (getApps().length > 0) {
    _initialized = true;
    return;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin: Missing credentials. Server-side features " +
        "(download URLs, webhooks) will not work. This is expected " +
        "during build time."
    );
    return;
  }

  try {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
    _initialized = true;
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err.message);
  }
}

// Export getter functions instead of direct references.
// This way, Firebase Admin only initializes when your API route
// actually handles a request — never during the build.
export function getAdminDb() {
  ensureInitialized();
  return getFirestore();
}

export function getAdminStorage() {
  ensureInitialized();
  return getStorage();
}