# SYTO SHOP ⚡

A beat store for Sytokene. Buyers pay with Bitcoin Lightning — no accounts, no passwords. The producer uploads beats through an admin dashboard, and MoneyDevKit handles all payments.

```
Buyer visits shop → Browses beats → Plays preview → Clicks buy
→ Enters email → Pays Lightning invoice → Gets download link
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      SYTO SHOP                          │
├──────────────────────┬──────────────────────────────────┤
│   / (Storefront)     │   /admin (Producer Dashboard)    │
│                      │                                  │
│  - Browse beats      │  - Firebase Auth login           │
│  - Play previews     │  - Upload audio + cover image    │
│  - Buy with Lightning│  - Edit title, BPM, price, genre │
│  - Get download      │  - Show/hide beats from shop     │
│                      │  - Delete beats                  │
├──────────────────────┴──────────────────────────────────┤
│                                                         │
│   Firebase Firestore ──── beat metadata (title, price)  │
│   Firebase Storage ────── .wav files + cover images     │
│   Firebase Auth ────────── admin login (email/password) │
│   MoneyDevKit ──────────── Lightning invoices + payouts │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Frontend:** Next.js 15, React 19, Tailwind CSS
**Backend:** Firebase (Firestore, Cloud Storage, Auth)
**Payments:** MoneyDevKit (Bitcoin Lightning)

---

## Prerequisites

- **Node.js 18+** installed
- A **Google account** (for Firebase)
- A **Bitcoin Lightning wallet** for testing payments (CashApp, Strike, Phoenix, Wallet of Satoshi, etc.)

---

## Step-by-Step Setup

### 1. Clone and Install

```bash
cd syto-shop
npm install
cp .env.example .env.local
```

---

### 2. Create a Firebase Project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **"Create a project"** (or "Add project")
3. Name it something like `syto-shop`
4. Disable Google Analytics (you don't need it)
5. Click **Create Project**


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDitfH4Coqg25cAHTLVKSlsLMqjAuiQbnA",
  authDomain: "sytoshop-62769.firebaseapp.com",
  projectId: "sytoshop-62769",
  storageBucket: "sytoshop-62769.firebasestorage.app",
  messagingSenderId: "31726246563",
  appId: "1:31726246563:web:7e5ca9570a853d66727d16",
  measurementId: "G-7H25KRDDT0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

---

### 3. Enable Firebase Services

You need to turn on three things inside the Firebase console:

#### 3a. Authentication

1. In the left sidebar, click **Build → Authentication**
2. Click **"Get Started"**
3. Under "Sign-in method", click **Email/Password**
4. Toggle **"Enable"** to ON
5. Click **Save**

#### 3b. Create the Admin User

1. Still in Authentication, click the **"Users"** tab
2. Click **"Add user"**
3. Enter the email and password your brother will use to log into `/admin`
4. Click **"Add user"**

> **This is the only user account in the entire system.** Buyers don't need accounts.

#### 3c. Cloud Firestore

1. In the left sidebar, click **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add proper rules later)
4. Select a location close to your users (e.g., `us-east1`)
5. Click **Enable**

#### 3d. Cloud Storage

1. In the left sidebar, click **Build → Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Click **Next**, then **Done**

---

### 4. Get Firebase Client Credentials

1. In the Firebase console, click the **gear icon** → **Project settings**
2. Scroll down to **"Your apps"**
3. Click the **web icon** (`</>`) to register a web app
4. Name it anything (e.g., "syto-shop-web")
5. Click **Register app**
6. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "syto-shop-xxxxx.firebaseapp.com",
  projectId: "syto-shop-xxxxx",
  storageBucket: "syto-shop-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

7. Copy these values into your `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=syto-shop-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=syto-shop-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=syto-shop-xxxxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

### 5. Get Firebase Admin Credentials

These are server-side credentials for generating signed download URLs.

1. In Firebase console → **gear icon** → **Project settings**
2. Click the **"Service accounts"** tab
3. Click **"Generate new private key"**
4. A JSON file downloads. Open it — it looks like:

```json
{
  "project_id": "syto-shop-xxxxx",
  "client_email": "firebase-adminsdk-xxxxx@syto-shop-xxxxx.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
}
```

5. Copy these three values into your `.env.local`:

