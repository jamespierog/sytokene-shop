import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";

// Never pre-render this route at build time
export const dynamic = "force-dynamic";

const secret = process.env.MDK_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
  };

  // Verify webhook signature
  const wh = new Webhook(secret);
  let payload;
  try {
    payload = wh.verify(body, headers);
  } catch {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { type, data } = payload;

  if (type === "checkout.completed") {
    const email = data.customer?.email || data.metadata?.email;
    const beatId = data.metadata?.beatId;
    const beatTitle = data.metadata?.beatTitle;

    console.log("=== PAYMENT CONFIRMED ===");
    console.log("Customer:", email);
    console.log("Beat:", beatTitle, "(", beatId, ")");
    console.log("Amount:", data.amountSats, "sats");

    if (beatId && email) {
      try {
        const adminDb = getAdminDb();
        const adminStorage = getAdminStorage();

        const beatDoc = await adminDb.collection("beats").doc(beatId).get();
        if (beatDoc.exists) {
          const beat = beatDoc.data();
          const bucket = adminStorage.bucket();
          const audioPath = beat.audioPath;
          const file = bucket.file(audioPath);

          const [downloadUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 24 * 60 * 60 * 1000,
          });

          // Send download email if SMTP is configured
          if (process.env.SMTP_HOST) {
            await sendDownloadEmail(email, beatTitle, downloadUrl);
            console.log("Download email sent to:", email);
          } else {
            console.log("SMTP not configured — download URL:", downloadUrl);
          }

          // Record sale in Firestore
          await adminDb.collection("sales").add({
            beatId,
            beatTitle,
            email,
            amountSats: data.amountSats,
            downloadUrl,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Error processing download:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function sendDownloadEmail(email, beatTitle, downloadUrl) {
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Your download: ${beatTitle} — SYTO SHOP`,
    html: `
      <div style="font-family: monospace; background: #0a0a0a; color: #e0e0e0; padding: 40px; max-width: 500px;">
        <h1 style="color: #f39c12; font-size: 24px; letter-spacing: 3px;">SYTO SHOP</h1>
        <p style="color: #666; font-size: 14px;">Payment confirmed ⚡</p>
        <div style="background: #1c1c1c; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; margin: 0 0 8px;">YOUR DOWNLOAD</p>
          <p style="color: #f39c12; font-size: 18px; margin: 0 0 4px;">${beatTitle}</p>
          <p style="color: #666; font-size: 12px; margin: 0;">.wav format</p>
        </div>
        <a href="${downloadUrl}"
           style="display: block; background: #c0392b; color: white; text-align: center;
                  padding: 14px; border-radius: 8px; text-decoration: none; font-size: 16px;
                  letter-spacing: 2px;">
          DOWNLOAD
        </a>
        <p style="color: #444; font-size: 11px; margin-top: 20px;">
          This link expires in 24 hours.
        </p>
      </div>
    `,
  });
}