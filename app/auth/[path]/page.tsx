import { AuthView } from "@neondatabase/auth/react";

export const dynamicParams = false;

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <AuthView path={path} />
    </main>
  );
}
