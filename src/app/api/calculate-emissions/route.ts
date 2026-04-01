import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePersonalizedInsight } from "@/lib/ai";
import { buildDashboardSnapshot } from "@/lib/dashboard-data";
import { requireCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    const snapshot = buildDashboardSnapshot(user, activities);
    const insight = await generatePersonalizedInsight(snapshot);

    return NextResponse.json({
      ...snapshot,
      aiInsight: insight.insight,
      aiSource: insight.source,
    });
  } catch (error) {
    console.error("GET Calculate Emissions Error:", error);
    return NextResponse.json({ error: "Failed to calculate emissions summary" }, { status: 500 });
  }
}
