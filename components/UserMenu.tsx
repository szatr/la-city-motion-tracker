"use client";

import { useUser } from "@stackframe/stack";

export function UserMenu({ displayName }: { displayName: string | null }) {
  const user = useUser();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-blue-200">
        {displayName ?? user?.primaryEmail ?? "User"}
      </span>
      <button
        onClick={() => user?.signOut()}
        className="text-xs px-3 py-1.5 rounded bg-blue-800 hover:bg-blue-700 text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
