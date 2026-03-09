import { getStackServerApp } from "@/stack";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { MarkAllReadButton } from "@/components/MarkAllReadButton";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getStackServerApp()?.getUser() ?? null;
  if (!user) redirect("/handler/sign-in");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { motion: { select: { program: true, councilFile: true } } },
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Group by date
  const groups: Record<string, typeof notifications> = {};
  for (const n of notifications) {
    const key = n.createdAt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No notifications yet. Subscribe to motions to get notified of new activity.
        </div>
      ) : (
        Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {date}
            </h3>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-white shadow-sm">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex items-start gap-3 ${
                    !n.readAt ? "bg-blue-50" : ""
                  }`}
                >
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      n.readAt ? "bg-gray-300" : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.createdAt.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
