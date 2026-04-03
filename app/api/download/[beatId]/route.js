import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";

// Tell Next.js this route is always dynamic — never try to
// pre-render it at build time (which would trigger Firebase init)
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { beatId } = await params;

  if (!beatId) {
    return NextResponse.json({ error: "Missing beatId" }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    const adminStorage = getAdminStorage();

    const beatDoc = await adminDb.collection("beats").doc(beatId).get();
    if (!beatDoc.exists) {
      return NextResponse.json({ error: "Beat not found" }, { status: 404 });
    }

    const beat = beatDoc.data();
    const bucket = adminStorage.bucket();
    const file = bucket.file(beat.audioPath);

    const [downloadUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
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