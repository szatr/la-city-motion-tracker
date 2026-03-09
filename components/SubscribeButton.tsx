"use client";

import { useState, useEffect } from "react";

interface Subscription {
  id: string;
  type: string;
  motionId: string | null;
}

export function SubscribeButton({ motionId }: { motionId: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((subs: Subscription[]) => {
        const existing = subs.find(
          (s) => s.type === "motion" && s.motionId === motionId
        );
        setSubscription(existing ?? null);
      })
      .finally(() => setLoading(false));
  }, [motionId]);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      if (subscription) {
        await fetch(`/api/subscriptions/${subscription.id}`, {
          method: "DELETE",
        });
        setSubscription(null);
      } else {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "motion", motionId }),
        });
        const sub = await res.json();
        setSubscription(sub);
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
