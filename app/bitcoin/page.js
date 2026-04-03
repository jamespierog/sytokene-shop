"use client";

import Navbar from "@/components/Navbar";

export default function BitcoinPage() {
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
        <div className="text-center mb-12">
          <h1
            className="font-display text-3xl tracking-[6px] mb-2"
            style={{
              color: "#f39c12",
              textShadow: "0 0 15px rgba(243,156,18,0.3)",
            }}
          >
            BITCOIN TUTORIAL
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Everything you need to know to buy beats with Bitcoin Lightning.
            It takes about 2 minutes to set up.
          </p>
        </div>

        {/* Section 1: What is Lightning */}
        <Section color="#f39c12" title="WHAT IS BITCOIN LIGHTNING?">
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Bitcoin Lightning is a payment layer built on top of Bitcoin that makes transactions
            instant and nearly free. Regular Bitcoin transactions can take 10-60 minutes and cost
            a few dollars in fees. Lightning transactions settle in under 3 seconds and cost
            fractions of a penny.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            This shop uses Lightning because it&apos;s the fastest, cheapest, and most private way to
            accept payments online. No bank accounts, no credit cards, no payment processors.
            Just direct peer-to-peer value transfer.
          </p>
        </Section>

        {/* Section 2: Getting a Lightning wallet */}
        <Section color="#22d3ee" title="STEP 1: GET A LIGHTNING WALLET">
          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            You need a Lightning-enabled wallet to pay. Here are the easiest options, starting
            with the ones you might already have.
          </p>

          <WalletCard
            name="CashApp"
            description="If you already have CashApp, you already have Lightning. Tap the Bitcoin tab, tap 'Send', and scan the QR code. 58 million people can already pay this way."
            tag="ALREADY HAVE IT?"
            tagColor="#4ade80"
            link="https://cash.app"
          />
          <WalletCard
            name="Strike"
            description="Strike is built specifically for Lightning payments. It connects to your bank account so you can buy Bitcoin and spend it on Lightning instantly. Available in the US and many other countries."
            tag="EASIEST ON-RAMP"
            tagColor="#22d3ee"
            link="https://strike.me"
          />
          <WalletCard
            name="Wallet of Satoshi"
            description="The simplest Lightning wallet. Download, open, receive — no setup, no backups, no complexity. Available on iOS and Android. Great for getting started fast."
            tag="SIMPLEST"
            tagColor="#f39c12"
            link="https://www.walletofsatoshi.com"
          />
          <WalletCard
            name="Phoenix Wallet"
            description="Self-custodial Lightning wallet by the team behind the ACINQ Lightning node. You control your keys. Slightly more setup than Wallet of Satoshi, but you own your Bitcoin — nobody can freeze your funds."
            tag="SELF-CUSTODIAL"
            tagColor="#e879f9"
            link="https://phoenix.acinq.co"
          />
        </Section>

        {/* Section 3: Buying Bitcoin */}
        <Section color="#e879f9" title="STEP 2: GET SOME BITCOIN">
          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            If you don&apos;t have Bitcoin yet, here&apos;s how to get some onto your Lightning wallet.
            Most beats cost a few dollars, so you don&apos;t need much.
          </p>

          <ServiceCard
            name="Strike"
            description="Connect your bank account, buy Bitcoin, and it's instantly available on Lightning. Zero fees on purchases. This is the simplest fiat-to-Lightning path."
            tag="RECOMMENDED"
            tagColor="#4ade80"
            link="https://strike.me"
          />
          <ServiceCard
            name="CashApp"
            description="Buy Bitcoin in the CashApp Bitcoin tab, then send it to any Lightning address or invoice. You already have the app if you use it for anything else."
            tag="ALREADY ON YOUR PHONE"
            tagColor="#22d3ee"
            link="https://cash.app"
          />
          <ServiceCard
            name="River"
            description="US-based Bitcoin exchange with Lightning withdrawals. Buy Bitcoin, withdraw to your Lightning wallet. Low fees, clean interface."
            tag="EXCHANGE"
            tagColor="#f39c12"
            link="https://river.com"
          />
          <ServiceCard
            name="Kraken"
            description="Major global exchange that supports Lightning withdrawals. Buy Bitcoin with fiat (bank transfer, card), then withdraw directly to your Lightning wallet."
            tag="GLOBAL"
            tagColor="#e879f9"
            link="https://kraken.com"
          />
        </Section>

        {/* Section 4: Swapping to Lightning */}
        <Section color="#4ade80" title="ALREADY HAVE CRYPTO? SWAP TO LIGHTNING">
          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            If you have Bitcoin on-chain, Ethereum, USDT, or other crypto and want to convert it
            to Lightning, these swap services let you do it without creating an account.
          </p>

          <ServiceCard
            name="Boltz"
            description="Non-custodial swap service. Swap on-chain Bitcoin to Lightning (or vice versa) without any account or KYC. Atomic swaps mean neither side can steal your funds."
            tag="NO ACCOUNT NEEDED"
            tagColor="#4ade80"
            link="https://boltz.exchange"
          />
          <ServiceCard
            name="FixedFloat"
            description="Swap almost any cryptocurrency to Lightning Bitcoin. Supports ETH, USDT, LTC, and many others. No registration required for small amounts."
            tag="MULTI-CRYPTO"
            tagColor="#22d3ee"
            link="https://fixedfloat.com"
          />
          <ServiceCard
            name="SideShift"
            description="No-account crypto exchange that supports Lightning. Send any supported crypto and receive Lightning Bitcoin. Clean interface, fast swaps."
            tag="SIMPLE SWAPS"
            tagColor="#f39c12"
            link="https://sideshift.ai"
          />
          <ServiceCard
            name="Diamond Hands"
            description="Swap on-chain Bitcoin to Lightning with no account. Focused specifically on the Bitcoin-to-Lightning use case. Simple and reliable."
            tag="BTC TO LIGHTNING"
            tagColor="#e879f9"
            link="https://swap.diamondhands.technology"
          />
        </Section>

        {/* Section 5: How to buy a beat */}
        <Section color="#f39c12" title="HOW TO BUY A BEAT">
          <div className="space-y-4">
            <Step number="1" text="Browse the shop and find a beat or loop you like. Click it to preview." />
            <Step number="2" text="Click the 'BUY' button and enter your email (just for the download link)." />
            <Step number="3" text="You'll see a Lightning invoice with a QR code. Open your Lightning wallet." />
            <Step number="4" text="Scan the QR code with your wallet (or copy the invoice text if on mobile)." />
            <Step number="5" text="Confirm the payment in your wallet. It settles in 1-3 seconds." />
            <Step number="6" text="The file downloads automatically. That's it — the beat is yours." />
          </div>
          <div
            className="mt-6 p-4 text-center"
            style={{ background: "#0c0c10", border: "1px solid #1a1a1e" }}
          >
            <p className="text-gray-500 text-sm mb-3">Ready to go?</p>
            <a
              href="/"
              className="inline-block font-display text-sm tracking-[3px] px-6 py-2.5 text-white transition-all hover:brightness-125"
              style={{
                background: "#f39c12",
                boxShadow: "0 0 15px rgba(243,156,18,0.3)",
              }}
            >
              ⚡ GO TO SHOP
            </a>
          </div>
        </Section>
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

// ─── Reusable components ───

function Section({ color, title, children }) {
  return (
    <div className="mb-8 p-6" style={{ background: "#111114", border: "1px solid #1a1a1e" }}>
      <h2
        className="font-display text-lg tracking-[3px] mb-4"
        style={{ color }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function WalletCard({ name, description, tag, tagColor, link }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 mb-3 transition-all group"
      style={{ background: "#0c0c10", border: "1px solid #1a1a1e" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tagColor;
        e.currentTarget.style.boxShadow = `0 0 10px ${tagColor}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1a1a1e";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-display text-sm tracking-[2px] text-white">{name}</span>
        <span
          className="font-display text-[9px] tracking-wider px-1.5 py-0.5"
          style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44` }}
        >
          {tag}
        </span>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      <span className="text-gray-600 text-xs mt-2 block group-hover:text-gray-400 transition-colors">
        {link.replace("https://", "")} →
      </span>
    </a>
  );
}

function ServiceCard({ name, description, tag, tagColor, link }) {
  return <WalletCard name={name} description={description} tag={tag} tagColor={tagColor} link={link} />;
}

function Step({ number, text }) {
  return (
    <div className="flex gap-4 items-start">
      <div
        className="w-8 h-8 shrink-0 flex items-center justify-center font-display text-sm"
        style={{
          background: "#f39c1222",
          color: "#f39c12",
          border: "1px solid #f39c1244",
        }}
      >
        {number}
      </div>
      <p className="text-gray-400 text-sm leading-relaxed pt-1">{text}</p>
    </div>
  );
}