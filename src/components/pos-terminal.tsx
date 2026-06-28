"use client";

import { useMemo, useState } from "react";
import { createSale } from "@/app/actions/pos";
import { formatMoney } from "@/lib/utils";

type Product = { id: string; name: string; sku: string; price: number; stockQty: number; unit: string };
type Customer = { id: string; name: string };
type CartLine = { productId: string; name: string; quantity: number; unitPrice: number };

export function PosTerminal({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const subtotal = cart.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxedBase = Math.max(subtotal - discount, 0);
  const tax = (taxedBase * taxRate) / 100;
  const total = taxedBase + tax;

  function addToCart(p: Product) {
    setCart((prev) => {
      const found = prev.find((l) => l.productId === p.id);
      if (found) return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId: p.id, name: p.name, quantity: 1, unitPrice: p.price }];
    });
    setDone(null);
  }

  function setQty(productId: string, quantity: number) {
    setCart((prev) =>
      prev.flatMap((l) => (l.productId === productId ? (quantity <= 0 ? [] : [{ ...l, quantity }]) : [l])),
    );
  }

  async function checkout() {
    if (cart.length === 0) return;
    setSaving(true);
    const fd = new FormData();
    fd.set("items", JSON.stringify(cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice }))));
    fd.set("customerId", customerId);
    fd.set("paymentMethod", paymentMethod);
    fd.set("taxRate", String(taxRate));
    fd.set("discount", String(discount));
    try {
      await createSale(fd);
      setDone(formatMoney(total));
      setCart([]);
      setDiscount(0);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Product grid */}
      <div className="lg:col-span-2 flex flex-col rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-400">No products found.</p>}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="flex flex-col rounded-lg border border-slate-200 p-3 text-left transition hover:border-blue-400 hover:bg-blue-50"
            >
              <span className="line-clamp-2 text-sm font-medium text-slate-900">{p.name}</span>
              <span className="mt-1 text-xs text-slate-400">{p.sku}</span>
              <span className="mt-2 text-sm font-bold text-blue-600">{formatMoney(p.price)}</span>
              <span className="text-xs text-slate-400">{p.stockQty} {p.unit} in stock</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold text-slate-900">Current Sale</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Tap a product to add it.</p>}
          <ul className="space-y-2">
            {cart.map((l) => (
              <li key={l.productId} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{l.name}</p>
                  <p className="text-xs text-slate-400">{formatMoney(l.unitPrice)} each</p>
                </div>
                <input
                  type="number"
                  min={0}
                  value={l.quantity}
                  onChange={(e) => setQty(l.productId, parseFloat(e.target.value) || 0)}
                  className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <span className="w-20 text-right text-sm font-medium">{formatMoney(l.quantity * l.unitPrice)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 border-t border-slate-100 p-4">
          <div className="grid grid-cols-2 gap-2">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
              <option value="">Walk-in customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE">Mobile</option>
              <option value="BANK">Bank</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500">
              Discount
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-500">
              Tax %
              <input type="number" min={0} value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Discount</span><span>-{formatMoney(discount)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Tax</span><span>{formatMoney(tax)}</span></div>
            <div className="flex justify-between text-lg font-bold text-slate-900"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
          {done && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">Sale completed — {done}</p>}
          <button
            onClick={checkout}
            disabled={saving || cart.length === 0}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Processing…" : `Charge ${formatMoney(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
