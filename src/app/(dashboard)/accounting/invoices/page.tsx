import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/invoice-form";
import { setInvoiceStatus } from "@/app/actions/accounting";
import { formatMoney, formatDate } from "@/lib/utils";

const tone: Record<string, "slate" | "blue" | "green" | "red" | "amber"> = {
  DRAFT: "slate",
  SENT: "blue",
  PAID: "green",
  OVERDUE: "red",
  CANCELLED: "amber",
};

export default async function InvoicesPage() {
  const { organizationId } = await requireSession();
  const [invoices, customers] = await Promise.all([
    prisma.invoice.findMany({ where: { organizationId }, include: { customer: true, items: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const outstanding = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`Outstanding: ${formatMoney(outstanding)}`} action={<InvoiceForm customers={customers} />} />
      <Card>
        <Table head={<tr><Th>Number</Th><Th>Customer</Th><Th>Issued</Th><Th>Due</Th><Th className="text-right">Total</Th><Th>Status</Th><Th className="text-right">Action</Th></tr>}>
          {invoices.length === 0 && <EmptyRow colSpan={7} message="No invoices yet." />}
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <Td className="font-medium text-slate-900">{inv.number}</Td>
              <Td>{inv.customer?.name ?? "—"}</Td>
              <Td className="text-slate-500">{formatDate(inv.issueDate)}</Td>
              <Td className="text-slate-500">{formatDate(inv.dueDate)}</Td>
              <Td className="text-right font-medium">{formatMoney(inv.total)}</Td>
              <Td><Badge tone={tone[inv.status]}>{inv.status.toLowerCase()}</Badge></Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  {inv.status === "DRAFT" && (
                    <form action={setInvoiceStatus}>
                      <input type="hidden" name="id" value={inv.id} />
                      <input type="hidden" name="status" value="SENT" />
                      <button className="text-sm font-medium text-blue-600 hover:underline">Send</button>
                    </form>
                  )}
                  {(inv.status === "SENT" || inv.status === "OVERDUE") && (
                    <form action={setInvoiceStatus}>
                      <input type="hidden" name="id" value={inv.id} />
                      <input type="hidden" name="status" value="PAID" />
                      <button className="text-sm font-medium text-emerald-600 hover:underline">Mark paid</button>
                    </form>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
