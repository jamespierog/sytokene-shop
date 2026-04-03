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

const googleProvider = new GoogleAuthProvider();

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
        <p className="font-display text-brand-muted tracking-widest animate-blink">LOADING...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  return <AdminDashboard user={user} />;
}

function LoginScreen() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") setError(null);
      else if (err.code === "auth/unauthorized-domain")
        setError("Domain not authorized. Add it in Firebase Console → Auth → Settings → Authorized domains.");
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <h1 className="font-display text-3xl text-brand-gold tracking-[6px]">SYTO SHOP</h1>
          <p className="text-brand-muted text-xs tracking-widest mt-2">ADMIN</p>
        </div>
        <button onClick={handleGoogleSignIn} disabled={loading}
          className="w-full bg-white text-gray-800 font-mono text-sm py-3.5 px-6 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        {error && <p className="text-red-400 text-xs mt-4 text-left bg-red-900/20 border border-red-900/30 rounded-lg p-3">{error}</p>}
        <p className="mt-8">
          <a href="/" className="text-brand-muted text-xs hover:text-gray-400 transition-colors tracking-widest">← BACK TO SHOP</a>
        </p>
      </div>
    </div>
  );
}

function AdminDashboard({ user }) {
  const [beats, setBeats] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [filterType, setFilterType] = useState("all"); // all | beat | loop

  useEffect(() => {
    const q = query(collection(db, "beats"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBeats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const filtered = filterType === "all" ? beats : beats.filter((b) => b.type === filterType);

  return (
    <div className="min-h-screen bg-brand-dark">
      <header className="border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />}
            <div>
              <h1 className="font-display text-2xl text-brand-gold tracking-[4px]">ADMIN</h1>
              <p className="text-brand-muted text-xs tracking-wider">{user.displayName || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-brand-muted text-xs hover:text-gray-400 transition-colors tracking-widest">VIEW SHOP</a>
            <button onClick={() => signOut(auth)} className="text-red-400 text-xs hover:text-red-300 transition-colors tracking-widest">SIGN OUT</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <p className="text-brand-muted text-sm mr-2">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
            {/* Filter tabs */}
            {["all", "beat", "loop"].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`font-display text-xs px-3 py-1 rounded tracking-widest transition-colors ${
                  filterType === t
                    ? "bg-brand-gold/20 text-brand-gold"
                    : "text-brand-muted hover:text-white"
                }`}>
                {t === "all" ? "ALL" : t === "beat" ? "BEATS" : "LOOPS"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowUpload(!showUpload)}
            className="bg-brand-red text-white font-display text-sm px-5 py-2.5 rounded-lg tracking-[2px] hover:bg-red-600 transition-colors">
            {showUpload ? "CANCEL" : "+ UPLOAD"}
          </button>
        </div>

        {showUpload && <UploadForm onComplete={() => setShowUpload(false)} />}

        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-brand-border rounded-xl">
            <p className="font-display text-xl text-brand-muted tracking-widest mb-2">NOTHING HERE</p>
            <p className="text-brand-muted text-sm">Upload some {filterType === "all" ? "beats or loops" : filterType + "s"}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((beat) => <BeatRow key={beat.id} beat={beat} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function UploadForm({ onComplete }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("beat"); // "beat" or "loop"
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
    if (!audioFile) { setError("Select an audio file"); return; }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const beatRef = await addDoc(collection(db, "beats"), {
        title,
        type, // "beat" or "loop" — used to sort into the correct vending machine
        bpm: parseInt(bpm) || 0,
        price: Math.round(parseFloat(price) * 100),
        currency: "USD",
        genre: genre || null,
        tag: tag || null,
        description: description || null,
        active: true,
        audioUrl: null, audioPath: null,
        imageUrl: null, imagePath: null,
        createdAt: serverTimestamp(),
      });

      const beatId = beatRef.id;

      const audioExt = audioFile.name.split(".").pop();
      const audioPath = `beats/${beatId}/audio.${audioExt}`;
      const audioStorageRef = ref(storage, audioPath);
      const audioUpload = uploadBytesResumable(audioStorageRef, audioFile);

      await new Promise((resolve, reject) => {
        audioUpload.on("state_changed",
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject, resolve);
      });

      const audioUrl = await getDownloadURL(audioStorageRef);

      let imageUrl = null, imagePath = null;
      if (imageFile) {
        const imgExt = imageFile.name.split(".").pop();
        imagePath = `beats/${beatId}/cover.${imgExt}`;
        const imgRef = ref(storage, imagePath);
        await uploadBytesResumable(imgRef, imageFile);
        imageUrl = await getDownloadURL(imgRef);
      }

      await updateDoc(doc(db, "beats", beatId), {
        audioUrl, audioPath, previewUrl: audioUrl, imageUrl, imagePath,
      });

      onComplete();
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-6">
      <h3 className="font-display text-lg text-brand-gold tracking-[2px] mb-4">UPLOAD NEW SOUND</h3>

      {/* Type selector — big toggle between BEAT and LOOP */}
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setType("beat")}
          className={`flex-1 py-3 rounded-lg font-display text-sm tracking-[3px] transition-all border ${
            type === "beat"
              ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
              : "bg-brand-dark border-brand-border text-brand-muted hover:border-gray-500"
          }`}>
          🎵 BEAT
        </button>
        <button type="button" onClick={() => setType("loop")}
          className={`flex-1 py-3 rounded-lg font-display text-sm tracking-[3px] transition-all border ${
            type === "loop"
              ? "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400"
              : "bg-brand-dark border-brand-border text-brand-muted hover:border-gray-500"
          }`}>
          🔁 LOOP
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">TITLE *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
            placeholder={type === "beat" ? "Midnight Drift" : "808 Slide Loop"} />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">BPM *</label>
          <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} required
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors" placeholder="140" />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">PRICE (USD) *</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors" placeholder="5.00" />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">GENRE</label>
          <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors" placeholder="Trap, Phonk, Lo-fi..." />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">TAG</label>
          <input type="text" value={tag} onChange={(e) => setTag(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors" placeholder="NEW, HOT" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-brand-muted text-xs tracking-wider block mb-1">DESCRIPTION</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full bg-brand-dark border border-brand-border rounded-lg py-2.5 px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors resize-none"
          placeholder="Dark ambient beat with heavy 808s..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">AUDIO FILE *</label>
          <input type="file" accept=".wav,.mp3,.flac" onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-brand-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-dark file:text-brand-gold file:font-display file:text-xs file:tracking-wider file:cursor-pointer hover:file:bg-brand-border" />
        </div>
        <div>
          <label className="text-brand-muted text-xs tracking-wider block mb-1">COVER IMAGE</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-brand-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-dark file:text-brand-gold file:font-display file:text-xs file:tracking-wider file:cursor-pointer hover:file:bg-brand-border" />
        </div>
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="h-2 bg-brand-dark rounded-full overflow-hidden">
            <div className="h-full bg-brand-gold transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-brand-muted text-xs mt-1">Uploading... {progress}%</p>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <button type="submit" disabled={uploading}
        className="bg-brand-green text-brand-dark font-display text-sm px-6 py-2.5 rounded-lg tracking-[2px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {uploading ? "UPLOADING..." : "UPLOAD"}
      </button>
    </form>
  );
}

function BeatRow({ beat }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(beat.title);
  const [type, setType] = useState(beat.type || "beat");
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
        title, type, bpm: parseInt(bpm) || 0,
        price: Math.round(parseFloat(price) * 100),
        genre: genre || null, tag: tag || null, active,
      });
      setEditing(false);
    } catch (err) { console.error("Save failed:", err); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${beat.title}"?`)) return;
    setDeleting(true);
    try {
      if (beat.audioPath) try { await deleteObject(ref(storage, beat.audioPath)); } catch {}
      if (beat.imagePath) try { await deleteObject(ref(storage, beat.imagePath)); } catch {}
      await deleteDoc(doc(db, "beats", beat.id));
    } catch (err) { console.error("Delete failed:", err); }
    finally { setDeleting(false); }
  }

  async function handleToggleActive() {
    const n = !active; setActive(n);
    await updateDoc(doc(db, "beats", beat.id), { active: n });
  }

  const typeColor = (beat.type || "beat") === "beat" ? "cyan" : "fuchsia";

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
            <div className="space-y-2 mb-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => setType("beat")}
                  className={`px-3 py-1 rounded text-xs font-display tracking-wider border ${type === "beat" ? "border-cyan-500 text-cyan-400 bg-cyan-500/10" : "border-brand-border text-brand-muted"}`}>BEAT</button>
                <button type="button" onClick={() => setType("loop")}
                  className={`px-3 py-1 rounded text-xs font-display tracking-wider border ${type === "loop" ? "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10" : "border-brand-border text-brand-muted"}`}>LOOP</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  className="col-span-2 bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Title" />
                <input value={bpm} onChange={(e) => setBpm(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="BPM" />
                <input value={price} onChange={(e) => setPrice(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Price" />
                <input value={genre} onChange={(e) => setGenre(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Genre" />
                <input value={tag} onChange={(e) => setTag(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Tag" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-white tracking-widest truncate">{beat.title}</h3>
                <span className={`text-[10px] font-display tracking-wider px-1.5 py-0.5 rounded ${
                  typeColor === "cyan" ? "bg-cyan-500/15 text-cyan-400" : "bg-fuchsia-500/15 text-fuchsia-400"
                }`}>
                  {(beat.type || "beat").toUpperCase()}
                </span>
              </div>
              <p className="text-brand-muted text-xs tracking-wider">
                {beat.bpm} BPM{beat.genre ? ` · ${beat.genre}` : ""} · ${((beat.price || 0) / 100).toFixed(2)}
                {beat.tag && <span className="ml-2 bg-brand-gold/20 text-brand-gold text-xs px-1.5 py-0.5 rounded">{beat.tag}</span>}
                {!active && <span className="ml-2 bg-red-900/30 text-red-400 text-xs px-1.5 py-0.5 rounded">HIDDEN</span>}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="text-brand-green text-xs tracking-wider hover:brightness-110 disabled:opacity-50">{saving ? "..." : "SAVE"}</button>
              <button onClick={() => setEditing(false)} className="text-brand-muted text-xs tracking-wider hover:text-gray-400">CANCEL</button>
            </>
          ) : (
            <>
              <button onClick={handleToggleActive} className="text-brand-muted text-xs tracking-wider hover:text-white">{active ? "HIDE" : "SHOW"}</button>
              <button onClick={() => setEditing(true)} className="text-brand-gold text-xs tracking-wider hover:brightness-110">EDIT</button>
              <button onClick={handleDelete} disabled={deleting} className="text-red-400 text-xs tracking-wider hover:text-red-300 disabled:opacity-50">{deleting ? "..." : "DELETE"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}