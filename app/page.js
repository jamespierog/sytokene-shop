"use client";

import { useCheckout } from "@moneydevkit/nextjs";
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, where, orderBy, getDocs, doc, setDoc,
} from "firebase/firestore";
import Navbar from "@/components/Navbar";


export default function ShopPage() {
  const { createCheckout, isLoading: checkoutLoading } = useCheckout();

  const [beats, setBeats] = useState([]);
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("browse");
  const [error, setError] = useState(null);

  // ─── Audio player state ───
  const [playingId, setPlayingId] = useState(null);
  const [playingItem, setPlayingItem] = useState(null); // full item data for the player bar
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressInterval = useRef(null);

  // Load saved email
  useEffect(() => {
    try {
      const saved = localStorage.getItem("syto_email");
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  // Fetch all active items
  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "beats"),
          where("active", "==", true),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBeats(all.filter((i) => i.type !== "loop"));
        setLoops(all.filter((i) => i.type === "loop"));
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Audio playback controls ───
  // Start a progress tracker when audio plays, clean up when it stops
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onPlay() {
      setIsPlaying(true);
      // Update progress every 250ms for smooth progress bar movement
      progressInterval.current = setInterval(() => {
        setCurrentTime(audio.currentTime);
      }, 250);
    }
    function onPause() {
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    }
    function onEnded() {
      setIsPlaying(false);
      setPlayingId(null);
      clearInterval(progressInterval.current);
    }
    function onLoadedMetadata() {
      setDuration(audio.duration);
      setCurrentTime(0);
    }

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      clearInterval(progressInterval.current);
    };
  }, []);

  function togglePlay(item) {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === item.id) {
      // Same track — toggle play/pause
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      return;
    }

    // Different track — load and play
    audio.src = item.previewUrl || item.audioUrl;
    audio.play();
    setPlayingId(item.id);
    setPlayingItem(item);
    setCurrentTime(0);
    setDuration(0);
  }

  // Seek to a position when clicking the progress bar
  function handleSeek(e) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  }

  // Format seconds as m:ss
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatPrice(item) {
    if (item.currency === "SAT") return `${item.price} sats`;
    return `$${(item.price / 100).toFixed(item.price % 100 === 0 ? 0 : 2)}`;
  }

  async function handleCheckout() {
    if (!email || !email.includes("@")) { setError("Enter a valid email"); return; }
    setStep("processing");
    setError(null);
    try { localStorage.setItem("syto_email", email); } catch {}
    try {
      setDoc(doc(db, "mailingList", email), {
        email, lastSeen: new Date().toISOString(),
      }, { merge: true }).catch(() => {});
    } catch {}

    try {
      const result = await createCheckout({
        type: "AMOUNT",
        title: selectedItem.title,
        description: `${selectedItem.type === "loop" ? "Loop" : "Beat"} by Sytokene — ${selectedItem.bpm} BPM`,
        amount: selectedItem.price,
        currency: selectedItem.currency || "USD",
        successUrl: "/checkout/success",
        customer: { email },
        metadata: { beatId: selectedItem.id, beatTitle: selectedItem.title, email },
      });
      if (result.error) { setError(result.error.message); setStep("email"); return; }
      window.location.href = result.data.checkoutUrl;
    } catch (err) {
      setError("Something went wrong. Try again.");
      setStep("email");
    }
  }

  function handleClose() {
    setSelectedItem(null);
    setStep("browse");
    setError(null);
  }

  // ─── Vending Machine Component ───
  function VendingMachine({ items, label, subtitle, accentColor, glowColor, emptyText }) {
    const isCyan = accentColor === "cyan";

    return (
      <div className="flex-1 min-w-[300px] max-w-[520px]">
        <div className="relative"
          style={{
            background: "#1a1a1e",
            border: `3px solid ${isCyan ? "#0e7490" : "#a21caf"}`,
            boxShadow: `0 0 20px ${glowColor}33, 0 0 60px ${glowColor}11, inset 0 0 30px rgba(0,0,0,0.5)`,
          }}>
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
            style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)" }} />

          {/* Header */}
          <div className="py-3 px-4 text-center border-b-2"
            style={{ borderColor: isCyan ? "#0e7490" : "#a21caf", background: `linear-gradient(180deg, ${glowColor}15 0%, transparent 100%)` }}>
            <h2 className="font-display text-2xl tracking-[6px]"
              style={{ color: isCyan ? "#22d3ee" : "#e879f9", textShadow: `0 0 10px ${glowColor}, 0 0 30px ${glowColor}88, 0 0 60px ${glowColor}44` }}>
              {label}
            </h2>
            <p className="font-display text-xs tracking-[4px] mt-0.5"
              style={{ color: isCyan ? "#06b6d4" : "#d946ef", opacity: 0.6 }}>
              {subtitle}
            </p>
          </div>

          {/* Product display */}
          <div className="m-2 p-3 min-h-[320px]"
            style={{ background: "#0c0c10", border: `1px solid ${isCyan ? "#164e63" : "#701a75"}` }}>
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[280px]">
                <p className="font-display text-sm tracking-widest animate-blink"
                  style={{ color: isCyan ? "#22d3ee" : "#e879f9" }}>LOADING...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[280px]">
                <p className="font-display text-sm tracking-widest text-gray-600">{emptyText}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <div key={item.id}
                    onClick={() => { setSelectedItem(item); setStep("preview"); }}
                    className="text-left group relative transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                    style={{ background: "#141418", border: `1px solid ${isCyan ? "#164e6366" : "#701a7566"}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = isCyan ? "#22d3ee" : "#e879f9"; e.currentTarget.style.boxShadow = `0 0 12px ${glowColor}44`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = isCyan ? "#164e6366" : "#701a7566"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div className="aspect-square bg-black/50 relative overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl opacity-10">{isCyan ? "🎵" : "🔁"}</span>
                        </div>
                      )}
                      {/* Now playing indicator */}
                      {playingId === item.id && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${glowColor}22` }}>
                          <div className="flex items-end gap-[2px] h-5">
                            {[1,2,3,4].map((i) => (
                              <div key={i} className="w-[3px] rounded-sm"
                                style={{
                                  background: isCyan ? "#22d3ee" : "#e879f9",
                                  height: isPlaying ? undefined : "3px",
                                  animation: isPlaying ? `eq ${0.3 + i * 0.15}s ease-in-out infinite alternate` : "none",
                                }} />
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Play button overlay on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePlay(item); }}
                          className="w-10 h-10 flex items-center justify-center text-white"
                          style={{ background: `${glowColor}cc` }}>
                          <span className="font-display text-sm">{playingId === item.id && isPlaying ? "⏸" : "▶"}</span>
                        </button>
                      </div>
                      {item.tag && (
                        <span className="absolute top-1 right-1 font-display text-[9px] px-1.5 py-0.5 tracking-wider"
                          style={{ background: isCyan ? "#22d3ee" : "#e879f9", color: "#0c0c10" }}>{item.tag}</span>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="font-display text-[11px] tracking-wider truncate"
                        style={{ color: isCyan ? "#a5f3fc" : "#f5d0fe" }}>{item.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-display text-[10px] text-gray-500">{item.bpm}bpm</span>
                        <span className="font-display text-[11px]" style={{ color: isCyan ? "#06b6d4" : "#d946ef" }}>{formatPrice(item)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom panel */}
          <div className="m-2 mt-0 p-3 flex items-center justify-between"
            style={{ background: "#111114", border: `1px solid ${isCyan ? "#164e6344" : "#701a7544"}` }}>
            <p className="font-display text-[10px] text-gray-500 tracking-[3px]">
              {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
            </p>
            <div className="font-display text-[10px] tracking-[3px] px-2 py-1"
              style={{ color: isCyan ? "#22d3ee" : "#e879f9", border: `1px solid ${isCyan ? "#164e63" : "#701a75"}`, textShadow: `0 0 8px ${glowColor}88` }}>
              ⚡ LIGHTNING
            </div>
          </div>

          <div className="flex justify-between px-4 pb-1">
            <div className="w-4 h-1.5 bg-gray-700" />
            <div className="w-4 h-1.5 bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───
  return (
    <div className="min-h-screen" style={{
      background: "#050507",
      backgroundImage: `radial-gradient(ellipse at 25% 20%, rgba(6,182,212,0.04) 0%, transparent 50%), radial-gradient(ellipse at 75% 20%, rgba(217,70,239,0.04) 0%, transparent 50%)`,
    }}>
      {/* Equalizer bar animation keyframes */}
      <style>{`
        @keyframes eq {
          0% { height: 3px; }
          100% { height: 16px; }
        }
      `}</style>

      <audio ref={audioRef} preload="none" />
      

      {/* Header */}
      <Navbar />

      {/* Two Vending Machines */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <VendingMachine items={beats} label="FOR ARTISTS" subtitle="READY-MADE BEATS"
            accentColor="cyan" glowColor="#06b6d4" emptyText="NO BEATS YET" />
          <VendingMachine items={loops} label="FOR PRODUCERS" subtitle="LOOPS & SAMPLES"
            accentColor="magenta" glowColor="#d946ef" emptyText="NO LOOPS YET" />
        </div>
      </main>

      {/* Footer — add padding-bottom when player bar is visible so content isn't hidden behind it */}
      <footer className="border-t border-gray-900 mt-8" style={{ paddingBottom: playingItem ? "72px" : "0" }}>
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="font-display text-[10px] tracking-[4px] text-gray-700">
            PAY WITH BITCOIN ⚡ NO ACCOUNTS ⚡ NO DATA COLLECTED
          </p>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════
          STICKY PLAYER BAR — appears when a track is loaded
          Sits at the bottom of the viewport, SoundCloud-style
          ═══════════════════════════════════════════════════════ */}
      {playingItem && (
        <div className="fixed bottom-0 left-0 right-0 z-40"
          style={{
            background: "linear-gradient(180deg, #111114 0%, #0a0a0c 100%)",
            borderTop: `1px solid ${playingItem.type === "loop" ? "#701a75" : "#164e63"}`,
            boxShadow: `0 -4px 30px rgba(0,0,0,0.5), 0 -1px 10px ${playingItem.type === "loop" ? "#d946ef15" : "#06b6d415"}`,
          }}>
          {/* Progress bar — clickable to seek */}
          <div className="h-1 w-full cursor-pointer group relative" onClick={handleSeek}
            style={{ background: "#1a1a1e" }}>
            {/* Buffered / total track background */}
            <div className="absolute inset-0 opacity-30"
              style={{ background: playingItem.type === "loop" ? "#701a75" : "#164e63" }} />
            {/* Current progress fill */}
            <div className="h-full transition-all duration-200 relative"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                background: playingItem.type === "loop" ? "#d946ef" : "#06b6d4",
                boxShadow: `0 0 8px ${playingItem.type === "loop" ? "#d946ef88" : "#06b6d488"}`,
              }}>
              {/* Glowing dot at the playhead position */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: playingItem.type === "loop" ? "#e879f9" : "#22d3ee",
                  boxShadow: `0 0 6px ${playingItem.type === "loop" ? "#d946ef" : "#06b6d4"}`,
                }} />
            </div>
          </div>

          {/* Player controls */}
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-4">
            {/* Cover art thumbnail */}
            <div className="w-11 h-11 shrink-0 overflow-hidden"
              style={{ border: `1px solid ${playingItem.type === "loop" ? "#701a7566" : "#164e6366"}` }}>
              {playingItem.imageUrl ? (
                <img src={playingItem.imageUrl} alt={playingItem.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/50">
                  <span className="text-lg opacity-20">{playingItem.type === "loop" ? "🔁" : "🎵"}</span>
                </div>
              )}
            </div>

            {/* Play/Pause button */}
            <button onClick={() => togglePlay(playingItem)}
              className="w-9 h-9 shrink-0 flex items-center justify-center text-white transition-all hover:brightness-125"
              style={{ background: playingItem.type === "loop" ? "#a21caf" : "#0e7490" }}>
              <span className="font-display text-sm">{isPlaying ? "⏸" : "▶"}</span>
            </button>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm tracking-widest truncate"
                style={{ color: playingItem.type === "loop" ? "#f5d0fe" : "#a5f3fc" }}>
                {playingItem.title}
              </p>
              <p className="font-display text-[10px] text-gray-500 tracking-wider">
                {playingItem.bpm} BPM
                {playingItem.genre ? ` · ${playingItem.genre}` : ""}
                <span className="ml-2" style={{ color: playingItem.type === "loop" ? "#d946ef66" : "#06b6d466" }}>
                  {(playingItem.type || "beat").toUpperCase()}
                </span>
              </p>
            </div>

            {/* Time display */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="font-display text-xs text-gray-500">{formatTime(currentTime)}</span>
              <span className="text-gray-700 text-xs">/</span>
              <span className="font-display text-xs text-gray-500">{formatTime(duration)}</span>
            </div>

            {/* Buy button right in the player bar */}
            <button
              onClick={() => { setSelectedItem(playingItem); setStep("preview"); }}
              className="hidden sm:block shrink-0 font-display text-[10px] tracking-[2px] px-3 py-1.5 text-white transition-all hover:brightness-125"
              style={{
                background: playingItem.type === "loop" ? "#a21caf" : "#0e7490",
                boxShadow: `0 0 10px ${playingItem.type === "loop" ? "#d946ef33" : "#06b6d433"}`,
              }}>
              ⚡ {formatPrice(playingItem)}
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal ─── */}
      {selectedItem && step !== "browse" && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{
              background: "#111114",
              border: `2px solid ${selectedItem.type === "loop" ? "#a21caf" : "#0e7490"}`,
              boxShadow: `0 0 40px ${selectedItem.type === "loop" ? "#d946ef22" : "#06b6d422"}`,
            }}>
            {/* Preview */}
            {step === "preview" && (
              <div>
                <div className="aspect-video bg-black relative overflow-hidden">
                  {selectedItem.imageUrl ? (
                    <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <span className="text-6xl opacity-10">{selectedItem.type === "loop" ? "🔁" : "🎵"}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-[10px] tracking-wider px-1.5 py-0.5"
                      style={{
                        background: selectedItem.type === "loop" ? "#d946ef22" : "#06b6d422",
                        color: selectedItem.type === "loop" ? "#e879f9" : "#22d3ee",
                        border: `1px solid ${selectedItem.type === "loop" ? "#a21caf" : "#0e7490"}`,
                      }}>
                      {(selectedItem.type || "BEAT").toUpperCase()}
                    </span>
                    {selectedItem.genre && (
                      <span className="font-display text-[10px] text-gray-500 tracking-wider">{selectedItem.genre}</span>
                    )}
                  </div>
                  <h2 className="font-display text-2xl tracking-[3px]"
                    style={{
                      color: selectedItem.type === "loop" ? "#f5d0fe" : "#a5f3fc",
                      textShadow: `0 0 10px ${selectedItem.type === "loop" ? "#d946ef44" : "#06b6d444"}`,
                    }}>
                    {selectedItem.title}
                  </h2>
                  <p className="text-gray-500 text-xs mt-1 font-display tracking-wider">
                    {selectedItem.bpm} BPM · {formatPrice(selectedItem)}
                  </p>
                  {selectedItem.description && <p className="text-gray-400 text-sm mt-3">{selectedItem.description}</p>}

                  {/* Audio preview */}
                  <div className="mt-4 bg-black/50 p-3 flex items-center gap-3" style={{ border: "1px solid #222" }}>
                    <button onClick={() => togglePlay(selectedItem)}
                      className="w-10 h-10 flex items-center justify-center text-white shrink-0 transition-colors"
                      style={{ background: selectedItem.type === "loop" ? "#a21caf" : "#0e7490" }}>
                      {playingId === selectedItem.id && isPlaying ? "⏸" : "▶"}
                    </button>
                    <div className="flex-1">
                      <p className="text-white text-sm truncate font-display tracking-wider">{selectedItem.title}</p>
                      <p className="text-gray-600 text-xs font-display">
                        {playingId === selectedItem.id && isPlaying ? "PLAYING" : "CLICK TO PREVIEW"}
                      </p>
                    </div>
                    {/* Mini time display in modal */}
                    {playingId === selectedItem.id && (
                      <span className="font-display text-xs text-gray-500 shrink-0">
                        {formatTime(currentTime)}
                      </span>
                    )}
                  </div>

                  <button onClick={() => setStep("email")}
                    className="w-full mt-5 py-3.5 font-display text-lg tracking-[3px] text-white transition-all hover:brightness-125"
                    style={{
                      background: selectedItem.type === "loop" ? "#a21caf" : "#0e7490",
                      boxShadow: `0 0 20px ${selectedItem.type === "loop" ? "#d946ef33" : "#06b6d433"}`,
                    }}>
                    ⚡ BUY FOR {formatPrice(selectedItem)}
                  </button>
                  <button onClick={handleClose}
                    className="w-full mt-2 py-2.5 font-display text-sm tracking-[2px] text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-600 transition-colors">
                    BACK
                  </button>
                </div>
              </div>
            )}

            {/* Email */}
            {step === "email" && (
              <div className="p-5">
                <h2 className="font-display text-xl tracking-[2px]"
                  style={{ color: selectedItem.type === "loop" ? "#e879f9" : "#22d3ee" }}>
                  ⚡ CHECKOUT
                </h2>
                <p className="text-gray-500 text-xs mt-1 mb-5 font-display tracking-wider">
                  {selectedItem.title} · {formatPrice(selectedItem)}
                </p>
                <label className="text-gray-400 text-xs block mb-1 font-display tracking-wider">EMAIL FOR DOWNLOAD LINK</label>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                  placeholder="your@email.com"
                  className="w-full bg-black/50 py-3 px-4 font-mono text-sm placeholder-gray-700 focus:outline-none transition-colors"
                  style={{
                    border: `1px solid ${selectedItem.type === "loop" ? "#701a75" : "#164e63"}`,
                    color: selectedItem.type === "loop" ? "#e879f9" : "#22d3ee",
                  }}
                  autoFocus />
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                <button onClick={handleCheckout} disabled={checkoutLoading}
                  className="w-full mt-4 py-3.5 font-display text-lg tracking-[3px] text-white transition-all hover:brightness-125 disabled:opacity-50"
                  style={{
                    background: selectedItem.type === "loop" ? "#a21caf" : "#0e7490",
                    boxShadow: `0 0 20px ${selectedItem.type === "loop" ? "#d946ef33" : "#06b6d433"}`,
                  }}>
                  {checkoutLoading ? "CREATING INVOICE..." : "⚡ PAY WITH LIGHTNING"}
                </button>
                <button onClick={handleClose}
                  className="w-full mt-2 py-2.5 font-display text-sm tracking-[2px] text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-600 transition-colors">
                  CANCEL
                </button>
              </div>
            )}

            {/* Processing */}
            {step === "processing" && (
              <div className="p-5 text-center py-12">
                <div className="text-4xl mb-4 animate-blink">⚡</div>
                <p className="font-display text-xl tracking-widest mb-2"
                  style={{ color: selectedItem.type === "loop" ? "#e879f9" : "#22d3ee" }}>
                  GENERATING INVOICE
                </p>
                <p className="text-gray-600 text-xs font-display">REDIRECTING TO LIGHTNING CHECKOUT...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}