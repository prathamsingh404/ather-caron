import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LogicGuard } from "@/lib/logic-guard";
import { activityInputSchema } from "@/lib/activity-input";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    
    // Fetch the Aether-Carbon Ledger
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(activities);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET Activities Error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const payload = activityInputSchema.parse(body);

    // Call the Aether-Carbon Logic Guard for DEI and Optimization
    const optimization = await LogicGuard.getOptimization(payload.category, payload.subcategory, payload.value);
    const carbon_equivalent = optimization?.current_carbon_kg || 0;

    const activityDate = payload.date ? new Date(payload.date) : new Date();

    // The Aether-Carbon Ledger Write
    const result = await prisma.activity.create({
      data: {
        userId,
        category: payload.category,
        subcategory: payload.subcategory,
        raw_value: payload.value,
        unit: payload.unit,
        carbon_equivalent,
        source: payload.source || "MANUAL",
        date: activityDate,
        facility: payload.facility,
        optimization_recommendation: optimization?.recommendation,
        potential_savings_kg: optimization?.carbon_saved_kg,
      }
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST Activities Error:", error);
    return NextResponse.json({ error: "Failed to save activity" }, { status: 500 });
  }
}
