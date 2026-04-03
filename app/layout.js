import "./globals.css";

export const metadata = {
  title: "SYTO SHOP — Beats by Sytokene",
  description:
    "Buy beats and sound kits from Sytokene. Pay with Bitcoin Lightning. No accounts needed.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-mono antialiased min-h-screen">{children}</body>
    </html>
  );
}
