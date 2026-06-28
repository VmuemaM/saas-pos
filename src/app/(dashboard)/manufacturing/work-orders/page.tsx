import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select, Textarea } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createWorkOrder, setWorkOrderStatus } from "@/app/actions/manufacturing";
import { formatDate } from "@/lib/utils";

const tone: Record<string, "slate" | "blue" | "green" | "red"> = {
  PLANNED: "slate",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

export default async function WorkOrdersPage() {
  const { organizationId } = await requireSession();
  const [workOrders, boms] = await Promise.all([
    prisma.workOrder.findMany({ where: { organizationId }, include: { product: true, bom: true }, orderBy: { createdAt: "desc" } }),
    prisma.bom.findMany({ where: { organizationId }, include: { product: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Work Orders"
        subtitle="Plan and track production runs."
        action={
          <ModalForm triggerLabel="Work Order" title="New Work Order" action={createWorkOrder}>
            <Select name="bomId" label="Bill of Materials" required>
              <option value="">Select BOM…</option>
              {boms.map((b) => <option key={b.id} value={b.id}>{b.name} → {b.product.name}</option>)}
            </Select>
            <Input name="quantity" label="Quantity to produce" type="number" step="0.01" defaultValue="1" required />
            <div className="grid grid-cols-2 gap-3">
              <Input name="startDate" label="Start date" type="date" />
              <Input name="dueDate" label="Due date" type="date" />
            </div>
            <Textarea name="notes" label="Notes" rows={2} />
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Number</Th><Th>Product</Th><Th className="text-right">Qty</Th><Th>Due</Th><Th>Status</Th><Th className="text-right">Action</Th></tr>}>
          {workOrders.length === 0 && <EmptyRow colSpan={6} message="No work orders yet. Create a BOM first, then a work order." />}
          {workOrders.map((wo) => (
            <tr key={wo.id}>
              <Td className="font-medium text-slate-900">{wo.number}</Td>
              <Td>{wo.product.name}</Td>
              <Td className="text-right">{wo.quantity}</Td>
              <Td className="text-slate-500">{formatDate(wo.dueDate)}</Td>
              <Td><Badge tone={tone[wo.status]}>{wo.status.replace("_", " ").toLowerCase()}</Badge></Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  {wo.status === "PLANNED" && (
                    <form action={setWorkOrderStatus}>
                      <input type="hidden" name="id" value={wo.id} />
                      <input type="hidden" name="status" value="IN_PROGRESS" />
                      <button className="text-sm font-medium text-blue-600 hover:underline">Start</button>
                    </form>
                  )}
                  {wo.status === "IN_PROGRESS" && (
                    <form action={setWorkOrderStatus}>
                      <input type="hidden" name="id" value={wo.id} />
                      <input type="hidden" name="status" value="COMPLETED" />
                      <button className="text-sm font-medium text-emerald-600 hover:underline">Complete</button>
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
