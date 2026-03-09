import { StackServerApp } from "@stackframe/stack";

let _app: StackServerApp<true, string> | undefined;

// Returns null when NEXT_PUBLIC_STACK_PROJECT_ID is not configured,
// so the build succeeds without env vars (auth features are disabled).
export function getStackServerApp(): StackServerApp<true, string> | null {
  if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) return null;
  if (!_app) {
    _app = new StackServerApp({
      tokenStore: "nextjs-cookie",
      urls: { signIn: "/handler/sign-in" },
    }) as StackServerApp<true, string>;
  }
  return _app;
}
