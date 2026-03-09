import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { getStackServerApp } from "@/stack";
import { UserMenu } from "@/components/UserMenu";
import { prisma } from "@/lib/db";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LA City Motion Tracker",
  description: "Track LA City Council motions from the City Clerk Connect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const app = getStackServerApp();
  const inner = (
    <>
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {app ? (
          <StackProvider app={app}>
            <StackTheme>{inner}</StackTheme>
          </StackProvider>
        ) : (
          inner
        )}
      </body>
    </html>
  );
}

async function AppHeader() {
  const app = getStackServerApp();
  const user = app ? await app.getUser() : null;

  let unreadCount = 0;
  if (user) {
    unreadCount = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
  }

  return (
    <header className="bg-blue-900 text-white px-6 py-4 shadow">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            LA City Motion Tracker
          </h1>
          <p className="text-blue-200 text-sm mt-0.5">
            LA City Council motions — via City Clerk Connect
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <a
              href="/notifications"
              className="relative text-white hover:text-blue-200 transition-colors"
              title="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </a>
            <UserMenu displayName={user.displayName} />
          </div>
        )}
      </div>
    </header>
  );
}
