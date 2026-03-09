import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    // .+ instead of .* so the root / is not matched (public read-only view)
    // api/motions excluded so anonymous users can load the table data
    "/((?!auth/|api/auth/|api/cron/|api/motions|_next/static|_next/image|favicon.ico).+)",
  ],
};
