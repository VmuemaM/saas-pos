"use client";

import { useState } from "react";
import { createInvoice } from "@/app/actions/accounting";
import { formatMoney } from "@/lib/utils";

type Customer = { id: string; name: string };
type Item = { description: string; quantity: number; unitPrice: number };

export function InvoiceForm({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  function update(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function submit(formData: FormData) {
    const valid = items.filter((i) => i.description && i.quantity > 0);
    if (valid.length === 0) return;
    setSaving(true);
    formData.set("items", JSON.stringify(valid));
    formData.set("taxRate", String(taxRate));
    try {
      await createInvoice(formData);
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      setTaxRate(0);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        + Invoice
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-12">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">New Invoice</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form action={submit} className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Customer</span>
                  <select name="customerId" className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                    <option value="">— None —</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Issue date</span>
                  <input name="issueDate" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Due date</span>
                  <input name="dueDate" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>

              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input
                      placeholder="Description" value={it.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      className="col-span-6 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                    <input
                      type="number" step="0.01" placeholder="Qty" value={it.quantity}
                      onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })}
                      className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                    <input
                      type="number" step="0.01" placeholder="Unit price" value={it.unitPrice}
                      onChange={(e) => update(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="col-span-3 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                    <span className="col-span-1 flex items-center justify-end text-sm text-slate-500">{formatMoney(it.quantity * it.unitPrice)}</span>
                  </div>
                ))}
                <button type="button" onClick={() => setItems((p) => [...p, { description: "", quantity: 1, unitPrice: 0 }])} className="text-sm font-medium text-blue-600 hover:underline">
                  + Add item
                </button>
              </div>

              <div className="flex items-end justify-between gap-4">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Tax %</span>
                  <input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <div className="text-right text-sm">
                  <div className="text-slate-500">Subtotal: {formatMoney(subtotal)}</div>
                  <div className="text-slate-500">Tax: {formatMoney(tax)}</div>
                  <div className="text-lg font-bold text-slate-900">Total: {formatMoney(total)}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving…" : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
