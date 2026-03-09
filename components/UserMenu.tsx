"use client";

import { authClient } from "@/lib/auth/client";

export function UserMenu({ displayName }: { displayName: string | null }) {
  const { data: session } = authClient.useSession();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-blue-200">
        {displayName ?? session?.user?.name ?? session?.user?.email ?? "User"}
      </span>
      <button
        onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })}
        className="text-xs px-3 py-1.5 rounded bg-blue-800 hover:bg-blue-700 text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
