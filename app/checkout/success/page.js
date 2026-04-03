"use client";

import { useCheckoutSuccess } from "@moneydevkit/nextjs";
import { Suspense, useState, useEffect } from "react";

function SuccessContent() {
  // useCheckoutSuccess() cryptographically verifies with MoneyDevKit
  // that the checkout was actually paid. This prevents someone from
  // just navigating to /checkout/success to get a free download.
  const { isCheckoutPaidLoading, isCheckoutPaid, metadata } =
    useCheckoutSuccess();
  const [downloadData, setDownloadData] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Once payment is verified, fetch the signed download URL
  // from our API route. This generates a temporary link to the
  // actual .wav file in Firebase Cloud Storage.
  useEffect(() => {
    if (isCheckoutPaid && metadata?.beatId) {
      fetch(`/api/download/${metadata.beatId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) setDownloadError(data.error);
          else setDownloadData(data);
        })
        .catch(() => setDownloadError("Failed to generate download link"));
    }
  }, [isCheckoutPaid, metadata?.beatId]);

  // ─── Loading: verifying payment with MDK ───
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

  // ─── Payment confirmed — show download ───
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
            Download link also sent to {metadata.email}
          </p>
        )}

        {/* Download card */}
        <div className="bg-brand-surface rounded-xl p-6 mb-6 text-left border border-brand-border">
          <p className="text-brand-muted text-xs tracking-widest mb-2 font-display">
            YOUR DOWNLOAD
          </p>
          <p className="text-brand-gold text-xl tracking-widest mb-1 font-display">
            {metadata?.beatTitle || "Beat"}
          </p>
          <p className="text-brand-muted text-sm">.wav format</p>

          {downloadData ? (
            <a
              href={downloadData.downloadUrl}
              download={downloadData.fileName}
              className="block mt-4 bg-brand-green text-brand-dark text-center font-display text-lg py-3 rounded-lg tracking-widest hover:brightness-110 transition-all"
            >
              ⬇ DOWNLOAD
            </a>
          ) : downloadError ? (
            <p className="text-red-400 text-sm mt-4">{downloadError}</p>
          ) : (
            <div className="mt-4 text-brand-muted text-sm animate-blink">
              Generating download link...
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
