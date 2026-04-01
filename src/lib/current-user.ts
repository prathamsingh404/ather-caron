import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export async function requireCurrentUser() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

