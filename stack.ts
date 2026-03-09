import { StackServerApp } from "@stackframe/stack";

// Lazy initialization — avoids throwing at build time when env vars aren't set yet
let _app: StackServerApp<true, string> | undefined;

export function getStackServerApp(): StackServerApp<true, string> {
  if (!_app) {
    _app = new StackServerApp({
      tokenStore: "nextjs-cookie",
      urls: { signIn: "/handler/sign-in" },
    }) as StackServerApp<true, string>;
  }
  return _app;
}
