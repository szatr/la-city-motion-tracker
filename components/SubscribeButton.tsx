"use client";

import { useState } from "react";

interface Subscription {
  id: string;
  type: string;
  motionId: string | null;
}

export function SubscribeButton({
  motionId,
  subscription: initialSub,
  onToggle,
}: {
  motionId: string;
  subscription: Subscription | null;
  onToggle: (sub: Subscription | null) => void;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(initialSub);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
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
          body: JSON.stringify({ type: "motion", motionId }),
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
      className={`px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
        subscription
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
      title={subscription ? "Unsubscribe from this motion" : "Subscribe to this motion"}
    >
      {loading ? "…" : subscription ? "Subscribed ✓" : "Subscribe"}
    </button>
  );
}
