export interface OCRResult {
  activities: Array<{
    name: string;
    category: "TRANSPORT" | "ENERGY" | "FOOD" | "WASTE" | "SHOPPING" | "WATER";
    subcategory: string;
    value: number;
    unit: string;
    carbon_equivalent: number;
    insight_hint?: string;
  }>;
}

export async function parseReceiptOCR(base64Image: string): Promise<OCRResult | null> {
  try {
    const imageDataUrl = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await fetch("/api/ocr-scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageDataUrl }),
    });

    if (!response.ok) {
      throw new Error("Failed to process receipt");
    }

    const content = await response.json();
    if (Array.isArray(content.activities)) {
      return { activities: content.activities };
    }
  } catch (error) {
    console.error("Neural OCR Error:", error);
  }

  return null;
}
