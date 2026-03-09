import { NextResponse } from "next/server";
import { getStackServerApp } from "@/stack";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getStackServerApp()?.getUser() ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
