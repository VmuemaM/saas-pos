import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { adjustInventory } from "@/app/actions/pos";
import { formatMoney, formatDateTime } from "@/lib/utils";

const moveTone: Record<string, "green" | "red" | "blue" | "amber" | "slate"> = {
  PURCHASE: "green",
  SALE: "red",
  ADJUSTMENT: "amber",
  PRODUCTION_IN: "green",
  PRODUCTION_OUT: "red",
};

export default async function InventoryPage() {
  const { organizationId } = await requireSession();
  const [products, movements, valuation] = await Promise.all([
    prisma.product.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.inventoryMovement.findMany({ where: { organizationId }, include: { product: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.product.findMany({ where: { organizationId }, select: { stockQty: true, cost: true } }),
  ]);

  const stockValue = valuation.reduce((s, p) => s + p.stockQty * p.cost, 0);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`Total stock valuation: ${formatMoney(stockValue)}`}
        action={
          <ModalForm triggerLabel="Stock Adjustment" title="Adjust Stock" action={adjustInventory}>
            <Select name="productId" label="Product" required>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (on hand: {p.stockQty})</option>
              ))}
            </Select>
            <Input name="quantity" label="Quantity (+ in / - out)" type="number" step="0.01" required />
            <Input name="note" label="Reason / note" placeholder="e.g. stock count correction" />
          </ModalForm>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Stock Levels" />
          <Table head={<tr><Th>Product</Th><Th className="text-right">On Hand</Th><Th className="text-right">Value</Th></tr>}>
            {products.length === 0 && <EmptyRow colSpan={3} />}
            {products.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium text-slate-900">{p.name}</Td>
                <Td className="text-right">
                  {p.stockQty <= p.reorderLevel && p.reorderLevel > 0
                    ? <Badge tone="red">{p.stockQty} {p.unit}</Badge>
                    : <span>{p.stockQty} {p.unit}</span>}
                </Td>
                <Td className="text-right">{formatMoney(p.stockQty * p.cost)}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Recent Movements" />
          <Table head={<tr><Th>Product</Th><Th>Type</Th><Th className="text-right">Qty</Th><Th>When</Th></tr>}>
            {movements.length === 0 && <EmptyRow colSpan={4} message="No stock movements yet." />}
            {movements.map((m) => (
              <tr key={m.id}>
                <Td className="font-medium text-slate-900">{m.product.name}</Td>
                <Td><Badge tone={moveTone[m.type]}>{m.type.replace("_", " ").toLowerCase()}</Badge></Td>
                <Td className="text-right">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</Td>
                <Td className="text-slate-500">{formatDateTime(m.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
