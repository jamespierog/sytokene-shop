"use client";

import { useCheckoutSuccess } from "@moneydevkit/nextjs";
import { Suspense, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function SuccessContent() {
  const { isCheckoutPaidLoading, isCheckoutPaid, metadata } =
    useCheckoutSuccess();

  const [beatData, setBeatData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Fetch beat data from Firestore once payment is verified
  useEffect(() => {
    async function fetchBeat() {
      if (!isCheckoutPaid || !metadata?.beatId) return;

      try {
        const beatDoc = await getDoc(doc(db, "beats", metadata.beatId));

        if (!beatDoc.exists()) {
          setFetchError("Beat not found");
          return;
        }

        const beat = beatDoc.data();
        if (!beat.audioUrl) {
          setFetchError("No audio file available");
          return;
        }

        const ext = (beat.audioPath || "file.wav").split(".").pop() || "wav";
        const safeTitle = (beat.title || metadata.beatTitle || "Beat")
          .replace(/[^a-zA-Z0-9_\-\s]/g, "")
          .trim();

        setBeatData({
          audioUrl: beat.audioUrl,
          title: beat.title || metadata.beatTitle || "Beat",
          fileName: `${safeTitle}.${ext}`,
        });
      } catch (err) {
        console.error("Failed to fetch beat data:", err);
        setFetchError("Failed to load download. Try refreshing.");
      }
    }

    fetchBeat();
  }, [isCheckoutPaid, metadata?.beatId, metadata?.beatTitle]);

  // Download via the proxy route (same domain = no CORS)
  const handleDownload = useCallback(async () => {
    if (!beatData?.audioUrl) return;

    setDownloading(true);

    try {
      const proxyUrl =
        `/api/proxy-download?` +
        `url=${encodeURIComponent(beatData.audioUrl)}` +
        `&name=${encodeURIComponent(beatData.fileName)}`;

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = beatData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      setDownloaded(true);
    } catch (err) {
      console.error("Download error:", err);
      setFetchError("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  }, [beatData]);

  // Auto-start download
  useEffect(() => {
    if (beatData && !downloaded && !downloading && !fetchError) {
      handleDownload();
    }
  }, [beatData, downloaded, downloading, fetchError, handleDownload]);

  // ─── Loading ───
  if (isCheckoutPaidLoading || isCheckoutPaid === null) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 text-brand-gold animate-blink">⚡</div>
          <p className="font-display text-xl text-brand-green tracking-widest">
            VERIFYING PAYMENT...
          </p>
        </div>
      </div>
    );
  }

  // ─── Not paid ───
  if (!isCheckoutPaid) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">✕</div>
          <p className="font-display text-xl text-red-400 tracking-widest mb-4">
            PAYMENT NOT CONFIRMED
          </p>
          <p className="text-brand-muted text-sm mb-8">
            If you paid and are seeing this, wait a moment and refresh.
          </p>
          <a
            href="/"
            className="inline-block bg-brand-red text-white font-display text-lg px-8 py-3 rounded-lg tracking-widest hover:bg-red-600 transition-colors"
          >
            BACK TO SHOP
          </a>
        </div>
      </div>
    );
  }

  // ─── Paid ───
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="w-20 h-20 rounded-full bg-green-900/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-brand-green text-4xl font-display">✓</span>
        </div>

        <h1 className="font-display text-2xl text-brand-green tracking-[0.2em] mb-6">
          PAYMENT CONFIRMED
        </h1>

        <div className="bg-brand-surface rounded-xl p-6 mb-6 text-left border border-brand-border">
          <p className="text-brand-muted text-xs tracking-widest mb-2 font-display">
            YOUR DOWNLOAD
          </p>
          <p className="text-brand-gold text-xl tracking-widest mb-1 font-display">
            {beatData?.title || metadata?.beatTitle || "Beat"}
          </p>
          <p className="text-brand-muted text-sm">
            {beatData?.fileName || ".wav format"}
          </p>

          {fetchError ? (
            <div>
              <p className="text-red-400 text-sm mt-4">{fetchError}</p>
              {beatData && (
                <button
                  onClick={() => {
                    setFetchError(null);
                    setDownloaded(false);
                    handleDownload();
                  }}
                  className="block w-full mt-3 bg-brand-red text-white text-center font-display text-sm py-2.5 rounded-lg tracking-widest hover:bg-red-600 transition-colors"
                >
                  TRY AGAIN
                </button>
              )}
            </div>
          ) : downloading ? (
            <div className="mt-4 bg-brand-dark rounded-lg p-4 text-center">
              <div className="text-brand-gold animate-blink text-lg mb-1">
                ⬇
              </div>
              <p className="text-brand-muted text-sm">Downloading...</p>
            </div>
          ) : downloaded ? (
            <div>
              <div className="mt-4 bg-green-900/20 border border-green-900/30 rounded-lg p-4 text-center">
                <p className="text-brand-green text-sm">
                  ✓ Download started — check your Downloads folder
                </p>
              </div>
              <button
                onClick={() => {
                  setDownloaded(false);
                  handleDownload();
                }}
                className="block w-full mt-3 bg-brand-surface border border-brand-border text-brand-muted text-center font-display text-sm py-2.5 rounded-lg tracking-widest hover:text-white hover:border-gray-500 transition-colors"
              >
                ⬇ DOWNLOAD AGAIN
              </button>
            </div>
          ) : (
            <div className="mt-4 text-brand-muted text-sm animate-blink">
              Preparing download...
            </div>
          )}
        </div>

        <a
          href="/"
          className="text-brand-muted text-sm hover:text-gray-400 transition-colors tracking-widest"
        >
          ← BACK TO SHOP
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-dark flex items-center justify-center">
          <p className="text-brand-green font-display animate-blink">
            Loading...
          </p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}