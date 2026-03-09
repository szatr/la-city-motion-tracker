"use client";

import { useState } from "react";

interface MotionFormValues {
  id?: string;
  program?: string;
  councilFile?: string | null;
  tier?: string;
  status?: string | null;
  reportBackDue?: string | null;
  originalMotionUrl?: string | null;
}

interface AddMotionModalProps {
  initial?: MotionFormValues;
  onClose: () => void;
  onSaved: () => void;
}

const TIER_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "tier2", label: "Tier 2" },
  { value: "passed", label: "Passed" },
];

function toDateInput(val: string | null | undefined): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function AddMotionModal({ initial, onClose, onSaved }: AddMotionModalProps) {
  const isEdit = !!initial?.id;

  const [program, setProgram] = useState(initial?.program ?? "");
  const [councilFile, setCouncilFile] = useState(initial?.councilFile ?? "");
  const [tier, setTier] = useState(initial?.tier ?? "priority");
  const [status, setStatus] = useState(initial?.status ?? "");
  const [reportBackDue, setReportBackDue] = useState(toDateInput(initial?.reportBackDue));
  const [originalMotionUrl, setOriginalMotionUrl] = useState(initial?.originalMotionUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      program,
      councilFile,
      tier,
      status,
      reportBackDue: reportBackDue || null,
      originalMotionUrl,
    };

    const res = await fetch(
      isEdit ? `/api/motions/${initial!.id}` : "/api/motions",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Motion" : "Add Motion"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="e.g. Safe Parking Program"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Council File #
            </label>
            <input
              type="text"
              value={councilFile ?? ""}
              onChange={(e) => setCouncilFile(e.target.value)}
              placeholder="e.g. 24-0001"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Required to enable scraping from the City Clerk
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier <span className="text-red-500">*</span>
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <input
              type="text"
              value={status ?? ""}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="e.g. In Committee"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Back Due
            </label>
            <input
              type="date"
              value={reportBackDue}
              onChange={(e) => setReportBackDue(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Motion URL
            </label>
            <input
              type="url"
              value={originalMotionUrl ?? ""}
              onChange={(e) => setOriginalMotionUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Motion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
