import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const { data: session } = await auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, motionId } = body as { type: string; motionId?: string };

  if (!type || (type === "motion" && !motionId)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Check for existing subscription
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      type,
      motionId: motionId ?? null,
    },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      type,
      motionId: motionId ?? null,
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}
