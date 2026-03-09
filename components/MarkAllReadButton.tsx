"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 text-sm rounded font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {loading ? "Marking…" : "Mark all as read"}
    </button>
  );
}
