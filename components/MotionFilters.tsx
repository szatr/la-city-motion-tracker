"use client";

export type Tier = "all" | "priority" | "tier2" | "passed";

interface MotionFiltersProps {
  tier: Tier;
  search: string;
  needsAttention: boolean;
  onTierChange: (t: Tier) => void;
  onSearchChange: (s: string) => void;
  onNeedsAttentionChange: (v: boolean) => void;
}

const TIERS: { value: Tier; label: string }[] = [
  { value: "all", label: "All" },
  { value: "priority", label: "Priority" },
  { value: "tier2", label: "Tier 2" },
  { value: "passed", label: "Passed" },
];

export function MotionFilters({
  tier,
  search,
  needsAttention,
  onTierChange,
  onSearchChange,
  onNeedsAttentionChange,
}: MotionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Tier tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        {TIERS.map((t) => (
          <button
            key={t.value}
            onClick={() => onTierChange(t.value)}
            className={`px-4 py-2 font-medium transition-colors ${
              tier === t.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search program, file, status…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Needs attention toggle */}
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={needsAttention}
          onChange={(e) => onNeedsAttentionChange(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        <span className="text-gray-700">Overdue report-back only</span>
      </label>
    </div>
  );
}
