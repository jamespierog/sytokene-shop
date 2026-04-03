"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// The Google Auth provider — initialized once, reused for every sign-in
const googleProvider = new GoogleAuthProvider();

// ═══════════════════════════════════════════════════════
// ADMIN PAGE — Two states:
// 1. Logged out → show Google sign-in button
// 2. Logged in → show beat management dashboard
// ═══════════════════════════════════════════════════════

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for auth state changes (persists across page refreshes
  // because Firebase Auth stores the session in IndexedDB by default)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <p className="font-display text-brand-muted tracking-widest animate-blink">
          LOADING...
        </p>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <AdminDashboard user={user} />;
}

// ───────────────────────────────────────────────────
// LOGIN SCREEN — Single "Sign in with Google" button
// ───────────────────────────────────────────────────
function LoginScreen() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      // Opens a popup window where the user picks their Google account.
      // On success, Firebase Auth creates a session automatically —
      // the onAuthStateChanged listener in the parent picks it up
      // and switches to the dashboard view.
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // Common error: user closes the popup before finishing
      if (err.code === "auth/popup-closed-by-user") {
        setError(null); // Not really an error, they just cancelled
      } else if (err.code === "auth/unauthorized-domain") {
        // This happens when the domain isn't in Firebase's authorized list.
        // Fix: Firebase Console → Authentication → Settings → Authorized domains
        // Add your domain (localhost is usually there by default).
        setError(
          "This domain isn't authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <h1 className="font-display text-3xl text-brand-gold tracking-[6px]">
            SYTO SHOP
          </h1>
          <p className="text-brand-muted text-xs tracking-widest mt-2">
            ADMIN
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white text-gray-800 font-mono text-sm py-3.5 px-6 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {/* Google "G" logo as inline SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        {error && (
          <p className="text-red-400 text-xs mt-4 text-left bg-red-900/20 border border-red-900/30 rounded-lg p-3">
            {error}
          </p>
        )}

        <p className="mt-8">
          <a
            href="/"
            className="text-brand-muted text-xs hover:text-gray-400 transition-colors tracking-widest"
          >
            ← BACK TO SHOP
          </a>
        </p>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────
// ADMIN DASHBOARD
// ───────────────────────────────────────────────────
function AdminDashboard({ user }) {
  const [beats, setBeats] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  // Real-time listener — updates automatically when beats change
  useEffect(() => {
    const q = query(collection(db, "beats"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBeats(data);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Show Google profile photo if available */}
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h1 className="font-display text-2xl text-brand-gold tracking-[4px]">
                ADMIN
              </h1>
              <p className="text-brand-muted text-xs tracking-wider">
                {user.displayName || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-brand-muted text-xs hover:text-gray-400 transition-colors tracking-widest"
            >
              VIEW SHOP
            </a>
            <button
              onClick={() => signOut(auth)}
              className="text-red-400 text-xs hover:text-red-300 transition-colors tracking-widest"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-brand-muted text-sm">
            {beats.length} beat{beats.length !== 1 ? "s" : ""} uploaded
          </p>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-brand-red text-white font-display text-sm px-5 py-2.5 rounded-lg tracking-[2px] hover:bg-red-600 transition-colors"
          >
            {showUpload ? "CANCEL" : "+ UPLOAD BEAT"}
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <UploadForm onComplete={() => setShowUpload(false)} />
        )}

        {/* Beats list */}
        {beats.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-brand-border rounded-xl">
            <p className="font-display text-xl text-brand-muted tracking-widest mb-2">
              NO BEATS UPLOADED
            </p>
            <p className="text-brand-muted text-sm">
              Click &quot;Upload Beat&quot; to add your first track.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {beats.map((beat) => (
              <BeatRow key={beat.id} beat={beat} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ───────────────────────────────────────────────────
// UPLOAD FORM
// ───────────────────────────────────────────────────
function UploadForm({ onComplete }) {
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState("");
  const [price, setPrice] = useState("");
  const [genre, setGenre] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();

    if (!audioFile) {
      setError("Select an audio file (.wav)");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Create Firestore doc to get an ID for organizing storage files
      const beatRef = await addDoc(collection(db, "beats"), {
        title,
        bpm: parseInt(bpm) || 0,
        price: Math.round(parseFloat(price) * 100), // cents
        currency: "USD",
        genre: genre || null,
        tag: tag || null,
        description: description || null,
        active: true,
        audioUrl: null,
        audioPath: null,
        imageUrl: null,
        imagePath: null,
        createdAt: serverTimestamp(),
      });

      const beatId = beatRef.id;

      // Step 2: Upload audio to Cloud Storage at beats/{id}/audio.wav
      const audioExt = audioFile.name.split(".").pop();
      const audioPath = `beats/${beatId}/audio.${audioExt}`;
      const audioStorageRef = ref(storage, audioPath);
      const audioUpload = uploadBytesResumable(audioStorageRef, audioFile);

      await new Promise((resolve, reject) => {
        audioUpload.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(pct);
          },
          reject,
          resolve
        );
      });

      const audioUrl = await getDownloadURL(audioStorageRef);

      // Step 3: Upload cover image (optional)
      let imageUrl = null;
      let imagePath = null;

      if (imageFile) {
        const imgExt = imageFile.name.split(".").pop();
        imagePath = `beats/${beatId}/cover.${imgExt}`;
        const imgRef = ref(storage, imagePath);
        await uploadBytesResumable(imgRef, imageFile);
        imageUrl = await getDownloadURL(imgRef);
      }

      // Step 4: Update Firestore doc with the download URLs
      await updateDoc(doc(db, "beats", beatId), {
        audioUrl,
        audioPath,
        previewUrl: audioUrl, // same as full audio for now
        imageUrl,
        imagePath,
      });

      onComplete();
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleUpload}
      className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-6"
    >
      <h3 className="font-display text-lg text-brand-gold tracking-[2px] mb-4">
        UPLOAD NEW BEAT
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">
            TITLE *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
            placeholder="Midnight Drift"
            required
          />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">
            BPM *
          </label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
            placeholder="140"
            required
          />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">
            PRICE (USD) *
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
            placeholder="5.00"
            required
          />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">
            GENRE
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
            placeholder="Trap, Phonk, Lo-fi..."
          />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">
            TAG (BADGE)
          </label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
            placeholder="NEW, HOT, etc."
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-brand-muted text-xs tracking-wider block mb-1">
          DESCRIPTION
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors resize-none"
          placeholder="Dark ambient beat with heavy 808s..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">
            AUDIO FILE (.wav) *
          </label>
          <input
            type="file"
            accept=".wav,.mp3,.flac"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-brand-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-dark file:text-brand-gold file:font-display file:text-xs file:tracking-wider file:cursor-pointer hover:file:bg-brand-border"
          />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">
            COVER IMAGE
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-brand-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-dark file:text-brand-gold file:font-display file:text-xs file:tracking-wider file:cursor-pointer hover:file:bg-brand-border"
          />
        </div>
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gold transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-brand-muted text-xs mt-1">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="bg-brand-green text-brand-dark font-display text-sm px-6 py-2.5 rounded-lg tracking-[2px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? "UPLOADING..." : "UPLOAD"}
      </button>
    </form>
  );
}

// ───────────────────────────────────────────────────
// BEAT ROW — Individual beat in the admin list
// ───────────────────────────────────────────────────
function BeatRow({ beat }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(beat.title);
  const [bpm, setBpm] = useState(beat.bpm?.toString() || "");
  const [price, setPrice] = useState(((beat.price || 0) / 100).toString());
  const [genre, setGenre] = useState(beat.genre || "");
  const [tag, setTag] = useState(beat.tag || "");
  const [active, setActive] = useState(beat.active !== false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "beats", beat.id), {
        title,
        bpm: parseInt(bpm) || 0,
        price: Math.round(parseFloat(price) * 100),
        genre: genre || null,
        tag: tag || null,
        active,
      });
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${beat.title}"? This can't be undone.`)) return;

    setDeleting(true);
    try {
      if (beat.audioPath) {
        try { await deleteObject(ref(storage, beat.audioPath)); } catch {}
      }
      if (beat.imagePath) {
        try { await deleteObject(ref(storage, beat.imagePath)); } catch {}
      }
      await deleteDoc(doc(db, "beats", beat.id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive() {
    const newActive = !active;
    setActive(newActive);
    await updateDoc(doc(db, "beats", beat.id), { active: newActive });
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-brand-dark overflow-hidden shrink-0">
          {beat.imageUrl ? (
            <img src={beat.imageUrl} alt={beat.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">🎵</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="col-span-2 bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Title" />
              <input value={bpm} onChange={(e) => setBpm(e.target.value)}
                className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="BPM" />
              <input value={price} onChange={(e) => setPrice(e.target.value)}
                className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Price (USD)" />
              <input value={genre} onChange={(e) => setGenre(e.target.value)}
                className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Genre" />
              <input value={tag} onChange={(e) => setTag(e.target.value)}
                className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Tag" />
            </div>
          ) : (
            <>
              <h3 className="font-display text-lg text-white tracking-widest truncate">{beat.title}</h3>
              <p className="text-brand-muted text-xs tracking-wider">
                {beat.bpm} BPM{beat.genre ? ` · ${beat.genre}` : ""} · ${((beat.price || 0) / 100).toFixed(2)}
                {beat.tag && (
                  <span className="ml-2 bg-brand-gold/20 text-brand-gold text-xs px-1.5 py-0.5 rounded">{beat.tag}</span>
                )}
                {!active && (
                  <span className="ml-2 bg-red-900/30 text-red-400 text-xs px-1.5 py-0.5 rounded">HIDDEN</span>
                )}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="text-brand-green text-xs tracking-wider hover:brightness-110 disabled:opacity-50">
                {saving ? "..." : "SAVE"}
              </button>
              <button onClick={() => setEditing(false)}
                className="text-brand-muted text-xs tracking-wider hover:text-gray-400">CANCEL</button>
            </>
          ) : (
            <>
              <button onClick={handleToggleActive}
                className="text-brand-muted text-xs tracking-wider hover:text-white"
                title={active ? "Hide from shop" : "Show in shop"}>
                {active ? "HIDE" : "SHOW"}
              </button>
              <button onClick={() => setEditing(true)}
                className="text-brand-gold text-xs tracking-wider hover:brightness-110">EDIT</button>
              <button onClick={handleDelete} disabled={deleting}
                className="text-red-400 text-xs tracking-wider hover:text-red-300 disabled:opacity-50">
                {deleting ? "..." : "DELETE"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}