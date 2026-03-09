import { NextResponse } from "next/server";
import { getStackServerApp } from "@/stack";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const user = await getStackServerApp().getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const where = {
    userId: user.id,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { motion: { select: { program: true, councilFile: true } } },
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  });
}
