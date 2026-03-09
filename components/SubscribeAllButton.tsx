"use client";

import { useState } from "react";

interface Subscription {
  id: string;
  type: string;
  motionId: string | null;
}

export function SubscribeAllButton({
  subscription: initialSub,
  onToggle,
}: {
  subscription: Subscription | null;
  onToggle: (sub: Subscription | null) => void;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(initialSub);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (subscription) {
        await fetch(`/api/subscriptions/${subscription.id}`, { method: "DELETE" });
        setSubscription(null);
        onToggle(null);
      } else {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "all" }),
        });
        const sub = await res.json();
        setSubscription(sub);
        onToggle(sub);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-2 rounded font-medium text-sm transition-colors disabled:opacity-50 ${
        subscription
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {loading ? "…" : subscription ? "Subscribed to All ✓" : "Subscribe to All"}
    </button>
  );
}
