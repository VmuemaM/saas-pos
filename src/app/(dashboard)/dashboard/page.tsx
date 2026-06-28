import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, StatCard, Table, Th, Td, EmptyRow, Badge, PageHeader } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const { organizationId, name } = await requireSession();
  const where = { organizationId };

  const [
    salesAgg,
    salesCount,
    productCount,
    lowStock,
    employeeCount,
    openWorkOrders,
    unpaidInvoices,
    recentSales,
    pendingLeave,
  ] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { total: true } }),
    prisma.sale.count({ where }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: { organizationId, reorderLevel: { gt: 0 } } }),
    prisma.employee.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.workOrder.count({ where: { organizationId, status: { in: ["PLANNED", "IN_PROGRESS"] } } }),
    prisma.invoice.aggregate({ where: { organizationId, status: { in: ["SENT", "OVERDUE"] } }, _sum: { total: true } }),
    prisma.sale.findMany({ where, orderBy: { createdAt: "desc" }, take: 5, include: { customer: true } }),
    prisma.leaveRequest.count({ where: { organizationId, status: "PENDING" } }),
  ]);

  const lowStockItems = lowStock.filter((p) => p.stockQty <= p.reorderLevel);

  return (
    <div>
      <PageHeader title={`Welcome back, ${name.split(" ")[0]}`} subtitle="Here's what's happening across your business." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sales" value={formatMoney(salesAgg._sum.total ?? 0)} hint={`${salesCount} transactions`} tone="green" />
        <StatCard label="Products" value={String(productCount)} hint={`${lowStockItems.length} low on stock`} tone="blue" />
        <StatCard label="Active Employees" value={String(employeeCount)} hint={`${pendingLeave} pending leave requests`} />
        <StatCard label="Receivables" value={formatMoney(unpaidInvoices._sum.total ?? 0)} hint="Unpaid invoices" tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Sales" />
          <Table head={<tr><Th>Receipt</Th><Th>Customer</Th><Th>Date</Th><Th className="text-right">Total</Th></tr>}>
            {recentSales.length === 0 && <EmptyRow colSpan={4} message="No sales recorded yet." />}
            {recentSales.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium text-slate-900">{s.number}</Td>
                <Td>{s.customer?.name ?? "Walk-in"}</Td>
                <Td>{formatDate(s.createdAt)}</Td>
                <Td className="text-right font-medium">{formatMoney(s.total)}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Low Stock Alerts" />
          <Table head={<tr><Th>Product</Th><Th className="text-right">Qty</Th></tr>}>
            {lowStockItems.length === 0 && <EmptyRow colSpan={2} message="All stock levels healthy." />}
            {lowStockItems.slice(0, 8).map((p) => (
              <tr key={p.id}>
                <Td className="font-medium text-slate-900">{p.name}</Td>
                <Td className="text-right"><Badge tone="red">{p.stockQty} {p.unit}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/pos"><StatCard label="Open POS Terminal" value="→" hint="Ring up a sale" tone="blue" /></Link>
        <Link href="/manufacturing/work-orders"><StatCard label="Open Work Orders" value={String(openWorkOrders)} hint="In production" /></Link>
        <Link href="/hrm/payroll"><StatCard label="Run Payroll" value="→" hint="Process this period" /></Link>
        <Link href="/accounting/reports"><StatCard label="Financial Reports" value="→" hint="P&L, Balance Sheet" /></Link>
      </div>
    </div>
  );
}
