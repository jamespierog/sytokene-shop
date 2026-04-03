"use client";
import { Checkout } from "@moneydevkit/nextjs";
import { use } from "react";

// When a buyer clicks "Buy" on the storefront, they get redirected here.
// The <Checkout> component renders MoneyDevKit's hosted checkout UI,
// which shows the Lightning invoice QR code. The buyer scans it with
// any Lightning wallet (CashApp, Strike, Phoenix, etc.), and once
// payment clears, they're redirected to the success page.

export default function CheckoutPage({ params }) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Checkout id={id} />
      </div>
    </div>
  );
}
