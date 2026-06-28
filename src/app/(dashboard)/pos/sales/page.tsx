import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader } from "@/components/ui";
import { formatMoney, formatDateTime } from "@/lib/utils";

export default async function SalesPage() {
  const { organizationId } = await requireSession();
  const sales = await prisma.sale.findMany({
    where: { organizationId },
    include: { customer: true, cashier: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = sales.reduce((s, x) => s + x.total, 0);

  return (
    <div>
      <PageHeader title="Sales" subtitle={`${sales.length} transactions · ${formatMoney(total)} total`} />
      <Card>
        <Table head={<tr><Th>Receipt</Th><Th>Customer</Th><Th>Cashier</Th><Th>Payment</Th><Th className="text-right">Items</Th><Th className="text-right">Total</Th><Th>When</Th></tr>}>
          {sales.length === 0 && <EmptyRow colSpan={7} message="No sales yet. Use the POS terminal to record a sale." />}
          {sales.map((s) => (
            <tr key={s.id}>
              <Td className="font-medium text-slate-900">{s.number}</Td>
              <Td>{s.customer?.name ?? "Walk-in"}</Td>
              <Td className="text-slate-500">{s.cashier?.name ?? "—"}</Td>
              <Td><Badge tone="blue">{s.paymentMethod.toLowerCase()}</Badge></Td>
              <Td className="text-right">{s.items.length}</Td>
              <Td className="text-right font-medium">{formatMoney(s.total)}</Td>
              <Td className="text-slate-500">{formatDateTime(s.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
