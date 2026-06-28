import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Table, Th, Td, EmptyRow, Badge, PageHeader, Input, Select, Textarea } from "@/components/ui";
import { ModalForm } from "@/components/modal-form";
import { createLeave, setLeaveStatus } from "@/app/actions/hrm";
import { formatDate } from "@/lib/utils";

const tone: Record<string, "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export default async function LeavePage() {
  const { organizationId } = await requireSession();
  const [requests, employees] = await Promise.all([
    prisma.leaveRequest.findMany({ where: { organizationId }, include: { employee: true }, orderBy: { createdAt: "desc" } }),
    prisma.employee.findMany({ where: { organizationId, status: { not: "TERMINATED" } }, orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        action={
          <ModalForm triggerLabel="Request" title="New Leave Request" action={createLeave}>
            <Select name="employeeId" label="Employee" required>
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </Select>
            <Select name="type" label="Leave type" defaultValue="ANNUAL">
              <option value="ANNUAL">Annual</option>
              <option value="SICK">Sick</option>
              <option value="UNPAID">Unpaid</option>
              <option value="MATERNITY">Maternity</option>
              <option value="OTHER">Other</option>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input name="startDate" label="From" type="date" required />
              <Input name="endDate" label="To" type="date" required />
            </div>
            <Textarea name="reason" label="Reason" rows={2} />
          </ModalForm>
        }
      />
      <Card>
        <Table head={<tr><Th>Employee</Th><Th>Type</Th><Th>Period</Th><Th>Status</Th><Th className="text-right">Action</Th></tr>}>
          {requests.length === 0 && <EmptyRow colSpan={5} message="No leave requests yet." />}
          {requests.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-slate-900">{r.employee.firstName} {r.employee.lastName}</Td>
              <Td>{r.type.toLowerCase()}</Td>
              <Td className="text-slate-500">{formatDate(r.startDate)} → {formatDate(r.endDate)}</Td>
              <Td><Badge tone={tone[r.status]}>{r.status.toLowerCase()}</Badge></Td>
              <Td className="text-right">
                {r.status === "PENDING" && (
                  <div className="flex justify-end gap-2">
                    <form action={setLeaveStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button className="text-sm font-medium text-emerald-600 hover:underline">Approve</button>
                    </form>
                    <form action={setLeaveStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button className="text-sm font-medium text-rose-600 hover:underline">Reject</button>
                    </form>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
