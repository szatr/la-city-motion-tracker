"use client";

import { useState } from "react";

interface ScrapeButtonProps {
  motionId: string;
  onDone?: () => void;
}

export function ScrapeButton({ motionId, onDone }: ScrapeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/scrape/${motionId}`, { method: "POST" });
      if (res.ok) {
        setStatus("ok");
        onDone?.();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
        loading
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : status === "ok"
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : status === "error"
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
      }`}
    >
      {loading ? "Scraping…" : status === "ok" ? "Done" : status === "error" ? "Error" : "Scrape"}
    </button>
  );
}

interface ScrapeAllButtonProps {
  onDone?: () => void;
}

export function ScrapeAllButton({ onDone }: ScrapeAllButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; failed: number; total: number } | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      setResult(data);
      onDone?.();
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
          loading
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {loading ? "Scraping all…" : "Scrape All"}
      </button>
      {result && (
        <span className="text-sm text-gray-600">
          {result.succeeded}/{result.total} succeeded
          {result.failed > 0 && (
            <span className="text-red-600 ml-1">({result.failed} failed)</span>
          )}
        </span>
      )}
    </div>
  );
}