```
FIREBASE_PROJECT_ID=syto-shop-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@syto-shop-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

> **IMPORTANT:** The `FIREBASE_PRIVATE_KEY` value must be wrapped in double quotes and keep the `\n` characters as-is. Don't replace them with actual newlines in the `.env.local` file.

---

### 6. Set Up MoneyDevKit (Bitcoin Lightning Payments)

1. Run the setup command:

```bash
npx @moneydevkit/create
```

2. This creates your MoneyDevKit account and generates two credentials:
   - **API Key** (your `MDK_ACCESS_TOKEN`)
   - **Mnemonic** (your `MDK_MNEMONIC` — this is your Bitcoin wallet seed)

3. Add them to `.env.local`:

```
MDK_ACCESS_TOKEN=your_api_key_here
MDK_MNEMONIC=your_mnemonic_here
```

> **CRITICAL:** Back up your mnemonic somewhere safe. It controls your Bitcoin. MoneyDevKit is self-custodial — they never have access to your funds, but if you lose the mnemonic, you lose the money.

---

### 7. Run It

```bash
npm run dev
```

Visit:
- **[localhost:3000](http://localhost:3000)** — the storefront (empty until you upload beats)
- **[localhost:3000/admin](http://localhost:3000/admin)** — log in with the Firebase Auth user you created in Step 3b

Upload a beat in the admin, then go back to the storefront — it should appear immediately.

---

### 8. Test a Purchase

1. Upload a beat in `/admin` with a low price (e.g., $0.01 = 1 cent)
2. Go to the storefront at `/`
3. Click the beat → click **Buy** → enter an email → click **Pay with Lightning**
4. You'll be redirected to MoneyDevKit's checkout page with a Lightning invoice QR code
5. Scan the QR with any Lightning wallet (CashApp, Strike, Phoenix, etc.)
6. After payment confirms (a few seconds), you'll be redirected to the success page with a download link

---

## Going to Production

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

In the Vercel dashboard, go to **Settings → Environment Variables** and add ALL the variables from your `.env.local`.

Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g., `https://sytoshop.com`).

---

### Set Up Webhooks (for email delivery)

The webhook fires when a payment is confirmed, generates a signed download URL, and emails it to the buyer.

