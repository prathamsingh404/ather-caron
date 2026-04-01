import { NextResponse } from "next/server";
import { extractReceiptActivities } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json({ error: "imageDataUrl is required" }, { status: 400 });
    }

    const result = await extractReceiptActivities(imageDataUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST OCR Scan Error:", error);
    return NextResponse.json({ error: "Failed to scan receipt" }, { status: 500 });
  }
}
