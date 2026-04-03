"use client";

import { useCheckout } from "@moneydevkit/nextjs";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

export default function ShopPage() {
  const { createCheckout, isLoading: checkoutLoading } = useCheckout();

  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [step, setStep] = useState("browse"); // browse | preview | processing
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  // Load beats from Firestore
  useEffect(() => {
    async function loadBeats() {
      try {
        const q = query(
          collection(db, "beats"),
          where("active", "==", true),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBeats(data);
      } catch (err) {
        console.error("Failed to load beats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBeats();
  }, []);

  // Audio preview playback
  function togglePlay(beat) {
    if (playingId === beat.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = beat.previewUrl || beat.audioUrl;
      audioRef.current.play();
      setPlayingId(beat.id);
    }
  }

  function formatPrice(beat) {
    if (beat.currency === "SAT") return `${beat.price} sats`;
    return `$${(beat.price / 100).toFixed(beat.price % 100 === 0 ? 0 : 2)}`;
  }

  // Go straight to Lightning checkout — no email, no personal data
  async function handleCheckout() {
    setStep("processing");
    setError(null);

    try {
      const result = await createCheckout({
        type: "AMOUNT",
        title: selectedBeat.title,
        description: `Beat by Sytokene — ${selectedBeat.bpm} BPM`,
        amount: selectedBeat.price,
        currency: selectedBeat.currency || "USD",
        successUrl: "/checkout/success",
        // Pass the beatId through metadata so the success page
        // knows which file to deliver after payment
        metadata: {
          beatId: selectedBeat.id,
          beatTitle: selectedBeat.title,
        },
      });

      if (result.error) {
        setError(result.error.message);
        setStep("preview");
        return;
      }

      // Redirect to MDK hosted checkout with the Lightning invoice
      window.location.href = result.data.checkoutUrl;
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Try again.");
      setStep("preview");
    }
  }

  function handleClose() {
    setSelectedBeat(null);
    setStep("browse");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        preload="none"
      />

      {/* Header */}
      <header className="border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-brand-gold tracking-[6px]">
              SYTO SHOP
            </h1>
            <p className="text-brand-muted text-xs tracking-widest mt-1">
              BEATS BY SYTOKENE — PAY WITH BITCOIN ⚡
            </p>
          </div>
          <a
            href="/admin"
            className="text-brand-muted text-xs hover:text-gray-400 transition-colors tracking-widest"
          >
            ADMIN
          </a>
        </div>
      </header>

      {/* Beat Grid */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <p className="font-display text-xl text-brand-muted tracking-widest animate-blink">
              LOADING BEATS...
            </p>
          </div>
        ) : beats.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-brand-muted tracking-widest mb-4">
              NO BEATS YET
            </p>
            <p className="text-brand-muted text-sm">
              The producer hasn&apos;t uploaded any beats yet.
              <br />
              <a href="/admin" className="text-brand-gold hover:underline">
                Go to admin
              </a>{" "}
              to add some.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beats.map((beat) => (
              <div
                key={beat.id}
                className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden hover:border-brand-gold/30 transition-colors group cursor-pointer"
                onClick={() => {
                  setSelectedBeat(beat);
                  setStep("preview");
                }}
              >
                {/* Cover image */}
                <div className="aspect-square bg-brand-panel relative overflow-hidden">
                  {beat.imageUrl ? (
                    <img
                      src={beat.imageUrl}
                      alt={beat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-20">🎵</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay(beat);
                    }}
                    className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-brand-dark/80 backdrop-blur flex items-center justify-center text-white hover:bg-brand-red transition-colors"
                  >
                    <span className="text-lg">
                      {playingId === beat.id ? "⏸" : "▶"}
                    </span>
                  </button>
                  {beat.tag && (
                    <span className="absolute top-3 left-3 bg-brand-gold text-brand-dark text-xs font-display px-2 py-0.5 rounded tracking-wider">
                      {beat.tag}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg text-white tracking-widest truncate">
                    {beat.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-brand-muted text-xs tracking-wider">
                      {beat.bpm} BPM
                      {beat.genre ? ` · ${beat.genre}` : ""}
                    </span>
                    <span className="font-display text-brand-red text-lg">
                      {formatPrice(beat)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-brand-muted text-xs tracking-widest">
            POWERED BY BITCOIN LIGHTNING ⚡ NO ACCOUNTS. NO DATA COLLECTED.
          </p>
        </div>
      </footer>

      {/* Modal */}
      {selectedBeat && step !== "browse" && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-brand-panel border border-brand-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Preview */}
            {step === "preview" && (
              <div>
                <div className="aspect-video bg-brand-dark relative overflow-hidden rounded-t-xl">
                  {selectedBeat.imageUrl ? (
                    <img
                      src={selectedBeat.imageUrl}
                      alt={selectedBeat.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-20">🎵</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="font-display text-2xl text-brand-gold tracking-[3px]">
                    {selectedBeat.title}
                  </h2>
                  <p className="text-brand-muted text-xs mt-1 tracking-wider">
                    {selectedBeat.bpm} BPM
                    {selectedBeat.genre ? ` · ${selectedBeat.genre}` : ""} ·{" "}
                    {formatPrice(selectedBeat)}
                  </p>

                  {selectedBeat.description && (
                    <p className="text-gray-400 text-sm mt-3">
                      {selectedBeat.description}
                    </p>
                  )}

                  {/* Audio preview */}
                  <div className="mt-4 bg-brand-dark rounded-lg p-3 flex items-center gap-3">
                    <button
                      onClick={() => togglePlay(selectedBeat)}
                      className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white shrink-0 hover:bg-red-600 transition-colors"
                    >
                      {playingId === selectedBeat.id ? "⏸" : "▶"}
                    </button>
                    <div className="flex-1">
                      <p className="text-white text-sm truncate">
                        {selectedBeat.title}
                      </p>
                      <p className="text-brand-muted text-xs">
                        Click to{" "}
                        {playingId === selectedBeat.id ? "pause" : "preview"}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-xs mt-3">{error}</p>
                  )}

                  {/* Buy button — goes straight to Lightning checkout */}
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full mt-5 bg-brand-red text-white font-display text-lg py-3.5 rounded-lg tracking-[3px] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading
                      ? "CREATING INVOICE..."
                      : `⚡ BUY FOR ${formatPrice(selectedBeat)}`}
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full mt-2 border border-brand-border text-brand-muted font-display text-sm py-2.5 rounded-lg tracking-[2px] hover:text-gray-400 hover:border-gray-600 transition-colors"
                  >
                    BACK
                  </button>
                </div>
              </div>
            )}

            {/* Processing */}
            {step === "processing" && (
              <div className="p-5 text-center py-12">
                <div className="text-4xl mb-4 animate-blink">⚡</div>
                <p className="font-display text-xl text-brand-gold tracking-widest mb-2">
                  GENERATING INVOICE
                </p>
                <p className="text-brand-muted text-xs">
                  Redirecting to Lightning checkout...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}