import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChatReply } from "@/lib/ai";
import { buildDashboardSnapshot } from "@/lib/dashboard-data";
import { requireCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const user = await requireCurrentUser();
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });
    const snapshot = buildDashboardSnapshot(user, activities);
    const reply = await generateChatReply(messages, snapshot);

    return NextResponse.json(reply);
  } catch (error) {
    console.error("POST AI Chat Error:", error);
    return NextResponse.json({ error: "Failed to generate chat response" }, { status: 500 });
  }
}
