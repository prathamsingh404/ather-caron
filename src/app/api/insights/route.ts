import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { buildDashboardSnapshot } from "@/lib/dashboard-data";
import { generatePersonalizedInsight } from "@/lib/ai";
import { requireCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    
    const insights = await prisma.aiInsight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(insights);
  } catch (error) {
    console.error("GET Insights Error:", error);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await req.json().catch(() => ({}));
    const user = await requireCurrentUser();
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });
    const snapshot = buildDashboardSnapshot(user, activities);
    const insight = await generatePersonalizedInsight(snapshot);

    return NextResponse.json(insight);
  } catch (error: unknown) {
    console.error('Groq AI Error (Insights):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
