"use client";

import Navbar from "@/components/Navbar";

export default function AboutPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#050507",
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(243,156,18,0.03) 0%, transparent 50%)",
      }}
    >
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Profile section */}
        <div className="text-center mb-12">
          <div
            className="w-28 h-28 mx-auto mb-6 overflow-hidden"
            style={{
              border: "2px solid #f39c12",
              boxShadow: "0 0 20px rgba(243,156,18,0.2)",
            }}
          >
            {/* Replace this with an actual photo */}
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <span className="font-display text-4xl text-gray-700">S</span>
            </div>
          </div>
          <h1
            className="font-display text-3xl tracking-[6px] mb-2"
            style={{
              color: "#f39c12",
              textShadow: "0 0 15px rgba(243,156,18,0.3)",
            }}
          >
            SYTOKENE
          </h1>
          <p className="font-display text-sm tracking-[4px] text-gray-500">
            PRODUCER · BEATMAKER
          </p>
        </div>

        {/* Bio */}
        <div
          className="p-6 mb-8"
          style={{
            background: "#111114",
            border: "1px solid #1a1a1e",
          }}
        >
          <h2
            className="font-display text-lg tracking-[3px] mb-4"
            style={{ color: "#22d3ee" }}
          >
            ABOUT
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Producer and beatmaker crafting sounds at the intersection of trap, phonk, ambient, and
            experimental electronic music. Every beat is built from scratch — no presets, no loops
            from other producers, just original sound.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Based on the philosophy that music should be accessible to everyone, this shop runs
            entirely on Bitcoin Lightning. No middlemen, no payment processors taking a cut, no
            accounts to create. Just sounds and sats.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            All beats are sold as-is with full rights for personal and commercial use.
            If you use a beat in a release, a credit is appreciated but not required.
          </p>
        </div>

        {/* Links */}
        <div
          className="p-6 mb-8"
          style={{
            background: "#111114",
            border: "1px solid #1a1a1e",
          }}
        >
          <h2
            className="font-display text-lg tracking-[3px] mb-4"
            style={{ color: "#e879f9" }}
          >
            LINKS
          </h2>
          <div className="space-y-3">
            {[
              { label: "SOUNDCLOUD", url: "#", color: "#f39c12" },
              { label: "INSTAGRAM", url: "#", color: "#e879f9" },
              { label: "TWITTER / X", url: "#", color: "#22d3ee" },
              { label: "EMAIL", url: "mailto:sytokene@example.com", color: "#4ade80" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 transition-all group"
                style={{
                  border: "1px solid #1a1a1e",
                  background: "#0c0c10",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = link.color;
                  e.currentTarget.style.boxShadow = `0 0 10px ${link.color}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1a1a1e";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span
                  className="font-display text-sm tracking-[3px]"
                  style={{ color: link.color }}
                >
                  {link.label}
                </span>
                <span className="text-gray-600 group-hover:text-gray-400 transition-colors">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div
          className="p-6"
          style={{
            background: "#111114",
            border: "1px solid #1a1a1e",
          }}
        >
          <h2
            className="font-display text-lg tracking-[3px] mb-4"
            style={{ color: "#f39c12" }}
          >
            FAQ
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I use these beats commercially?",
                a: "Yes. Every purchase comes with full rights for personal and commercial use. No royalties, no splits.",
              },
              {
                q: "What format are the files?",
                a: "All beats and loops are delivered as high-quality audio files (WAV or MP3 depending on what was uploaded).",
              },
              {
                q: "I don't have Bitcoin. How do I pay?",
                a: "Check out the Bitcoin Tutorial page — it walks you through setting up a Lightning wallet in under 2 minutes. You can also use CashApp which has Lightning built in.",
              },
              {
                q: "Can I get a refund?",
                a: "Since these are digital downloads, all sales are final. Make sure to preview beats before purchasing.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <p className="text-gray-300 text-sm font-bold mb-1">{faq.q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12" style={{ borderColor: "#1a1a1e" }}>
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="font-display text-[10px] tracking-[4px] text-gray-700">
            PAY WITH BITCOIN ⚡ NO ACCOUNTS ⚡ NO DATA COLLECTED
          </p>
        </div>
      </footer>
    </div>
  );
}