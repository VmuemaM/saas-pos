"use client";

import { useState } from "react";
import { createJournalEntry } from "@/app/actions/accounting";
import { formatMoney } from "@/lib/utils";

type Account = { id: string; code: string; name: string };
type Line = { accountId: string; debit: number; credit: number };

export function JournalForm({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { accountId: "", debit: 0, credit: 0 },
    { accountId: "", debit: 0, credit: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = totalDebit === totalCredit && totalDebit > 0;

  function update(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function reset() {
    setLines([{ accountId: "", debit: 0, credit: 0 }, { accountId: "", debit: 0, credit: 0 }]);
  }

  async function submit(formData: FormData) {
    if (!balanced) return;
    setSaving(true);
    formData.set("lines", JSON.stringify(lines.filter((l) => l.accountId && (l.debit > 0 || l.credit > 0))));
    try {
      await createJournalEntry(formData);
      reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        + Journal Entry
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-12">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">New Journal Entry</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form action={submit} className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Date</span>
                  <input name="date" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Reference</span>
                  <input name="reference" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Description</span>
                <input name="description" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>

              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <select
                      value={l.accountId}
                      onChange={(e) => update(i, { accountId: e.target.value })}
                      className="col-span-6 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    >
                      <option value="">Select account…</option>
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                    </select>
                    <input
                      type="number" step="0.01" placeholder="Debit" value={l.debit || ""}
                      onChange={(e) => update(i, { debit: parseFloat(e.target.value) || 0, credit: 0 })}
                      className="col-span-3 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                    <input
                      type="number" step="0.01" placeholder="Credit" value={l.credit || ""}
                      onChange={(e) => update(i, { credit: parseFloat(e.target.value) || 0, debit: 0 })}
                      className="col-span-3 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => setLines((p) => [...p, { accountId: "", debit: 0, credit: 0 }])} className="text-sm font-medium text-blue-600 hover:underline">
                  + Add line
                </button>
              </div>

              <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-500">Debits: <strong>{formatMoney(totalDebit)}</strong> · Credits: <strong>{formatMoney(totalCredit)}</strong></span>
                <span className={balanced ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                  {balanced ? "Balanced" : "Not balanced"}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={!balanced || saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving…" : "Post Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
