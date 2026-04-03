"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "SHOP" },
  { href: "/about", label: "ABOUT ME" },
  { href: "/bitcoin", label: "BITCOIN TUTORIAL" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header style={{ background: "#050507" }}>
      {/* Top section — logo */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-3 flex items-center justify-between">
        <Link href="/" className="text-center flex-1">
          <h1
            className="font-display text-4xl tracking-[8px]"
            style={{
              color: "#f39c12",
              textShadow:
                "0 0 20px rgba(243,156,18,0.4), 0 0 60px rgba(243,156,18,0.15)",
            }}
          >
            SYTO SHOP
          </h1>
          <p className="font-display text-xs tracking-[6px] text-gray-600 mt-1">
            BEATS & LOOPS BY SYTOKENE
          </p>
        </Link>
        <a
          href="/admin"
          className="text-gray-700 text-xs hover:text-gray-500 transition-colors tracking-widest font-display absolute right-4 top-6"
        >
          ADMIN
        </a>
      </div>

      {/* Nav bar — the three tabs */}
      <nav
        className="border-b"
        style={{ borderColor: "#1a1a1e" }}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-0">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative py-3 px-5 font-display text-xs tracking-[3px] transition-all"
                style={{
                  color: isActive ? "#f39c12" : "#555",
                  textShadow: isActive
                    ? "0 0 10px rgba(243,156,18,0.4)"
                    : "none",
                }}
              >
                {item.label}
                {/* Active indicator — glowing underline */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-2 right-2 h-[2px]"
                    style={{
                      background: "#f39c12",
                      boxShadow: "0 0 8px rgba(243,156,18,0.6)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}