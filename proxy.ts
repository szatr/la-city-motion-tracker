import { getStackServerApp } from "@/stack";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow handler routes (sign-in/sign-up) and cron API
  if (
    pathname.startsWith("/handler") ||
    pathname.startsWith("/api/cron")
  ) {
    return NextResponse.next();
  }

  const user = await getStackServerApp().getUser();
  if (!user) {
    const signInUrl = new URL("/handler/sign-in", request.url);
    signInUrl.searchParams.set("after_auth_return_to", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
