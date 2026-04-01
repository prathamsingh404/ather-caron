import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDashboardSnapshot } from "@/lib/dashboard-data";
import { generateAuditReport } from "@/lib/ai";
import { requireCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    if (activities.length === 0) {
      return NextResponse.json({
        markdown:
          "## No data yet\nStart logging transport, energy, food, waste, water, or shopping activity to generate a personalized report.",
        source: "fallback",
      });
    }

    const snapshot = buildDashboardSnapshot(user, activities);
    const report = await generateAuditReport(snapshot);

    return NextResponse.json(report);
  } catch (error) {
    console.error("POST Generate Report Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
