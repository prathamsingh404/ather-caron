import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
      },
      select: { id: true },
    });

    await setSessionCookie(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
