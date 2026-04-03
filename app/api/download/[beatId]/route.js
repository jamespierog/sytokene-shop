import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// This endpoint is called by the success page after payment verification.
// Instead of generating a signed URL (which requires the Admin SDK's
// private key to work perfectly), we just return the public download URL
// that Firebase Storage generated when the admin uploaded the file.
// This URL is already stored in Firestore as `audioUrl`.
//
// This is simpler and more reliable. The audioUrl from Firebase Storage
// already includes an access token parameter that makes it work.

export async function GET(req, { params }) {
  const { beatId } = await params;

  if (!beatId) {
    return NextResponse.json({ error: "Missing beatId" }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    const beatDoc = await adminDb.collection("beats").doc(beatId).get();

    if (!beatDoc.exists) {
      return NextResponse.json({ error: "Beat not found" }, { status: 404 });
    }

    const beat = beatDoc.data();

    if (!beat.audioUrl) {
      return NextResponse.json(
        { error: "No audio file for this beat" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      downloadUrl: beat.audioUrl,
      title: beat.title,
      fileName: `${beat.title}.wav`,
    });
  } catch (err) {
    console.error("Download lookup failed:", err);
    return NextResponse.json(
      { error: "Failed to get download" },
      { status: 500 }
    );
  }
}