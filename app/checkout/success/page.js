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

  // Fetch the beat data from Firestore once payment is verified
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

        setBeatData({
          audioUrl: beat.audioUrl,
          title: beat.title || metadata.beatTitle || "Beat",
        });
      } catch (err) {
        console.error("Failed to fetch beat data:", err);
        setFetchError("Failed to load download. Try refreshing.");
      }
    }

    fetchBeat();
  }, [isCheckoutPaid, metadata?.beatId, metadata?.beatTitle]);

  // This function fetches the actual audio file as a binary blob,
  // creates a temporary in-memory URL, and triggers the browser's
  // native download behavior. The Firebase Storage URL is used
  // internally to fetch the bytes but is never shown to the user
  // or exposed in the page source.
  const handleDownload = useCallback(async () => {
    if (!beatData?.audioUrl) return;

    setDownloading(true);

    try {
      // Fetch the file as a blob (binary data)
      const response = await fetch(beatData.audioUrl);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();

      // Figure out the file extension from the original URL
      // (it's stored as audio.mp3 or audio.wav in Cloud Storage)
      const urlPath = new URL(beatData.audioUrl).pathname;
      const originalExt = urlPath.split(".").pop()?.split("?")[0] || "wav";

      // Sanitize the title for use as a filename
      const safeTitle = beatData.title
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .trim();
      const fileName = `${safeTitle}.${originalExt}`;

      // Create a temporary object URL pointing to the blob in memory.
      // This URL only exists in this browser tab's memory — it's not
      // a real URL that can be shared or accessed by anyone else.
      const blobUrl = URL.createObjectURL(blob);

      // Create a hidden <a> element, set it to download the blob,
      // and programmatically click it to trigger the browser's
      // native "Save File" behavior.
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName; // This attribute forces download vs. navigation
      document.body.appendChild(link);
      link.click();

      // Clean up: remove the temporary element and revoke the blob URL
      // to free memory
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      setDownloaded(true);
    } catch (err) {
      console.error("Download error:", err);
      setFetchError("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  }, [beatData]);

  // Auto-start the download as soon as the beat data is loaded.
  // The user can also click the button manually if they need to
  // re-download or if the auto-download was blocked by the browser.
  useEffect(() => {
    if (beatData && !downloaded && !downloading) {
      handleDownload();
    }
  }, [beatData, downloaded, downloading, handleDownload]);

  // ─── Loading: verifying payment ───
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

  // ─── Payment NOT confirmed ───
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
            Lightning payments usually confirm in seconds.
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

  // ─── Payment confirmed ───
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="w-20 h-20 rounded-full bg-green-900/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-brand-green text-4xl font-display">✓</span>
        </div>

        <h1 className="font-display text-2xl text-brand-green tracking-[0.2em] mb-2">
          PAYMENT CONFIRMED
        </h1>

        {metadata?.email && (
          <p className="text-brand-muted text-sm mb-6">
            The file will also be sent to {metadata.email}
          </p>
        )}

        {/* Download card */}
        <div className="bg-brand-surface rounded-xl p-6 mb-6 text-left border border-brand-border">
          <p className="text-brand-muted text-xs tracking-widest mb-2 font-display">
            YOUR DOWNLOAD
          </p>
          <p className="text-brand-gold text-xl tracking-widest mb-1 font-display">
            {beatData?.title || metadata?.beatTitle || "Beat"}
          </p>
          <p className="text-brand-muted text-sm">.wav format</p>

          {fetchError ? (
            <p className="text-red-400 text-sm mt-4">{fetchError}</p>
          ) : downloading ? (
            <div className="mt-4 bg-brand-dark rounded-lg p-4 text-center">
              <div className="text-brand-gold animate-blink text-lg mb-1">⬇</div>
              <p className="text-brand-muted text-sm">Downloading...</p>
            </div>
          ) : downloaded ? (
            <div>
              <div className="mt-4 bg-green-900/20 border border-green-900/30 rounded-lg p-4 text-center">
                <p className="text-brand-green text-sm">
                  ✓ Download started — check your Downloads folder
                </p>
              </div>
              {/* Manual re-download button in case auto-download was blocked */}
              <button
                onClick={handleDownload}
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