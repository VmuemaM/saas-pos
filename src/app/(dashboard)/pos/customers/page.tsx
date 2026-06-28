import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, PageHeader, Input } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createCustomer } from "@/app/actions/pos";

export default async function CustomersPage() {
  const { organizationId } = await requireSession();
  const customers = await prisma.customer.findMany({
    where: { organizationId },
    include: { _count: { select: { sales: true, invoices: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Your customer directory."
        action={
          <ModalForm triggerLabel="Customer" title="New Customer" action={createCustomer}>
            <Input name="name" label="Name" required />
            <Input name="email" label="Email" type="email" />
            <Input name="phone" label="Phone" />
            <Input name="address" label="Address" />
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th className="text-right">Sales</Th><Th className="text-right">Invoices</Th></tr>}>
          {customers.length === 0 && <EmptyRow colSpan={5} message="No customers yet." />}
          {customers.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium text-slate-900">{c.name}</Td>
              <Td className="text-slate-500">{c.email ?? "—"}</Td>
              <Td className="text-slate-500">{c.phone ?? "—"}</Td>
              <Td className="text-right">{c._count.sales}</Td>
              <Td className="text-right">{c._count.invoices}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
