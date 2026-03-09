import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription || subscription.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.subscription.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
