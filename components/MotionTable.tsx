"use client";

import { useState, useEffect, useCallback } from "react";
import { MotionFilters, Tier } from "./MotionFilters";
import { ScrapeButton, ScrapeAllButton } from "./ScrapeButton";
import { AddMotionModal } from "./AddMotionModal";
import { SubscribeButton } from "./SubscribeButton";
import { SubscribeAllButton } from "./SubscribeAllButton";

interface Activity {
  id: string;
  date: string;
  activity: string;
}

interface Motion {
  id: string;
  tier: string;
  program: string;
  councilFile: string | null;
  status: string | null;
  reportBackDue: string | null;
  lastScrapedAt: string | null;
  scrapedTitle: string | null;
  scrapedLastChanged: string | null;
  scrapedMover: string | null;
  scrapedSecond: string | null;
  originalMotionUrl: string | null;
  activities: Activity[];
}

interface MotionsResponse {
  motions: Motion[];
  total: number;
  page: number;
  pages: number;
}

const TIER_LABELS: Record<string, string> = {
  priority: "Priority",
  tier2: "Tier 2",
  passed: "Passed",
};

const CLERK_URL = (cf: string) =>
  `https://cityclerk.lacity.org/lacityclerkconnect/index.cfm?fa=ccfi.viewrecord&cfnumber=${encodeURIComponent(cf)}`;

function rowClass(reportBackDue: string | null): string {
  if (!reportBackDue) return "";
  const due = new Date(reportBackDue);
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (due < now) return "bg-red-50";
  if (due < sevenDays) return "bg-yellow-50";
  return "";
}

function fmt(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MotionTable() {
  const [tier, setTier] = useState<Tier>("all");
  const [search, setSearch] = useState("");
  const [needsAttention, setNeedsAttention] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MotionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMotion, setEditingMotion] = useState<Motion | null>(null);

  const fetchMotions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      tier,
      search,
      needsAttention: String(needsAttention),
      page: String(page),
    });
    const res = await fetch(`/api/motions?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [tier, search, needsAttention, page]);

  useEffect(() => {
    fetchMotions();
  }, [fetchMotions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [tier, search, needsAttention]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MotionFilters
          tier={tier}
          search={search}
          needsAttention={needsAttention}
          onTierChange={setTier}
          onSearchChange={setSearch}
          onNeedsAttentionChange={setNeedsAttention}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded font-medium text-sm bg-green-600 text-white hover:bg-green-700"
          >
            + Add Motion
          </button>
          <SubscribeAllButton />
          <ScrapeAllButton onDone={fetchMotions} />
        </div>
      </div>

      {data && (
        <p className="text-sm text-gray-500">
          {data.total} motion{data.total !== 1 ? "s" : ""}
          {data.pages > 1 && ` — page ${data.page} of ${data.pages}`}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Program</th>
              <th className="px-4 py-3 font-semibold">Council File</th>
              <th className="px-4 py-3 font-semibold">Tier</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Report Back Due</th>
              <th className="px-4 py-3 font-semibold">Last Scraped</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && data?.motions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No motions found.
                </td>
              </tr>
            )}
            {!loading &&
              data?.motions.map((motion) => (
                <>
                  <tr
                    key={motion.id}
                    onClick={() =>
                      setExpandedId(expandedId === motion.id ? null : motion.id)
                    }
                    className={`border-t border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${rowClass(motion.reportBackDue)}`}
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium">{motion.program}</div>
                      {motion.scrapedTitle && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {motion.scrapedTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {motion.councilFile ? (
                        <a
                          href={CLERK_URL(motion.councilFile)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline font-mono text-xs"
                        >
                          {motion.councilFile}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          motion.tier === "priority"
                            ? "bg-red-100 text-red-700"
                            : motion.tier === "tier2"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {TIER_LABELS[motion.tier] ?? motion.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                      {motion.status ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          motion.reportBackDue &&
                          new Date(motion.reportBackDue) < new Date()
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {fmt(motion.reportBackDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {fmt(motion.lastScrapedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMotion(motion);
                          }}
                          className="px-2 py-1 text-xs rounded font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <SubscribeButton motionId={motion.id} />
                        {motion.councilFile && (
                          <ScrapeButton
                            motionId={motion.id}
                            onDone={fetchMotions}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === motion.id && (
                    <tr key={`${motion.id}-expand`} className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
                            {motion.scrapedMover && (
                              <span>
                                <span className="font-semibold">Mover:</span>{" "}
                                {motion.scrapedMover}
                              </span>
                            )}
                            {motion.scrapedSecond && (
                              <span>
                                <span className="font-semibold">Second:</span>{" "}
                                {motion.scrapedSecond}
                              </span>
                            )}
                            {motion.scrapedLastChanged && (
                              <span>
                                <span className="font-semibold">Last Changed:</span>{" "}
                                {fmt(motion.scrapedLastChanged)}
                              </span>
                            )}
                            {motion.originalMotionUrl && (
                              <a
                                href={motion.originalMotionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Original Motion
                              </a>
                            )}
                          </div>

                          {motion.activities.length > 0 ? (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                                File Activity
                              </h4>
                              <ol className="space-y-1">
                                {motion.activities.map((a) => (
                                  <li key={a.id} className="flex gap-3 text-xs">
                                    <span className="text-gray-400 w-24 shrink-0">
                                      {fmt(a.date)}
                                    </span>
                                    <span className="text-gray-700">{a.activity}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              No activity data yet. Click Scrape to fetch.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-100"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            {page} / {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}

      {showAddModal && (
        <AddMotionModal
          onClose={() => setShowAddModal(false)}
          onSaved={fetchMotions}
        />
      )}

      {editingMotion && (
        <AddMotionModal
          initial={editingMotion}
          onClose={() => setEditingMotion(null)}
          onSaved={fetchMotions}
        />
      )}
    </div>
  );
}
