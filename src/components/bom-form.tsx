"use client";

import { useState } from "react";
import { createBom } from "@/app/actions/manufacturing";

type Product = { id: string; name: string };
type Component = { productId: string; quantity: number };

export function BomForm({ products, rawMaterials }: { products: Product[]; rawMaterials: Product[] }) {
  const [open, setOpen] = useState(false);
  const [components, setComponents] = useState<Component[]>([{ productId: "", quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  function update(i: number, patch: Partial<Component>) {
    setComponents((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function submit(formData: FormData) {
    const valid = components.filter((c) => c.productId && c.quantity > 0);
    if (valid.length === 0) return;
    setSaving(true);
    formData.set("components", JSON.stringify(valid));
    try {
      await createBom(formData);
      setComponents([{ productId: "", quantity: 1 }]);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        + Bill of Materials
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-12">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">New Bill of Materials</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form action={submit} className="space-y-4 px-5 py-5">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">BOM name</span>
                <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Finished product</span>
                  <select name="productId" required className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                    <option value="">Select…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Output qty per build</span>
                  <input name="outputQty" type="number" step="0.01" defaultValue="1" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
              </div>

              <p className="text-sm font-medium text-slate-700">Components</p>
              <div className="space-y-2">
                {components.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <select
                      value={c.productId}
                      onChange={(e) => update(i, { productId: e.target.value })}
                      className="col-span-8 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    >
                      <option value="">Select component…</option>
                      {rawMaterials.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                      type="number" step="0.01" placeholder="Qty" value={c.quantity}
                      onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })}
                      className="col-span-4 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                  </div>
                ))}
                <button type="button" onClick={() => setComponents((p) => [...p, { productId: "", quantity: 1 }])} className="text-sm font-medium text-blue-600 hover:underline">
                  + Add component
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving…" : "Create BOM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
