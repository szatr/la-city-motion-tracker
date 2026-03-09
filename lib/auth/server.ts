import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl =
  process.env.DATABASE_NEON_AUTH_BASE_URL ?? process.env.NEON_AUTH_BASE_URL;

if (!baseUrl) {
  throw new Error(
    "Missing NEON_AUTH_BASE_URL or DATABASE_NEON_AUTH_BASE_URL env var"
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