1. Go to **[moneydevkit.com](https://moneydevkit.com)** → Dashboard → Apps → Your App → **Webhooks**
2. Click **"Add Endpoint"**
3. URL: `https://yourdomain.com/api/webhooks/mdk`
4. Events: select **`checkout.completed`**
5. Click Create — copy the signing secret (starts with `whsec_`)
6. Add to your Vercel env vars:

```
MDK_WEBHOOK_SECRET=whsec_your_secret_here
```

---

### Set Up Email Delivery (optional but recommended)

Without email delivery, buyers only get the download link on the success page (if they close it, they need to contact you). With email delivery, they get a backup link in their inbox.

If using **Gmail**:
1. Enable 2-Factor Authentication on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password (select "Mail" and your device)
4. Add to env vars:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=the_16_character_app_password
SMTP_FROM=sytokene@yourdomain.com
```

---

### Firebase Security Rules (IMPORTANT)

The project starts in "test mode" which allows anyone to read AND write. Before going live, set proper rules:

#### Firestore Rules

Go to Firebase Console → Firestore → **Rules** tab, and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read beats (the storefront needs this)
    // Only logged-in users can create/edit/delete
    match /beats/{beatId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Sales records are written by the server (admin SDK) only
    // Nobody can read or write from the client
    match /sales/{saleId} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

#### Storage Rules

Go to Firebase Console → Storage → **Rules** tab, and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /beats/{allPaths=**} {
      // Anyone can read (for audio previews + cover images)
      allow read: if true;
      // Only logged-in users can upload/delete
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

---

### Firestore Index (if you see an index error)

The storefront queries beats with `where("active", "==", true)` + `orderBy("createdAt", "desc")`. Firestore may ask you to create a composite index. If you see an error in the browser console with a link like:

```
https://console.firebase.google.com/v1/r/project/xxx/firestore/indexes?create_composite=...
```

Just click the link and it will auto-create the index for you. It takes about a minute.

---

## Project Structure

```
syto-shop/
├── app/
│   ├── layout.js                    # Root layout, fonts, metadata
│   ├── globals.css                  # Tailwind + custom dark theme styles
│   ├── page.js                      # Consumer storefront (browse, play, buy)
│   ├── admin/
│   │   └── page.js                  # Admin dashboard (login, upload, CRUD)
│   ├── checkout/
│   │   ├── [id]/page.js             # MDK hosted checkout (Lightning invoice)
│   │   └── success/page.js          # Payment confirmation + download link
│   └── api/
│       ├── mdk/route.js             # MDK unified endpoint (SDK handles this)
│       ├── webhooks/mdk/route.js    # Payment webhook → email delivery
│       └── download/[beatId]/route.js  # Signed download URL generator
├── lib/
│   ├── firebase.js                  # Firebase client SDK (browser)
│   └── firebase-admin.js           # Firebase Admin SDK (server only)
├── next.config.mjs                  # MDK plugin
├── tailwind.config.js               # Custom dark theme
├── .env.example                     # All env vars documented
└── package.json                     # Next 15 + React 19 + Firebase + MDK
```

---

## How It All Connects

```
ADMIN UPLOADS BEAT
       │
       ├─→ Audio file → Firebase Cloud Storage (beats/{id}/audio.wav)
       ├─→ Cover image → Firebase Cloud Storage (beats/{id}/cover.jpg)
       └─→ Metadata → Firestore (beats collection)
                │
                ▼
BUYER VISITS STOREFRONT
       │
       ├─→ Reads beats from Firestore (useEffect + getDocs)
       ├─→ Plays preview (audioUrl from Cloud Storage)
       ├─→ Clicks Buy → enters email
       │         │
       │         ▼
       │   createCheckout() → MoneyDevKit API
       │         │
       │         ▼
       │   Redirect to /checkout/[id]
       │   (MDK hosted UI shows Lightning invoice QR)
       │         │
       │         ▼
       │   Buyer scans QR with Lightning wallet
       │   (CashApp, Strike, Phoenix, etc.)
       │         │
       │         ▼
       │   Payment confirms (2-5 seconds)
       │         │
       │         ├─→ MDK redirects to /checkout/success
       │         │   (useCheckoutSuccess verifies payment)
       │         │   (Fetches signed download URL from /api/download/[beatId])
       │         │   (Buyer downloads .wav file)
       │         │
       │         └─→ MDK fires webhook to /api/webhooks/mdk
       │             (Generates signed URL)
       │             (Sends download email to buyer)
       │             (Records sale in Firestore)
       │
       └─→ Bitcoin arrives in your self-custodial Lightning wallet
           (controlled by MDK_MNEMONIC)
```

---

## Customization

### Change the look
Edit `tailwind.config.js` to change the color scheme. The current theme uses:
- `brand-dark` (#0a0a0a) — page background
- `brand-gold` (#f39c12) — headings, accents
- `brand-red` (#c0392b) — buy buttons, prices
- `brand-green` (#4ade80) — success states

### Add genres/filtering
The storefront currently shows all active beats sorted by newest. You could add genre tabs by querying Firestore with additional `where` clauses.

### Audio previews
Right now the full audio URL is used for previews. For production, you could generate 30-second clips server-side and upload them as a separate `previewUrl`. The storefront already supports a separate `previewUrl` field — it falls back to `audioUrl` if not set.

---

## FAQ

**Where does the Bitcoin go?**
Your self-custodial Lightning wallet, controlled by `MDK_MNEMONIC`. MoneyDevKit never holds your funds. Check your balance at [moneydevkit.com/dashboard/payouts](https://moneydevkit.com/dashboard/payouts).

**What wallets can buyers use?**
Any Lightning-enabled wallet: CashApp (58M users), Strike, Phoenix, Wallet of Satoshi, Zeus, Breez, BlueWallet, Muun, and more.

**Do I need to run a Lightning node?**
No. MoneyDevKit spins up a serverless Lightning node on your infrastructure automatically. You don't manage channels, liquidity, or any of that.

**What if the buyer closes the success page before downloading?**
If you've configured email delivery (SMTP), they get a download link in their inbox. If not, they'd need to contact you. Set up email delivery for production.

**Can I accept USD/fiat too?**
Not with MoneyDevKit — it's Lightning-only. That's the point: no Stripe, no KYC, no permission needed. Anyone in the world can pay.

---

## License

Do whatever you want with it. Stack sats. 🤙
