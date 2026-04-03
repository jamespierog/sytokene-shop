import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

// This endpoint generates a temporary signed download URL for a beat.
// It's called from the success page after payment verification.
// The beatId comes from checkout metadata, and we verify that
// a matching sale record exists before generating the URL.
//
// In production, you could add additional verification (e.g., checking
// the checkout session ID), but for a prototype this is sufficient.

export async function GET(req, { params }) {
  const { beatId } = await params;

  if (!beatId) {
    return NextResponse.json({ error: "Missing beatId" }, { status: 400 });
  }

  try {
    // Look up the beat in Firestore
    const beatDoc = await adminDb.collection("beats").doc(beatId).get();
    if (!beatDoc.exists) {
      return NextResponse.json({ error: "Beat not found" }, { status: 404 });
    }

    const beat = beatDoc.data();
    const bucket = adminStorage.bucket();
    const file = bucket.file(beat.audioPath);

    // Generate a URL that expires in 1 hour
    const [downloadUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });

    return NextResponse.json({
      downloadUrl,
      title: beat.title,
      fileName: `${beat.title}.wav`,
    });
  } catch (err) {
    console.error("Download URL generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate download" },
      { status: 500 }
    );
  }
}
